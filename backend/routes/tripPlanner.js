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
      }
    ];

    res.json({
      success: true,
      data: { templates }
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

module.exports = router;
