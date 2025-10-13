const express = require('express');
const admin = require('firebase-admin');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Get emergency contacts
router.get('/emergency-contacts', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const emergencyContacts = [
      { name: 'Police', number: '100', type: 'police' },
      { name: 'Ambulance', number: '108', type: 'medical' },
      { name: 'Fire Service', number: '101', type: 'fire' },
      { name: 'Tourist Helpline', number: '1800-425-4747', type: 'tourist' },
      { name: 'Women Helpline', number: '1091', type: 'women_safety' }
    ];

    const nearbyServices = [
      {
        name: 'Kochi General Hospital',
        type: 'hospital',
        distance: '2.1 km',
        phone: '+91-484-2358001',
        location: { lat: parseFloat(lat) + 0.01, lng: parseFloat(lng) + 0.01 }
      },
      {
        name: 'Ernakulam Police Station',
        type: 'police',
        distance: '1.5 km',
        phone: '+91-484-2361000',
        location: { lat: parseFloat(lat) - 0.005, lng: parseFloat(lng) + 0.005 }
      }
    ];

    res.json({
      success: true,
      data: {
        emergencyContacts,
        nearbyServices,
        location: { lat, lng }
      }
    });

  } catch (error) {
    console.error('Emergency contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
