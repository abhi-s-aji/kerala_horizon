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
        { name: 'Public Transport User', earned: true, points: 200 },
        { name: 'Tree Hugger', earned: true, points: 150 },
        { name: 'Plastic Free', earned: false, points: 100 },
        { name: 'Carbon Neutral', earned: false, points: 300 }
      ],
      activities: [
        { name: 'Used public transport', points: 50, date: '2024-01-10' },
        { name: 'Visited eco-tourism site', points: 100, date: '2024-01-08' },
        { name: 'Used reusable water bottle', points: 25, date: '2024-01-05' }
      ],
      rewards: [
        { name: '10% off KTDC stays', points: 500, available: true },
        { name: 'Free eco-tour', points: 1000, available: false }
      ]
    };

    res.json({
      success: true,
      data: greenScoreData
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

module.exports = router;
