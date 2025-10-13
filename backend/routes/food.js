const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'demo_key';

// Search restaurants
router.get('/restaurants/search', async (req, res) => {
  try {
    const { 
      lat, lng, radius = 5000, 
      cuisine = 'all', 
      priceRange = 'all',
      rating = 0,
      dietary = [],
      openNow = false
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const cacheKey = `food_search_${lat}_${lng}_${radius}_${cuisine}_${priceRange}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Try Google Places API
    let restaurants = [];
    
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${lat},${lng}`,
          radius: radius,
          type: 'restaurant',
          keyword: cuisine !== 'all' ? cuisine : undefined,
          key: GOOGLE_PLACES_API_KEY
        },
        timeout: 10000
      });

      if (response.data && response.data.results) {
        restaurants = response.data.results.map(place => ({
          id: place.place_id,
          name: place.name,
          rating: place.rating || 0,
          priceLevel: place.price_level || 0,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            address: place.vicinity
          },
          types: place.types || [],
          openNow: place.opening_hours?.open_now || false,
          photos: place.photos?.map(photo => 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          ) || []
        }));
      }
    } catch (apiError) {
      console.warn('Google Places API error, using mock data:', apiError.message);
      
      // Fallback to mock data
      restaurants = [
        {
          id: 'rest_001',
          name: 'Paragon Restaurant',
          rating: 4.5,
          priceLevel: 2,
          location: {
            lat: parseFloat(lat) + 0.001,
            lng: parseFloat(lng) + 0.001,
            address: 'Near Marine Drive, Kochi'
          },
          types: ['restaurant', 'food', 'kerala'],
          openNow: true,
          photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400']
        },
        {
          id: 'rest_002',
          name: 'Grand Hotel Restaurant',
          rating: 4.2,
          priceLevel: 3,
          location: {
            lat: parseFloat(lat) - 0.001,
            lng: parseFloat(lng) + 0.002,
            address: 'Fort Kochi'
          },
          types: ['restaurant', 'seafood', 'fine_dining'],
          openNow: true,
          photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400']
        }
      ];
    }

    const responseData = {
      searchParams: { lat, lng, radius, cuisine, priceRange, rating, dietary, openNow },
      restaurants,
      total: restaurants.length,
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, responseData);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Restaurant search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search restaurants',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get cuisine guide
router.get('/cuisine/guide', async (req, res) => {
  try {
    const { cuisine = 'all', region = 'all' } = req.query;

    const cuisineGuide = {
      kerala: {
        name: 'Kerala Cuisine',
        description: 'Traditional South Indian cuisine with coconut, rice, and seafood',
        popularDishes: [
          { name: 'Appam', description: 'Rice pancakes with coconut milk', price: '₹50-80' },
          { name: 'Fish Curry', description: 'Traditional Kerala fish curry with coconut', price: '₹150-250' },
          { name: 'Puttu', description: 'Steamed rice cake with coconut', price: '₹40-60' },
          { name: 'Biryani', description: 'Malabar style biryani with spices', price: '₹200-350' }
        ],
        ingredients: ['Coconut', 'Rice', 'Fish', 'Curry Leaves', 'Mustard Seeds'],
        cookingMethods: ['Steaming', 'Currying', 'Frying', 'Boiling'],
        spiceLevel: 'Medium to Hot',
        bestTime: 'Lunch and Dinner',
        regions: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Kannur']
      },
      malabar: {
        name: 'Malabar Cuisine',
        description: 'Northern Kerala cuisine with Arabic influences',
        popularDishes: [
          { name: 'Malabar Biryani', description: 'Aromatic rice with meat and spices', price: '₹180-300' },
          { name: 'Pathiri', description: 'Rice flour flatbread', price: '₹30-50' },
          { name: 'Kozhikode Halwa', description: 'Sweet confectionery', price: '₹100-150' }
        ],
        ingredients: ['Rice', 'Meat', 'Ghee', 'Saffron', 'Cardamom'],
        cookingMethods: ['Dum Cooking', 'Grilling', 'Roasting'],
        spiceLevel: 'Medium',
        bestTime: 'Dinner',
        regions: ['Kozhikode', 'Kannur', 'Malappuram']
      }
    };

    const responseData = {
      cuisine: cuisine === 'all' ? cuisineGuide : { [cuisine]: cuisineGuide[cuisine] || {} },
      region,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Cuisine guide error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cuisine guide',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get cooking classes
router.get('/cooking/classes', async (req, res) => {
  try {
    const { lat, lng, radius = 10000, cuisine = 'all' } = req.query;

    const cookingClasses = [
      {
        id: 'cc_001',
        name: 'Traditional Kerala Cooking',
        instructor: 'Chef Rajesh',
        cuisine: 'kerala',
        duration: '3 hours',
        maxParticipants: 8,
        price: 1500,
        location: {
          lat: parseFloat(lat) + 0.002,
          lng: parseFloat(lng) + 0.001,
          address: 'Kochi Cooking School'
        },
        dishes: ['Appam', 'Fish Curry', 'Vegetable Stew'],
        includes: ['Ingredients', 'Recipe Book', 'Certificate'],
        rating: 4.7,
        reviews: 156,
        nextClass: '2024-01-15T10:00:00Z'
      },
      {
        id: 'cc_002',
        name: 'Malabar Biryani Masterclass',
        instructor: 'Chef Amina',
        cuisine: 'malabar',
        duration: '4 hours',
        maxParticipants: 6,
        price: 2000,
        location: {
          lat: parseFloat(lat) - 0.001,
          lng: parseFloat(lng) - 0.002,
          address: 'Kozhikode Culinary Center'
        },
        dishes: ['Malabar Biryani', 'Raita', 'Pickle'],
        includes: ['Premium Ingredients', 'Takeaway Portion', 'Certificate'],
        rating: 4.9,
        reviews: 89,
        nextClass: '2024-01-18T14:00:00Z'
      }
    ];

    const responseData = {
      searchParams: { lat, lng, radius, cuisine },
      classes: cookingClasses,
      total: cookingClasses.length,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Cooking classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cooking classes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;