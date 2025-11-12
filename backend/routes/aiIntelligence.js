const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const { 
  addDocument, 
  getDocument, 
  updateDocument, 
  queryDocuments,
  COLLECTIONS 
} = require('../services/firebase');

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// AI Concierge - Smart recommendations
router.post('/concierge', [
  body('location').notEmpty(),
  body('mood').optional().isString(),
  body('time').optional().isISO8601(),
  body('preferences').optional().isObject()
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

    const { location, mood, time, preferences = {} } = req.body;
    const userId = req.user.uid;

    // Get user profile for personalized recommendations
    const user = await getDocument(COLLECTIONS.USERS, userId);
    const userPreferences = user?.preferences || {};

    // Generate AI recommendations
    const recommendations = await generateAIRecommendations({
      location,
      mood,
      time,
      preferences: { ...preferences, ...userPreferences },
      userId
    });

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('AI Concierge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
});

// Surprise Me Mode - Randomized itinerary
router.post('/surprise-me', [
  body('location').notEmpty(),
  body('duration').isInt({ min: 1, max: 7 }),
  body('budget').optional().isFloat({ min: 0 }),
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

    const { location, duration, budget, interests = [] } = req.body;
    const userId = req.user.uid;

    const surpriseItinerary = await generateSurpriseItinerary({
      location,
      duration,
      budget,
      interests,
      userId
    });

    res.json({
      success: true,
      itinerary: surpriseItinerary
    });
  } catch (error) {
    console.error('Surprise Me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate surprise itinerary'
    });
  }
});

// Language Assistant - Translation
router.post('/translate', [
  body('text').notEmpty(),
  body('from').optional().isString(),
  body('to').optional().isString()
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

    const { text, from = 'auto', to = 'en' } = req.body;

    const translation = await translateText(text, from, to);

    res.json({
      success: true,
      translation
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate text'
    });
  }
});

// Voice translation
router.post('/voice-translate', [
  body('audioUrl').notEmpty(),
  body('from').optional().isString(),
  body('to').optional().isString()
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

    const { audioUrl, from = 'auto', to = 'en' } = req.body;

    const voiceTranslation = await translateVoice(audioUrl, from, to);

    res.json({
      success: true,
      translation: voiceTranslation
    });
  } catch (error) {
    console.error('Voice translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate voice'
    });
  }
});

// Packing Assistant
router.post('/packing-assistant', [
  body('tripType').isIn(['business', 'leisure', 'adventure', 'family', 'solo']),
  body('duration').isInt({ min: 1, max: 30 }),
  body('destination').notEmpty(),
  body('season').optional().isString(),
  body('activities').optional().isArray()
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

    const { tripType, duration, destination, season, activities = [] } = req.body;

    const packingList = await generatePackingList({
      tripType,
      duration,
      destination,
      season,
      activities
    });

    res.json({
      success: true,
      packingList
    });
  } catch (error) {
    console.error('Packing assistant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate packing list'
    });
  }
});

// Safety Alerts
router.get('/safety-alerts', async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const alerts = await getSafetyAlerts(lat, lng, radius);

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Safety alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch safety alerts'
    });
  }
});

// Expense Optimizer
router.post('/expense-optimizer', [
  body('budget').isFloat({ min: 0 }),
  body('duration').isInt({ min: 1 }),
  body('destination').notEmpty(),
  body('preferences').optional().isObject()
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

    const { budget, duration, destination, preferences = {} } = req.body;

    const optimization = await optimizeExpenses({
      budget,
      duration,
      destination,
      preferences
    });

    res.json({
      success: true,
      optimization
    });
  } catch (error) {
    console.error('Expense optimizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize expenses'
    });
  }
});

// Weather-based recommendations
router.get('/weather-recommendations', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const recommendations = await getWeatherRecommendations(lat, lng);

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Weather recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weather recommendations'
    });
  }
});

// Helper functions
async function generateAIRecommendations({ location, mood, time, preferences, userId }) {
  try {
    // Mock AI recommendations based on location, mood, and preferences
    const recommendations = {
      restaurants: [
        {
          name: 'Traditional Kerala Restaurant',
          type: 'local_cuisine',
          rating: 4.5,
          priceRange: '₹200-500',
          reason: 'Perfect for experiencing authentic Kerala flavors',
          distance: '0.5 km'
        }
      ],
      attractions: [
        {
          name: 'Fort Kochi Heritage Walk',
          type: 'cultural',
          duration: '2-3 hours',
          reason: 'Rich cultural experience with historical significance',
          distance: '1.2 km'
        }
      ],
      activities: [
        {
          name: 'Backwater Cruise',
          type: 'nature',
          duration: '4 hours',
          reason: 'Relaxing experience in Kerala\'s famous backwaters',
          distance: '15 km'
        }
      ],
      shopping: [
        {
          name: 'Spice Market',
          type: 'local_products',
          reason: 'Authentic Kerala spices and local products',
          distance: '0.8 km'
        }
      ]
    };

    return recommendations;
  } catch (error) {
    console.error('AI recommendations error:', error);
    throw error;
  }
}

async function generateSurpriseItinerary({ location, duration, budget, interests, userId }) {
  try {
    const itinerary = {
      title: `Surprise ${duration}-Day Kerala Adventure`,
      destination: location,
      duration: duration,
      budget: budget,
      days: []
    };

    // Generate random itinerary for each day
    for (let day = 1; day <= duration; day++) {
      const dayPlan = {
        day: day,
        date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activities: [
          {
            time: '09:00',
            activity: 'Morning Heritage Walk',
            location: 'Fort Kochi',
            duration: '2 hours',
            cost: '₹100'
          },
          {
            time: '12:00',
            activity: 'Traditional Lunch',
            location: 'Local Restaurant',
            duration: '1 hour',
            cost: '₹300'
          },
          {
            time: '14:00',
            activity: 'Backwater Cruise',
            location: 'Alleppey',
            duration: '3 hours',
            cost: '₹500'
          }
        ],
        totalCost: '₹900'
      };

      itinerary.days.push(dayPlan);
    }

    return itinerary;
  } catch (error) {
    console.error('Surprise itinerary error:', error);
    throw error;
  }
}

async function translateText(text, from, to) {
  try {
    // Mock translation - in production, use Google Translate API
    const translations = {
      'en-ml': {
        'hello': 'നമസ്കാരം',
        'thank you': 'നന്ദി',
        'good morning': 'സുപ്രഭാതം'
      },
      'ml-en': {
        'നമസ്കാരം': 'hello',
        'നന്ദി': 'thank you',
        'സുപ്രഭാതം': 'good morning'
      }
    };

    const translationKey = `${from}-${to}`;
    const translatedText = translations[translationKey]?.[text.toLowerCase()] || text;

    return {
      originalText: text,
      translatedText: translatedText,
      from: from,
      to: to,
      confidence: 0.95
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

async function translateVoice(audioUrl, from, to) {
  try {
    // Mock voice translation
    return {
      originalAudio: audioUrl,
      transcribedText: 'Hello, how are you?',
      translatedText: 'നമസ്കാരം, നിങ്ങൾക്ക് എങ്ങനെയുണ്ട്?',
      translatedAudio: 'translated_audio_url',
      from: from,
      to: to,
      confidence: 0.90
    };
  } catch (error) {
    console.error('Voice translation error:', error);
    throw error;
  }
}

async function generatePackingList({ tripType, duration, destination, season, activities }) {
  try {
    const baseItems = {
      clothing: ['T-shirts', 'Jeans', 'Underwear', 'Socks'],
      essentials: ['Toothbrush', 'Toothpaste', 'Shampoo', 'Soap'],
      documents: ['Passport', 'ID', 'Travel Insurance', 'Tickets']
    };

    const seasonalItems = {
      summer: ['Sunglasses', 'Sunscreen', 'Hat', 'Light clothes'],
      monsoon: ['Raincoat', 'Umbrella', 'Waterproof bag', 'Quick-dry clothes'],
      winter: ['Jacket', 'Sweater', 'Warm clothes', 'Gloves']
    };

    const activityItems = {
      adventure: ['Hiking boots', 'Backpack', 'Water bottle', 'First aid kit'],
      beach: ['Swimsuit', 'Beach towel', 'Flip flops', 'Sunscreen'],
      cultural: ['Comfortable shoes', 'Camera', 'Guidebook', 'Modest clothing']
    };

    const packingList = {
      tripType,
      duration,
      destination,
      season,
      categories: {
        clothing: [...baseItems.clothing, ...(seasonalItems[season] || [])],
        essentials: baseItems.essentials,
        documents: baseItems.documents,
        activities: activities.flatMap(activity => activityItems[activity] || [])
      },
      totalItems: 0,
      estimatedWeight: '15-20 kg'
    };

    // Calculate total items
    Object.values(packingList.categories).forEach(category => {
      packingList.totalItems += category.length;
    });

    return packingList;
  } catch (error) {
    console.error('Packing list error:', error);
    throw error;
  }
}

async function getSafetyAlerts(lat, lng, radius) {
  try {
    const alerts = [
      {
        id: 'safety_001',
        type: 'weather',
        severity: 'high',
        message: 'Heavy rainfall expected in the area',
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        recommendations: ['Avoid outdoor activities', 'Carry umbrella']
      },
      {
        id: 'safety_002',
        type: 'traffic',
        severity: 'medium',
        message: 'Road construction causing delays',
        location: { lat: parseFloat(lat) + 0.01, lng: parseFloat(lng) + 0.01 },
        validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        recommendations: ['Use alternative route', 'Allow extra time']
      }
    ];

    return alerts;
  } catch (error) {
    console.error('Safety alerts error:', error);
    throw error;
  }
}

async function optimizeExpenses({ budget, duration, destination, preferences }) {
  try {
    const optimization = {
      totalBudget: budget,
      dailyBudget: budget / duration,
      categories: {
        accommodation: {
          budget: budget * 0.4,
          suggestions: ['Budget hotels', 'Homestays', 'Hostels']
        },
        food: {
          budget: budget * 0.3,
          suggestions: ['Local restaurants', 'Street food', 'Cooking classes']
        },
        transport: {
          budget: budget * 0.2,
          suggestions: ['Public transport', 'Shared cabs', 'Bicycle rental']
        },
        activities: {
          budget: budget * 0.1,
          suggestions: ['Free walking tours', 'Museum visits', 'Nature trails']
        }
      },
      tips: [
        'Book accommodation in advance for better rates',
        'Try local street food for authentic experience',
        'Use public transport to save money',
        'Look for free activities and attractions'
      ]
    };

    return optimization;
  } catch (error) {
    console.error('Expense optimization error:', error);
    throw error;
  }
}

async function getWeatherRecommendations(lat, lng) {
  try {
    const recommendations = {
      currentWeather: {
        temperature: 28,
        condition: 'sunny',
        humidity: 75,
        windSpeed: 12
      },
      recommendations: [
        {
          activity: 'Beach visit',
          reason: 'Perfect weather for beach activities',
          time: 'Morning (9 AM - 12 PM)',
          location: 'Kovalam Beach'
        },
        {
          activity: 'Indoor museum tour',
          reason: 'Avoid afternoon heat',
          time: 'Afternoon (2 PM - 5 PM)',
          location: 'Kerala Museum'
        },
        {
          activity: 'Evening walk',
          reason: 'Cooler temperature in the evening',
          time: 'Evening (6 PM - 8 PM)',
          location: 'Marine Drive'
        }
      ],
      clothing: ['Light cotton clothes', 'Sunglasses', 'Hat', 'Sunscreen'],
      precautions: ['Stay hydrated', 'Avoid direct sun exposure', 'Use sunscreen']
    };

    return recommendations;
  } catch (error) {
    console.error('Weather recommendations error:', error);
    throw error;
  }
}

module.exports = router;













