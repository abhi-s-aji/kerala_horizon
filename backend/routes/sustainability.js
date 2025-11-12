const express = require('express');
const admin = require('firebase-admin');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Get green score data
router.get('/green-score', async (req, res) => {
  try {
    const { userId } = req.query;

    const greenScoreData = {
      totalScore: 1250,
      level: 'Eco Champion',
      badges: [
        { id: 'badge_001', name: 'Public Transport User', earned: true, points: 200, icon: '🚌' },
        { id: 'badge_002', name: 'Tree Hugger', earned: true, points: 150, icon: '🌳' },
        { id: 'badge_003', name: 'Plastic Free', earned: false, points: 100, icon: '♻️' },
        { id: 'badge_004', name: 'Carbon Neutral', earned: false, points: 300, icon: '🌱' },
        { id: 'badge_005', name: 'Eco Warrior', earned: true, points: 250, icon: '🛡️' }
      ],
      activities: [
        { id: 'act_001', name: 'Used public transport', points: 50, date: '2024-01-10', category: 'transport' },
        { id: 'act_002', name: 'Visited eco-tourism site', points: 100, date: '2024-01-08', category: 'tourism' },
        { id: 'act_003', name: 'Used reusable water bottle', points: 25, date: '2024-01-05', category: 'waste' },
        { id: 'act_004', name: 'Stayed in eco-friendly hotel', points: 150, date: '2024-01-03', category: 'accommodation' }
      ],
      rewards: [
        { id: 'reward_001', name: '10% off KTDC stays', points: 500, available: true, description: 'Discount on eco-friendly accommodations' },
        { id: 'reward_002', name: 'Free eco-tour', points: 1000, available: false, description: 'Complimentary guided eco-tourism experience' },
        { id: 'reward_003', name: 'Plant a tree', points: 200, available: true, description: 'Help plant a tree in Kerala' }
      ],
      carbonFootprint: {
        transport: 120,
        accommodation: 80,
        food: 60,
        activities: 40,
        total: 300
      }
    };

    res.json({
      success: true,
      ...greenScoreData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Green score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch green score data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add eco activity
router.post('/activity', async (req, res) => {
  try {
    const { activity, points, category } = req.body;

    if (!activity || !points) {
      return res.status(400).json({
        success: false,
        message: 'Activity and points are required'
      });
    }

    const newActivity = {
      id: `act_${Date.now()}`,
      name: activity,
      points: parseInt(points),
      date: new Date().toISOString(),
      category: category || 'general'
    };

    res.json({
      success: true,
      activity: newActivity,
      message: 'Eco activity added successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Add activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add eco activity',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
