const express = require('express');
const OpenAI = require('openai');
const admin = require('firebase-admin');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo_key'
});

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

// AI Concierge recommendations
router.post('/concierge', verifyFirebaseToken, async (req, res) => {
  try {
    const { 
      location, 
      interests = [], 
      budget, 
      duration, 
      groupSize = 1,
      preferences = {}
    } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const cacheKey = `ai_concierge_${JSON.stringify({ location, interests, budget, duration })}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Generate AI recommendations
    let recommendations = [];
    
    try {
      const prompt = `You are an AI travel concierge for Kerala, India. Based on the following preferences, provide personalized recommendations:

Location: ${location}
Interests: ${interests.join(', ')}
Budget: ${budget || 'Not specified'}
Duration: ${duration || 'Not specified'}
Group Size: ${groupSize}
Preferences: ${JSON.stringify(preferences)}

Please provide recommendations for:
1. Top 3 attractions to visit
2. 2-3 restaurants to try
3. 1-2 accommodation suggestions
4. Transportation tips
5. Cultural experiences
6. Budget-friendly options

Format the response as a JSON object with these categories.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
      });

      const aiResponse = completion.choices[0].message.content;
      
      // Parse AI response and structure it
      recommendations = parseAIRecommendations(aiResponse, location);
      
    } catch (aiError) {
      console.warn('OpenAI API error, using mock data:', aiError.message);
      
      // Fallback to mock recommendations
      recommendations = {
        attractions: [
          {
            name: 'Backwaters of Alleppey',
            description: 'Experience the serene backwaters on a houseboat',
            price: '₹2000-5000',
            duration: '4-8 hours',
            rating: 4.8,
            category: 'nature'
          },
          {
            name: 'Munnar Tea Gardens',
            description: 'Visit the beautiful tea plantations and enjoy scenic views',
            price: '₹500-1000',
            duration: '2-4 hours',
            rating: 4.6,
            category: 'nature'
          },
          {
            name: 'Kochi Fort Area',
            description: 'Explore the historic fort area with colonial architecture',
            price: '₹200-500',
            duration: '3-5 hours',
            rating: 4.4,
            category: 'culture'
          }
        ],
        restaurants: [
          {
            name: 'Paragon Restaurant',
            description: 'Famous for traditional Kerala cuisine',
            cuisine: 'Kerala',
            priceRange: '₹200-500',
            rating: 4.5,
            specialties: ['Fish Curry', 'Appam', 'Biryani']
          },
          {
            name: 'Grand Hotel Restaurant',
            description: 'Fine dining with Kerala specialties',
            cuisine: 'Multi-cuisine',
            priceRange: '₹500-1000',
            rating: 4.3,
            specialties: ['Seafood', 'Traditional Thali']
          }
        ],
        accommodations: [
          {
            name: 'KTDC Hotel Kochi',
            type: 'Government Hotel',
            price: '₹2000-3000',
            rating: 4.2,
            amenities: ['WiFi', 'Restaurant', 'Parking']
          },
          {
            name: 'Kerala Homestay',
            type: 'Homestay',
            price: '₹1500-2500',
            rating: 4.6,
            amenities: ['Traditional Food', 'Cultural Experience', 'Garden']
          }
        ],
        transportation: [
          'Use KSRTC buses for inter-city travel',
          'Local autos and cabs available for city transport',
          'Houseboats for backwater experiences',
          'Trains connect major cities efficiently'
        ],
        culturalExperiences: [
          'Kathakali performance at Kerala Kathakali Centre',
          'Traditional cooking class',
          'Visit to spice plantations',
          'Ayurvedic spa treatment'
        ],
        budgetTips: [
          'Stay in PWD rest houses for affordable accommodation',
          'Use public transport for cost-effective travel',
          'Try local street food for authentic flavors',
          'Visit free attractions like beaches and temples'
        ]
      };
    }

    const responseData = {
      request: { location, interests, budget, duration, groupSize, preferences },
      recommendations,
      generatedAt: new Date().toISOString()
    };

    // Cache for 5 minutes
    cache.set(cacheKey, responseData);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('AI concierge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Surprise me itinerary
router.post('/surprise-me', verifyFirebaseToken, async (req, res) => {
  try {
    const { 
      location, 
      mood = 'adventure',
      duration = '1 day',
      budget = 'medium'
    } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    // Generate surprise itinerary based on mood
    const surpriseItinerary = generateSurpriseItinerary(location, mood, duration, budget);

    res.json({
      success: true,
      data: {
        request: { location, mood, duration, budget },
        itinerary: surpriseItinerary,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Surprise itinerary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate surprise itinerary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Translate text
router.post('/translate', async (req, res) => {
  try {
    const { text, fromLang = 'auto', toLang = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text to translate is required'
      });
    }

    // Mock translation - replace with real translation API
    const translations = {
      'en': {
        'hi': translateToHindi(text),
        'ml': translateToMalayalam(text),
        'ta': translateToTamil(text),
        'ar': translateToArabic(text),
        'de': translateToGerman(text)
      },
      'hi': {
        'en': translateToEnglish(text),
        'ml': translateToMalayalam(text)
      },
      'ml': {
        'en': translateToEnglish(text),
        'hi': translateToHindi(text)
      }
    };

    const translatedText = translations[fromLang]?.[toLang] || text;

    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        fromLang,
        toLang,
        confidence: 0.95
      }
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate text',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// AI packing assistant
router.post('/packing-assistant', verifyFirebaseToken, async (req, res) => {
  try {
    const { 
      destination, 
      duration, 
      season, 
      activities = [],
      preferences = {}
    } = req.body;

    if (!destination || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Destination and duration are required'
      });
    }

    const packingList = generatePackingList(destination, duration, season, activities, preferences);

    res.json({
      success: true,
      data: {
        request: { destination, duration, season, activities, preferences },
        packingList,
        tips: [
          'Pack light, Kerala weather is warm and humid',
          'Bring rain gear during monsoon season (June-September)',
          'Comfortable walking shoes are essential',
          'Modest clothing for temple visits',
          'Sunscreen and mosquito repellent recommended'
        ]
      }
    });

  } catch (error) {
    console.error('Packing assistant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate packing list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions
function parseAIRecommendations(aiResponse, location) {
  // Parse AI response and extract structured data
  // This is a simplified parser - in production, use proper JSON parsing
  try {
    return JSON.parse(aiResponse);
  } catch (error) {
    // Fallback to mock data if parsing fails
    return {
      attractions: [],
      restaurants: [],
      accommodations: [],
      transportation: [],
      culturalExperiences: [],
      budgetTips: []
    };
  }
}

function generateSurpriseItinerary(location, mood, duration, budget) {
  const itineraries = {
    adventure: {
      morning: 'Early morning trek to hill station',
      afternoon: 'White water rafting or kayaking',
      evening: 'Campfire and stargazing'
    },
    relaxation: {
      morning: 'Ayurvedic spa treatment',
      afternoon: 'Beach relaxation or backwater cruise',
      evening: 'Sunset meditation session'
    },
    cultural: {
      morning: 'Temple visit and traditional breakfast',
      afternoon: 'Museum and art gallery tour',
      evening: 'Kathakali performance'
    },
    family: {
      morning: 'Wildlife sanctuary visit',
      afternoon: 'Theme park or beach activities',
      evening: 'Family dinner at traditional restaurant'
    }
  };

  return itineraries[mood] || itineraries.adventure;
}

function generatePackingList(destination, duration, season, activities, preferences) {
  const baseItems = [
    'Clothes (light cotton recommended)',
    'Comfortable walking shoes',
    'Sunscreen (SPF 30+)',
    'Mosquito repellent',
    'Basic first aid kit',
    'Camera/phone charger',
    'Water bottle'
  ];

  const seasonalItems = {
    summer: ['Light cotton clothes', 'Hat', 'Sunglasses'],
    monsoon: ['Raincoat', 'Umbrella', 'Waterproof bags'],
    winter: ['Light jacket', 'Long sleeves']
  };

  const activityItems = {
    trekking: ['Hiking boots', 'Backpack', 'Trekking poles'],
    beach: ['Swimwear', 'Beach towel', 'Flip flops'],
    temple: ['Modest clothing', 'Scarf for covering head'],
    backwater: ['Light clothes', 'Camera', 'Binoculars']
  };

  return {
    essentials: baseItems,
    seasonal: seasonalItems[season] || [],
    activities: activities.flatMap(activity => activityItems[activity] || []),
    recommended: [
      'Kerala guidebook',
      'Power bank',
      'Universal adapter',
      'Snacks for travel'
    ]
  };
}

// Mock translation functions
function translateToHindi(text) { return `Hindi: ${text}`; }
function translateToMalayalam(text) { return `Malayalam: ${text}`; }
function translateToTamil(text) { return `Tamil: ${text}`; }
function translateToArabic(text) { return `Arabic: ${text}`; }
function translateToGerman(text) { return `German: ${text}`; }
function translateToEnglish(text) { return `English: ${text}`; }

module.exports = router;
