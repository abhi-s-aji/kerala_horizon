const express = require('express');
const admin = require('firebase-admin');
const Joi = require('joi');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes cache

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

// Search accommodations
router.get('/search', async (req, res) => {
  try {
    const { 
      lat, lng, radius = 10000, 
      checkIn, checkOut, 
      guests = 2, 
      category = 'all',
      priceMin, priceMax,
      rating = 0,
      amenities = []
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const cacheKey = `stay_search_${lat}_${lng}_${radius}_${checkIn}_${checkOut}_${guests}_${category}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Mock accommodation data - replace with real KTDC/PWD API
    const accommodations = [
      {
        id: 'acc_001',
        name: 'KTDC Hotel Kochi',
        type: 'hotel',
        category: 'government',
        rating: 4.2,
        price: 2500,
        location: { 
          lat: parseFloat(lat) + 0.001, 
          lng: parseFloat(lng) + 0.001,
          city: 'Kochi',
          address: 'Near Marine Drive, Kochi'
        },
        amenities: ['WiFi', 'Parking', 'Restaurant', 'AC'],
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'],
        available: true,
        distance: '0.5 km'
      },
      {
        id: 'acc_002',
        name: 'PWD Rest House Munnar',
        type: 'rest_house',
        category: 'government',
        rating: 3.8,
        price: 1200,
        location: { 
          lat: parseFloat(lat) + 0.002, 
          lng: parseFloat(lng) - 0.001,
          city: 'Munnar',
          address: 'Munnar Hill Station'
        },
        amenities: ['WiFi', 'Parking', 'Garden'],
        images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400'],
        available: true,
        distance: '2.1 km'
      },
      {
        id: 'acc_003',
        name: 'Kerala Homestay',
        type: 'homestay',
        category: 'private',
        rating: 4.5,
        price: 1800,
        location: { 
          lat: parseFloat(lat) - 0.001, 
          lng: parseFloat(lng) + 0.002,
          city: 'Alleppey',
          address: 'Backwater View, Alleppey'
        },
        amenities: ['WiFi', 'Breakfast', 'Boat Ride', 'Traditional Food'],
        images: ['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400'],
        available: true,
        distance: '1.8 km'
      }
    ];

    const responseData = {
      searchParams: { lat, lng, radius, checkIn, checkOut, guests, category },
      accommodations,
      total: accommodations.length,
      filters: {
        priceRange: { min: 800, max: 5000 },
        categories: ['government', 'private', 'luxury'],
        amenities: ['WiFi', 'Parking', 'Restaurant', 'AC', 'Pool', 'Spa']
      },
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, responseData);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Accommodation search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search accommodations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Book accommodation
router.post('/:id/book', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, guests, rooms = 1, guestDetails } = req.body;
    const { uid } = req.user;

    if (!checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        message: 'Check-in, check-out dates and number of guests are required'
      });
    }

    // Create booking
    const bookingId = crypto.randomUUID();
    const booking = {
      id: bookingId,
      userId: uid,
      accommodationId: id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: parseInt(guests),
      rooms: parseInt(rooms),
      guestDetails: guestDetails || [],
      status: 'pending',
      totalAmount: 0, // Will be calculated based on accommodation
      paymentStatus: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('bookings').doc(bookingId).set(booking);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId,
        status: 'pending',
        nextStep: 'payment'
      }
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user bookings
router.get('/bookings/my', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = db.collection('bookings')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(parseInt(limit)).offset(parseInt(offset)).get();
    
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: {
        bookings,
        total: bookings.length
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;