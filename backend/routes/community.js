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
        authorAvatar: 'https://i.pravatar.cc/150?img=1',
        title: 'Amazing Backwater Experience in Alleppey',
        content: 'Just spent an incredible day on the backwaters. The houseboat experience was magical! Highly recommend booking through KTDC.',
        category: 'travel_tips',
        likes: 45,
        comments: 12,
        images: ['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400'],
        location: 'Alleppey',
        createdAt: '2024-01-10T14:30:00Z',
        tags: ['backwaters', 'houseboat', 'ktdc']
      },
      {
        id: 'post_002',
        author: 'FoodieExplorer',
        authorAvatar: 'https://i.pravatar.cc/150?img=2',
        title: 'Best Street Food in Kochi',
        content: 'Found some amazing local delicacies at Fort Kochi. The fish curry and appam were out of this world!',
        category: 'food',
        likes: 32,
        comments: 8,
        images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'],
        location: 'Kochi',
        createdAt: '2024-01-09T16:45:00Z',
        tags: ['street-food', 'kochi', 'local-cuisine']
      },
      {
        id: 'post_003',
        author: 'NatureLover',
        authorAvatar: 'https://i.pravatar.cc/150?img=3',
        title: 'Munnar Tea Gardens - Breathtaking Views',
        content: 'The tea plantations in Munnar are absolutely stunning. Perfect for photography and peaceful walks.',
        category: 'nature',
        likes: 67,
        comments: 15,
        images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
        location: 'Munnar',
        createdAt: '2024-01-08T10:20:00Z',
        tags: ['tea-gardens', 'munnar', 'nature']
      }
    ];

    // Filter by category if specified
    let filteredPosts = category === 'all' ? posts : posts.filter(p => p.category === category);

    res.json({
      success: true,
      posts: filteredPosts,
      total: filteredPosts.length,
      pagination: { 
        limit: parseInt(limit), 
        offset: parseInt(offset), 
        hasMore: filteredPosts.length > parseInt(offset) + parseInt(limit)
      },
      timestamp: new Date().toISOString()
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

// Create community post
router.post('/posts', async (req, res) => {
  try {
    const { title, content, category, location, images = [], tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const newPost = {
      id: `post_${Date.now()}`,
      author: 'Current User',
      authorAvatar: 'https://i.pravatar.cc/150',
      title,
      content,
      category: category || 'general',
      likes: 0,
      comments: 0,
      images,
      location: location || 'Kerala',
      tags,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      post: newPost,
      message: 'Post created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
