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
        data: cachedData,
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
      data: responseData
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

module.exports = router;
