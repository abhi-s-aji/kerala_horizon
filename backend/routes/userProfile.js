const express = require('express');
const { body, validationResult } = require('express-validator');
const { 
  addDocument, 
  getDocument, 
  updateDocument, 
  queryDocuments,
  COLLECTIONS 
} = require('../services/firebase');

const router = express.Router();

// Get user profile with preferences
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await getDocument(COLLECTIONS.USERS, userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Get user's travel history
    const travelHistory = await queryDocuments(COLLECTIONS.TRIP_PLANS, [
      { field: 'userId', operator: '==', value: userId }
    ], { field: 'createdAt', direction: 'desc' }, 10);

    // Get user's green score
    const greenScore = await getDocument(COLLECTIONS.SUSTAINABILITY, userId);

    res.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
        travelHistory: travelHistory.length,
        greenScore: greenScore?.totalScore || 0,
        badges: greenScore?.badges || [],
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user preferences
router.put('/preferences', [
  body('language').optional().isIn(['en', 'ml', 'hi', 'ta', 'ar', 'de']),
  body('currency').optional().isIn(['INR', 'USD', 'EUR']),
  body('notifications').optional().isBoolean(),
  body('accessibility').optional().isObject(),
  body('travelStyle').optional().isIn(['budget', 'comfort', 'luxury']),
  body('interests').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.uid;
    const preferences = req.body;

    await updateDocument(COLLECTIONS.USERS, userId, {
      preferences: {
        ...preferences,
        updatedAt: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

// Get user's travel history
router.get('/travel-history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.uid;

    const trips = await queryDocuments(COLLECTIONS.TRIP_PLANS, [
      { field: 'userId', operator: '==', value: userId }
    ], { field: 'createdAt', direction: 'desc' }, parseInt(limit));

    res.json({
      success: true,
      trips: trips.map(trip => ({
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        greenScore: trip.greenScore,
        createdAt: trip.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: trips.length
      }
    });
  } catch (error) {
    console.error('Travel history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch travel history'
    });
  }
});

// Get user's achievements and badges
router.get('/achievements', async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get sustainability achievements
    const sustainability = await getDocument(COLLECTIONS.SUSTAINABILITY, userId);
    
    // Get community achievements
    const community = await queryDocuments(COLLECTIONS.COMMUNITY, [
      { field: 'userId', operator: '==', value: userId }
    ]);

    // Get wallet achievements
    const wallet = await getDocument(COLLECTIONS.WALLET, userId);

    const achievements = {
      sustainability: {
        greenScore: sustainability?.totalScore || 0,
        badges: sustainability?.badges || [],
        carbonSaved: sustainability?.carbonSaved || 0
      },
      community: {
        postsCount: community.filter(c => c.type === 'post').length,
        reviewsCount: community.filter(c => c.type === 'review').length,
        contributions: community.length
      },
      wallet: {
        totalSpent: wallet?.totalSpent || 0,
        transactionsCount: wallet?.transactionsCount || 0,
        savings: wallet?.savings || 0
      }
    };

    res.json({
      success: true,
      achievements
    });
  } catch (error) {
    console.error('Achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
});

// Update user location
router.post('/location', [
  body('lat').isFloat(),
  body('lng').isFloat(),
  body('address').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.uid;
    const { lat, lng, address } = req.body;

    await updateDocument(COLLECTIONS.USERS, userId, {
      currentLocation: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: address || '',
        updatedAt: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// Get nearby recommendations based on user preferences
router.get('/recommendations', async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;
    const userId = req.user.uid;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    // Get user preferences
    const user = await getDocument(COLLECTIONS.USERS, userId);
    const preferences = user?.preferences || {};

    // Get personalized recommendations
    const recommendations = await getPersonalizedRecommendations(
      parseFloat(lat), 
      parseFloat(lng), 
      parseInt(radius), 
      preferences
    );

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations'
    });
  }
});

// Helper functions
async function getPersonalizedRecommendations(lat, lng, radius, preferences) {
  try {
    const recommendations = {
      restaurants: [],
      attractions: [],
      accommodations: [],
      transport: []
    };

    // Get nearby restaurants based on dietary preferences
    if (preferences.dietary) {
      const restaurants = await queryDocuments(COLLECTIONS.RESTAURANTS, [
        { field: 'location.lat', operator: '>=', value: lat - 0.1 },
        { field: 'location.lat', operator: '<=', value: lat + 0.1 },
        { field: 'location.lng', operator: '>=', value: lng - 0.1 },
        { field: 'location.lng', operator: '<=', value: lng + 0.1 }
      ]);
      recommendations.restaurants = restaurants.slice(0, 5);
    }

    // Get nearby attractions based on interests
    if (preferences.interests) {
      const attractions = await queryDocuments(COLLECTIONS.CULTURAL_SITES, [
        { field: 'location.lat', operator: '>=', value: lat - 0.1 },
        { field: 'location.lat', operator: '<=', value: lat + 0.1 },
        { field: 'location.lng', operator: '>=', value: lng - 0.1 },
        { field: 'location.lng', operator: '<=', value: lng + 0.1 }
      ]);
      recommendations.attractions = attractions.slice(0, 5);
    }

    return recommendations;
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    return {
      restaurants: [],
      attractions: [],
      accommodations: [],
      transport: []
    };
  }
}

module.exports = router;










