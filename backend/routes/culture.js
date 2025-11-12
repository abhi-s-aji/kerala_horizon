const express = require('express');
const admin = require('firebase-admin');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes cache

// Get cultural experiences
router.get('/experiences', async (req, res) => {
  try {
    const { lat, lng, radius = 20000, category = 'all' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const cacheKey = `culture_experiences_${lat}_${lng}_${radius}_${category}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        ...cachedData,
        cached: true
      });
    }

    const experiences = [
      {
        id: 'exp_001',
        name: 'Kathakali Performance',
        type: 'performance',
        category: 'traditional_arts',
        description: 'Traditional Kerala dance-drama performance',
        location: {
          lat: parseFloat(lat) + 0.001,
          lng: parseFloat(lng) + 0.001,
          address: 'Kerala Kathakali Centre, Kochi'
        },
        duration: '2 hours',
        price: 500,
        rating: 4.7,
        nextShow: '2024-01-15T18:00:00Z',
        includes: ['Performance', 'Makeup Session', 'Cultural Explanation']
      },
      {
        id: 'exp_002',
        name: 'Ayurvedic Treatment',
        type: 'wellness',
        category: 'ayurveda',
        description: 'Traditional Ayurvedic massage and treatment',
        location: {
          lat: parseFloat(lat) - 0.002,
          lng: parseFloat(lng) + 0.002,
          address: 'Ayurvedic Resort, Munnar'
        },
        duration: '3 hours',
        price: 2500,
        rating: 4.8,
        nextAvailable: '2024-01-16T10:00:00Z',
        includes: ['Consultation', 'Treatment', 'Herbal Tea']
      },
      {
        id: 'exp_003',
        name: 'Theyyam Ritual',
        type: 'ritual',
        category: 'traditional_arts',
        description: 'Sacred ritual dance form of North Kerala',
        location: {
          lat: parseFloat(lat) + 0.003,
          lng: parseFloat(lng) - 0.003,
          address: 'Kannur, Kerala'
        },
        duration: '3-4 hours',
        price: 300,
        rating: 4.9,
        nextShow: '2024-01-20T18:00:00Z',
        includes: ['Performance', 'Ritual Explanation', 'Traditional Music']
      }
    ];

    const responseData = {
      searchParams: { lat, lng, radius, category },
      experiences,
      total: experiences.length,
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, responseData);

    res.json({
      success: true,
      ...responseData
    });

  } catch (error) {
    console.error('Cultural experiences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cultural experiences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get heritage sites
router.get('/heritage-sites', async (req, res) => {
  try {
    const { lat, lng, radius = 20000, type = 'all' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const heritageSites = [
      {
        id: 'hs_001',
        name: 'Padmanabhaswamy Temple',
        type: 'temple',
        location: {
          lat: 8.4827,
          lng: 76.9434,
          address: 'Thiruvananthapuram'
        },
        description: 'One of the 108 Divya Desams, famous for its Dravidian architecture',
        timings: '3:30 AM - 12:00 PM, 5:00 PM - 8:30 PM',
        entryFee: 0,
        rating: 4.8,
        significance: 'Sacred Hindu temple dedicated to Lord Vishnu'
      },
      {
        id: 'hs_002',
        name: 'Mattancherry Palace',
        type: 'palace',
        location: {
          lat: 9.9519,
          lng: 76.2594,
          address: 'Kochi'
        },
        description: 'Portuguese palace with beautiful murals',
        timings: '10:00 AM - 5:00 PM',
        entryFee: 5,
        rating: 4.5,
        significance: 'Historic palace showcasing Kerala mural art'
      }
    ];

    res.json({
      success: true,
      heritageSites,
      total: heritageSites.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Heritage sites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch heritage sites',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get art forms
router.get('/art-forms', async (req, res) => {
  try {
    const artForms = [
      {
        id: 'af_001',
        name: 'Kathakali',
        description: 'Classical dance-drama of Kerala',
        origin: '17th century Kerala',
        venues: ['Kerala Kalamandalam', 'Kochi Cultural Centre'],
        bookingInfo: 'Advance booking recommended',
        price: 500,
        duration: '2-4 hours',
        rating: 4.7
      },
      {
        id: 'af_002',
        name: 'Theyyam',
        description: 'Sacred ritual dance form',
        origin: 'Ancient Kerala',
        venues: ['Kannur Temples', 'North Kerala'],
        bookingInfo: 'Seasonal performances',
        price: 300,
        duration: '3-4 hours',
        rating: 4.9
      }
    ];

    res.json({
      success: true,
      artForms,
      total: artForms.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Art forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch art forms',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
