const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const Joi = require('joi');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// API Configuration
const API_CONFIG = {
  KSRTC: {
    baseURL: 'https://ksrtc.in/api',
    apiKey: process.env.KSRTC_API_KEY || 'demo_key'
  },
  IRCTC: {
    baseURL: 'https://api.irctc.com',
    apiKey: process.env.IRCTC_API_KEY || 'demo_key'
  },
  AVIATION_STACK: {
    baseURL: 'http://api.aviationstack.com/v1',
    apiKey: process.env.AVIATION_STACK_API_KEY || 'demo_key'
  },
  UBER: {
    baseURL: 'https://api.uber.com/v1.2',
    clientId: process.env.UBER_CLIENT_ID || 'demo_key'
  },
  OLA: {
    baseURL: 'https://devapi.olacabs.com',
    apiKey: process.env.OLA_API_KEY || 'demo_key'
  },
  GOOGLE_MAPS: {
    baseURL: 'https://maps.googleapis.com/maps/api',
    apiKey: process.env.GOOGLE_MAPS_API_KEY || 'demo_key'
  }
};

// Validation schemas
const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(1000).max(50000).default(5000)
});

const routeSchema = Joi.object({
  from: Joi.string().min(2).required(),
  to: Joi.string().min(2).required(),
  date: Joi.date().min('now').optional(),
  mode: Joi.string().valid('bus', 'train', 'flight', 'cab', 'water').required()
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

// Get location-based transport options
router.get('/location', async (req, res) => {
  try {
    const { error, value } = locationSchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { lat, lng, radius } = value;
    const cacheKey = `location_${lat}_${lng}_${radius}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Fetch data from multiple sources
    const [busStations, trainStations, airports, evStations, parkingSpots] = await Promise.allSettled([
      getNearbyBusStations(lat, lng, radius),
      getNearbyTrainStations(lat, lng, radius),
      getNearbyAirports(lat, lng, radius),
      getNearbyEVStations(lat, lng, radius),
      getNearbyParkingSpots(lat, lng, radius)
    ]);

    const locationData = {
      coordinates: { lat, lng },
      radius,
      transportOptions: {
        busStations: busStations.status === 'fulfilled' ? busStations.value : [],
        trainStations: trainStations.status === 'fulfilled' ? trainStations.value : [],
        airports: airports.status === 'fulfilled' ? airports.value : [],
        evStations: evStations.status === 'fulfilled' ? evStations.value : [],
        parkingSpots: parkingSpots.status === 'fulfilled' ? parkingSpots.value : []
      },
      timestamp: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, locationData);

    res.json({
      success: true,
      data: locationData
    });

  } catch (error) {
    console.error('Location transport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location transport data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get bus routes and schedules
router.get('/bus/routes', async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'From and to locations are required'
      });
    }

    const cacheKey = `bus_routes_${from}_${to}_${date || 'today'}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Try to fetch from KSRTC API
    let busRoutes = [];
    
    try {
      const response = await axios.get(`${API_CONFIG.KSRTC.baseURL}/routes`, {
        params: {
          from: from,
          to: to,
          date: date || new Date().toISOString().split('T')[0],
          api_key: API_CONFIG.KSRTC.apiKey
        },
        timeout: 10000
      });

      if (response.data && response.data.routes) {
        busRoutes = response.data.routes.map(route => ({
          id: route.route_id,
          routeNumber: route.route_number,
          from: route.from,
          to: route.to,
          departureTime: route.departure_time,
          arrivalTime: route.arrival_time,
          fare: route.fare,
          availableSeats: route.available_seats || 0,
          busType: route.bus_type || 'ordinary',
          operator: 'KSRTC',
          status: route.status || 'on-time',
          distance: route.distance,
          duration: route.duration
        }));
      }
    } catch (apiError) {
      console.warn('KSRTC API error, using mock data:', apiError.message);
      
      // Fallback to mock data
      busRoutes = [
        {
          id: '1',
          routeNumber: 'KSRTC-001',
          from: from,
          to: to,
          departureTime: '06:00',
          arrivalTime: '10:30',
          fare: 150,
          availableSeats: 25,
          busType: 'fast',
          operator: 'KSRTC',
          status: 'on-time',
          distance: '180 km',
          duration: '4h 30m'
        },
        {
          id: '2',
          routeNumber: 'SWIFT-002',
          from: from,
          to: to,
          departureTime: '08:30',
          arrivalTime: '12:45',
          fare: 200,
          availableSeats: 15,
          busType: 'ac',
          operator: 'KSRTC',
          status: 'on-time',
          distance: '180 km',
          duration: '4h 15m'
        }
      ];
    }

    const responseData = {
      from,
      to,
      date: date || new Date().toISOString().split('T')[0],
      routes: busRoutes,
      totalRoutes: busRoutes.length,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, responseData);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Bus routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bus routes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Track bus location
router.get('/bus/tracking', async (req, res) => {
  try {
    const { routeId, busNumber } = req.query;

    if (!routeId && !busNumber) {
      return res.status(400).json({
        success: false,
        message: 'Route ID or Bus Number is required'
      });
    }

    const cacheKey = `bus_tracking_${routeId}_${busNumber}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Try to fetch from KSRTC tracking API
    let busData = {};
    
    try {
      const response = await axios.get(`${API_CONFIG.KSRTC.baseURL}/tracking`, {
        params: {
          route_id: routeId,
          bus_number: busNumber,
          api_key: API_CONFIG.KSRTC.apiKey
        },
        timeout: 10000
      });

      if (response.data) {
        busData = {
          routeId: response.data.route_id,
          busNumber: response.data.bus_number,
          currentLocation: {
            lat: response.data.latitude,
            lng: response.data.longitude
          },
          nextStop: response.data.next_stop,
          estimatedArrival: response.data.estimated_arrival,
          status: response.data.status,
          speed: response.data.speed,
          lastUpdated: response.data.last_updated
        };
      }
    } catch (apiError) {
      console.warn('KSRTC tracking API error, using mock data:', apiError.message);
      
      // Fallback to mock data
      busData = {
        routeId: routeId || 'R001',
        busNumber: busNumber || 'KL-01-AB-1234',
        currentLocation: {
          lat: 10.5200 + (Math.random() - 0.5) * 0.01,
          lng: 76.3000 + (Math.random() - 0.5) * 0.01
        },
        nextStop: 'Kochi Metro Station',
        estimatedArrival: '5 minutes',
        status: 'on_time',
        speed: '45 km/h',
        lastUpdated: new Date().toISOString()
      };
    }

    // Cache for 30 seconds only (real-time data)
    cache.set(cacheKey, busData, 30);

    res.json({
      success: true,
      data: busData
    });

  } catch (error) {
    console.error('Bus tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track bus',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get train schedules
router.get('/train/schedules', async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'From and to stations are required'
      });
    }

    const cacheKey = `train_schedules_${from}_${to}_${date || 'today'}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Try to fetch from IRCTC API
    let trainSchedules = [];
    
    try {
      const response = await axios.get(`${API_CONFIG.IRCTC.baseURL}/trains`, {
        params: {
          from: from,
          to: to,
          date: date || new Date().toISOString().split('T')[0],
          api_key: API_CONFIG.IRCTC.apiKey
        },
        timeout: 10000
      });

      if (response.data && response.data.trains) {
        trainSchedules = response.data.trains.map(train => ({
          trainNumber: train.train_number,
          trainName: train.train_name,
          from: train.from_station,
          to: train.to_station,
          departureTime: train.departure_time,
          arrivalTime: train.arrival_time,
          fare: train.fare,
          availableSeats: train.available_seats || 0,
          status: train.status || 'on-time',
          duration: train.duration,
          class: train.class || 'SL'
        }));
      }
    } catch (apiError) {
      console.warn('IRCTC API error, using mock data:', apiError.message);
      
      // Fallback to mock data
      trainSchedules = [
        {
          trainNumber: '12625',
          trainName: 'Kerala Express',
          from: from,
          to: to,
          departureTime: '11:30',
          arrivalTime: '06:00+1',
          fare: 450,
          availableSeats: 120,
          status: 'on-time',
          duration: '18h 30m',
          class: 'SL'
        },
        {
          trainNumber: '12623',
          trainName: 'Mangala Express',
          from: from,
          to: to,
          departureTime: '22:45',
          arrivalTime: '16:30+1',
          fare: 520,
          availableSeats: 85,
          status: 'on-time',
          duration: '17h 45m',
          class: '3A'
        }
      ];
    }

    const responseData = {
      from,
      to,
      date: date || new Date().toISOString().split('T')[0],
      schedules: trainSchedules,
      totalSchedules: trainSchedules.length,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, responseData);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Train schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch train schedules',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get flight status
router.get('/flight/status', async (req, res) => {
  try {
    const { flightNumber, date, airport } = req.query;

    if (!flightNumber && !airport) {
      return res.status(400).json({
        success: false,
        message: 'Flight number or airport code is required'
      });
    }

    const cacheKey = `flight_status_${flightNumber}_${date}_${airport}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Try to fetch from Aviation Stack API
    let flightData = [];
    
    try {
      const params = {
        access_key: API_CONFIG.AVIATION_STACK.apiKey
      };

      if (flightNumber) {
        params.flight_iata = flightNumber;
      }
      if (airport) {
        params.dep_iata = airport;
      }
      if (date) {
        params.flight_date = date;
      }

      const response = await axios.get(`${API_CONFIG.AVIATION_STACK.baseURL}/flights`, {
        params,
        timeout: 10000
      });

      if (response.data && response.data.data) {
        flightData = response.data.data.map(flight => ({
          flightNumber: flight.flight.iata,
          airline: flight.airline.name,
          from: flight.departure.airport,
          to: flight.arrival.airport,
          scheduledDeparture: flight.departure.scheduled,
          actualDeparture: flight.departure.actual,
          scheduledArrival: flight.arrival.scheduled,
          actualArrival: flight.arrival.actual,
          status: flight.flight_status,
          gate: flight.departure.gate,
          terminal: flight.departure.terminal,
          delay: flight.departure.delay
        }));
      }
    } catch (apiError) {
      console.warn('Aviation Stack API error, using mock data:', apiError.message);
      
      // Fallback to mock data
      flightData = [
        {
          flightNumber: 'AI-501',
          airline: 'Air India',
          from: 'Mumbai',
          to: 'Kochi',
          scheduledDeparture: '14:30',
          actualDeparture: '14:45',
          scheduledArrival: '16:45',
          actualArrival: '17:00',
          status: 'delayed',
          gate: 'A12',
          terminal: 'T1',
          delay: 15
        }
      ];
    }

    const responseData = {
      query: { flightNumber, date, airport },
      flights: flightData,
      totalFlights: flightData.length,
      timestamp: new Date().toISOString()
    };

    // Cache for 2 minutes (flight data updates frequently)
    cache.set(cacheKey, responseData, 120);

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Flight status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flight status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get cab estimates
router.get('/cab/estimate', async (req, res) => {
  try {
    const { from, to, service } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'From and to locations are required'
      });
    }

    const cacheKey = `cab_estimate_${from}_${to}_${service || 'all'}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Get estimates from multiple cab services
    const estimates = await Promise.allSettled([
      getUberEstimate(from, to),
      getOlaEstimate(from, to),
      getLocalCabEstimate(from, to)
    ]);

    const cabEstimates = {
      from,
      to,
      services: [],
      timestamp: new Date().toISOString()
    };

    estimates.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        cabEstimates.services.push(result.value);
      }
    });

    // Cache for 5 minutes
    cache.set(cacheKey, cabEstimates);

    res.json({
      success: true,
      data: cabEstimates
    });

  } catch (error) {
    console.error('Cab estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cab estimates',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions
async function getNearbyBusStations(lat, lng, radius) {
  // Mock implementation - replace with real API
  return [
    {
      id: 'bs_001',
      name: 'KSRTC Bus Station',
      type: 'bus_station',
      location: { lat: lat + 0.001, lng: lng + 0.001 },
      distance: '0.5 km',
      routes: ['Kochi-Thiruvananthapuram', 'Kochi-Kozhikode']
    }
  ];
}

async function getNearbyTrainStations(lat, lng, radius) {
  // Mock implementation - replace with real API
  return [
    {
      id: 'ts_001',
      name: 'Ernakulam Junction',
      type: 'train_station',
      location: { lat: lat - 0.002, lng: lng + 0.002 },
      distance: '1.2 km',
      code: 'ERS'
    }
  ];
}

async function getNearbyAirports(lat, lng, radius) {
  // Mock implementation - replace with real API
  return [
    {
      id: 'ap_001',
      name: 'Cochin International Airport',
      type: 'airport',
      location: { lat: lat - 0.01, lng: lng - 0.01 },
      distance: '25 km',
      code: 'COK'
    }
  ];
}

async function getNearbyEVStations(lat, lng, radius) {
  // Mock implementation - replace with real API
  return [
    {
      id: 'ev_001',
      name: 'EV Charging Station - Kochi',
      type: 'ev_station',
      location: { lat: lat + 0.003, lng: lng - 0.003 },
      distance: '0.8 km',
      connectors: ['Type 2', 'CHAdeMO'],
      available: true
    }
  ];
}

async function getNearbyParkingSpots(lat, lng, radius) {
  // Mock implementation - replace with real API
  return [
    {
      id: 'ps_001',
      name: 'Marine Drive Parking',
      type: 'parking',
      location: { lat: lat - 0.001, lng: lng - 0.001 },
      distance: '0.3 km',
      available: true,
      rate: '₹20/hour'
    }
  ];
}

async function getUberEstimate(from, to) {
  // Mock implementation - replace with real Uber API
  return {
    service: 'Uber',
    estimates: [
      { type: 'Go', price: '₹150', duration: '15 min' },
      { type: 'Premier', price: '₹200', duration: '15 min' }
    ]
  };
}

async function getOlaEstimate(from, to) {
  // Mock implementation - replace with real Ola API
  return {
    service: 'Ola',
    estimates: [
      { type: 'Mini', price: '₹120', duration: '12 min' },
      { type: 'Sedan', price: '₹180', duration: '12 min' }
    ]
  };
}

async function getLocalCabEstimate(from, to) {
  // Mock implementation for local cab services
  return {
    service: 'Local Cab',
    estimates: [
      { type: 'Auto', price: '₹80', duration: '20 min' },
      { type: 'Cab', price: '₹160', duration: '18 min' }
    ]
  };
}

module.exports = router;