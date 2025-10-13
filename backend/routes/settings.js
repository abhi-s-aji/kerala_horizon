const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

const db = admin.firestore();

// Get app settings
router.get('/app', async (req, res) => {
  try {
    const settings = {
      languages: [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
        { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
        { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
        { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
        { code: 'de', name: 'German', flag: '🇩🇪' }
      ],
      currencies: [
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' }
      ],
      themes: ['light', 'dark', 'auto'],
      accessibility: {
        fontSize: ['small', 'medium', 'large'],
        contrast: ['normal', 'high'],
        voiceNavigation: true
      }
    };

    res.json({
      success: true,
      data: { settings }
    });

  } catch (error) {
    console.error('App settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app settings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
