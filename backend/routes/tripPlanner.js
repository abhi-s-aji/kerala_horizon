const express = require('express');
const admin = require('firebase-admin');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Get trip templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'template_001',
        name: 'Kerala Backwaters & Hills',
        duration: '7 days',
        budget: 'medium',
        destinations: ['Kochi', 'Alleppey', 'Munnar', 'Thekkady'],
        highlights: ['Backwater cruise', 'Tea gardens', 'Wildlife safari'],
        estimatedCost: 25000,
        difficulty: 'easy'
      },
      {
        id: 'template_002',
        name: 'Kerala Cultural Trail',
        duration: '5 days',
        budget: 'budget',
        destinations: ['Thiruvananthapuram', 'Kochi', 'Thrissur'],
        highlights: ['Temples', 'Museums', 'Traditional arts'],
        estimatedCost: 15000,
        difficulty: 'easy'
      },
      {
        id: 'template_003',
        name: 'Kerala Beach Paradise',
        duration: '4 days',
        budget: 'medium',
        destinations: ['Kovalam', 'Varkala', 'Alappuzha'],
        highlights: ['Beach activities', 'Ayurveda spas', 'Sunset views'],
        estimatedCost: 18000,
        difficulty: 'easy'
      }
    ];

    res.json({
      success: true,
      templates,
      total: templates.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trip templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip templates',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create trip plan
router.post('/plan', async (req, res) => {
  try {
    const { title, duration, budget, travelers, startDate, endDate, preferences } = req.body;

    if (!title || !duration || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Title, duration, and budget are required'
      });
    }

    // Generate itinerary based on preferences
    const itinerary = generateItinerary(duration, budget, preferences);

    const tripPlan = {
      id: `plan_${Date.now()}`,
      title,
      duration,
      budget,
      travelers: travelers || 1,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      preferences: preferences || {},
      itinerary,
      totalCost: calculateTotalCost(itinerary),
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      tripPlan,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create trip plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trip plan',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions
function generateItinerary(duration, budget, preferences) {
  const days = parseInt(duration) || 3;
  const itinerary = [];

  const activities = [
    { day: 1, activity: 'Arrival and check-in', location: 'Kochi', cost: 2000, duration: '2 hours' },
    { day: 1, activity: 'Fort Kochi tour', location: 'Kochi', cost: 500, duration: '3 hours' },
    { day: 2, activity: 'Backwater cruise', location: 'Alleppey', cost: 2500, duration: '4 hours' },
    { day: 2, activity: 'Traditional lunch', location: 'Alleppey', cost: 300, duration: '1 hour' },
    { day: 3, activity: 'Tea garden visit', location: 'Munnar', cost: 800, duration: '3 hours' },
    { day: 3, activity: 'Kathakali performance', location: 'Munnar', cost: 500, duration: '2 hours' }
  ];

  for (let i = 1; i <= days; i++) {
    const dayActivities = activities.filter(a => a.day === i);
    if (dayActivities.length === 0) {
      dayActivities.push({
        day: i,
        activity: 'Free day to explore',
        location: 'Kerala',
        cost: 0,
        duration: 'Full day'
      });
    }
    itinerary.push(...dayActivities);
  }

  return itinerary;
}

function calculateTotalCost(itinerary) {
  return itinerary.reduce((sum, item) => sum + (item.cost || 0), 0);
}

module.exports = router;
