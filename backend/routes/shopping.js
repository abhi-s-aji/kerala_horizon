const express = require('express');
const admin = require('firebase-admin');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes cache

// Get shopping locations
router.get('/stores', async (req, res) => {
  try {
    const { lat, lng, radius = 10000, category = 'all' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const stores = [
      {
        id: 'store_001',
        name: 'Kerala Handicrafts Emporium',
        category: 'handicrafts',
        location: {
          lat: parseFloat(lat) + 0.001,
          lng: parseFloat(lng) + 0.001,
          address: 'Marine Drive, Kochi'
        },
        rating: 4.5,
        specialties: ['Wooden sculptures', 'Coir products', 'Traditional jewelry'],
        priceRange: '₹500-5000',
        timings: '10:00 AM - 8:00 PM'
      },
      {
        id: 'store_002',
        name: 'Spice Market Kochi',
        category: 'spices',
        location: {
          lat: parseFloat(lat) - 0.002,
          lng: parseFloat(lng) + 0.002,
          address: 'Jew Town, Fort Kochi'
        },
        rating: 4.7,
        specialties: ['Black pepper', 'Cardamom', 'Cinnamon', 'Turmeric'],
        priceRange: '₹200-2000',
        timings: '9:00 AM - 7:00 PM'
      }
    ];

    res.json({
      success: true,
      data: {
        searchParams: { lat, lng, radius, category },
        stores,
        total: stores.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Shopping stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shopping stores',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
