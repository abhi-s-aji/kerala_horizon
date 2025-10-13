const express = require('express');
const admin = require('firebase-admin');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Get community posts
router.get('/posts', async (req, res) => {
  try {
    const { limit = 20, offset = 0, category = 'all' } = req.query;

    const posts = [
      {
        id: 'post_001',
        author: 'Traveler123',
        title: 'Amazing Backwater Experience in Alleppey',
        content: 'Just spent an incredible day on the backwaters...',
        category: 'travel_tips',
        likes: 45,
        comments: 12,
        images: ['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400'],
        location: 'Alleppey',
        createdAt: '2024-01-10T14:30:00Z'
      },
      {
        id: 'post_002',
        author: 'FoodieExplorer',
        title: 'Best Street Food in Kochi',
        content: 'Found some amazing local delicacies...',
        category: 'food',
        likes: 32,
        comments: 8,
        images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'],
        location: 'Kochi',
        createdAt: '2024-01-09T16:45:00Z'
      }
    ];

    res.json({
      success: true,
      data: {
        posts,
        total: posts.length,
        pagination: { limit, offset, hasMore: false }
      }
    });

  } catch (error) {
    console.error('Community posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community posts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
