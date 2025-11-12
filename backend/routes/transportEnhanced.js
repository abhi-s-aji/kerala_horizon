const express = require('express');
const axios = require('axios');
const { 
  addDocument, 
  getDocument, 
  updateDocument, 
  queryDocuments,
  COLLECTIONS 
} = require('../services/firebase');
const { cache } = require('../services/cache');

const router = express.Router();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const KSRTC_API_URL = process.env.KSRTC_API_URL;
const IRCTC_API_URL = process.env.IRCTC_API_URL;

// Real-time bus tracking with KSRTC integration
router.get('/bus/tracking', async (req, res) => {
  try {
    const { routeId, busNumber, stopId } = req.query;

    if (!routeId && !busNumber) {
      return res.status(400).json({
        success: false,
        message: 'Route ID or Bus Number is required'
      });
    }

    // Check cache first
    const cacheKey = `bus_tracking_${routeId || busNumber}`;
    let busData = await cache.get(cacheKey);

    if (!busData) {
      // Fetch from KSRTC API
      busData = await fetchKSRTCBusData(routeId, busNumber);
      
      // Cache for 2 minutes
      await cache.set(cacheKey, busData, 120);
    }

    res.json({
      success: true,
      busData
    });
  } catch (error) {
    console.error('Bus tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bus tracking data'
    });
  }
});

// Train schedules with IRCTC integration
router.get('/train/schedules', async (req, res) => {
  try {
    const { from, to, date, class: trainClass } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'From and To stations are required'
      });
    }

    const cacheKey = `train_schedules_${from}_${to}_${date}`;
    let schedules = await cache.get(cacheKey);

    if (!schedules) {
      schedules = await fetchIRCTCSchedules(from, to, date, trainClass);
      await cache.set(cacheKey, schedules, 300); // Cache for 5 minutes
    }

    res.json({
      success: true,
      schedules
    });
  } catch (error) {
    console.error('Train schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch train schedules'
    });
  }
});

// Flight status from multiple airports
router.get('/flight/status', async (req, res) => {
  try {
    const { flightNumber, date, airport = 'all' } = req.query;

    if (!flightNumber) {
      return res.status(400).json({
        success: false,
        message: 'Flight number is required'
      });
    }

    const airports = ['COK', 'TRV', 'CNN']; // Kochi, Trivandrum, Kannur
    const flightData = [];

    for (const apt of airports) {
      if (airport === 'all' || airport === apt) {
        const data = await fetchFlightStatus(flightNumber, apt, date);
        if (data) flightData.push(data);
      }
    }

    res.json({
      success: true,
      flights: flightData
    });
  } catch (error) {
    console.error('Flight status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flight status'
    });
  }
});

// Cab aggregator integration
router.get('/cab/estimate', async (req, res) => {
  try {
    const { from, to, service = 'all' } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'From and To locations are required'
      });
    }

    const estimates = await getCabEstimates(from, to, service);

    res.json({
      success: true,
      estimates
    });
  } catch (error) {
    console.error('Cab estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cab estimates'
    });
  }
});

// Water transport schedules
router.get('/water/schedules', async (req, res) => {
  try {
    const { from, to, date } = req.query;

    const schedules = await getWaterTransportSchedules(from, to, date);

    res.json({
      success: true,
      schedules
    });
  } catch (error) {
    console.error('Water transport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch water transport schedules'
    });
  }
});

// EV charging stations
router.get('/ev/stations', async (req, res) => {
  try {
    const { lat, lng, radius = 10000, connectorType = 'all' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const stations = await getEVChargingStations(lat, lng, radius, connectorType);

    res.json({
      success: true,
      stations
    });
  } catch (error) {
    console.error('EV stations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch EV stations'
    });
  }
});

// Parking spots
router.get('/parking/spots', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, type = 'all' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const spots = await getParkingSpots(lat, lng, radius, type);

    res.json({
      success: true,
      spots
    });
  } catch (error) {
    console.error('Parking spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parking spots'
    });
  }
});

// Traffic alerts
router.get('/traffic/alerts', async (req, res) => {
  try {
    const { lat, lng, radius = 20000 } = req.query;

    const alerts = await getTrafficAlerts(lat, lng, radius);

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error('Traffic alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch traffic alerts'
    });
  }
});

// Route planning with multiple modes
router.get('/route/plan', async (req, res) => {
  try {
    const { from, to, mode = 'driving', avoid = [], preferences = {} } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'From and To locations are required'
      });
    }

    const route = await getRoutePlan(from, to, mode, avoid, preferences);

    res.json({
      success: true,
      route
    });
  } catch (error) {
    console.error('Route planning error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to plan route'
    });
  }
});

// Save favorite routes
router.post('/route/favorite', async (req, res) => {
  try {
    const { name, from, to, mode, preferences = {} } = req.body;
    const userId = req.user.uid;

    const favoriteRoute = {
      userId,
      name,
      from,
      to,
      mode,
      preferences,
      createdAt: new Date().toISOString()
    };

    const savedRoute = await addDocument(COLLECTIONS.TRANSPORT, favoriteRoute);

    res.status(201).json({
      success: true,
      message: 'Route saved to favorites',
      route: savedRoute
    });
  } catch (error) {
    console.error('Save favorite route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save favorite route'
    });
  }
});

// Get user's favorite routes
router.get('/route/favorites', async (req, res) => {
  try {
    const userId = req.user.uid;

    const favoriteRoutes = await queryDocuments(COLLECTIONS.TRANSPORT, [
      { field: 'userId', operator: '==', value: userId }
    ], { field: 'createdAt', direction: 'desc' });

    res.json({
      success: true,
      routes: favoriteRoutes
    });
  } catch (error) {
    console.error('Favorite routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorite routes'
    });
  }
});

// Helper functions
async function fetchKSRTCBusData(routeId, busNumber) {
  try {
    // Mock KSRTC API integration
    const mockData = {
      routeId: routeId || 'R001',
      busNumber: busNumber || 'KL-01-AB-1234',
      currentLocation: {
        lat: 10.5200 + (Math.random() - 0.5) * 0.01,
        lng: 76.3000 + (Math.random() - 0.5) * 0.01
      },
      nextStop: 'Kochi Metro Station',
      estimatedArrival: '5 minutes',
      status: 'on_time',
      speed: '25 km/h',
      occupancy: '60%',
      lastUpdated: new Date().toISOString()
    };

    return mockData;
  } catch (error) {
    console.error('KSRTC API error:', error);
    throw error;
  }
}

async function fetchIRCTCSchedules(from, to, date, trainClass) {
  try {
    // Mock IRCTC API integration
    const mockSchedules = [
      {
        trainNumber: '12623',
        trainName: 'Kochuveli Express',
        from: from,
        to: to,
        departure: '06:00',
        arrival: '10:30',
        duration: '4h 30m',
        classes: {
          sleeper: { fare: 150, availability: 'WL-5' },
          ac: { fare: 450, availability: 'RAC-2' }
        },
        status: 'on_time'
      },
      {
        trainNumber: '12625',
        trainName: 'Kerala Express',
        from: from,
        to: to,
        departure: '14:30',
        arrival: '19:00',
        duration: '4h 30m',
        classes: {
          sleeper: { fare: 150, availability: 'Available' },
          ac: { fare: 450, availability: 'WL-3' }
        },
        status: 'on_time'
      }
    ];

    return mockSchedules;
  } catch (error) {
    console.error('IRCTC API error:', error);
    throw error;
  }
}

async function fetchFlightStatus(flightNumber, airport, date) {
  try {
    // Mock flight status
    const mockStatus = {
      flightNumber,
      airline: 'Air India',
      airport,
      from: 'COK',
      to: 'DEL',
      scheduledDeparture: '08:30',
      scheduledArrival: '11:45',
      actualDeparture: '08:35',
      actualArrival: '11:50',
      status: 'delayed',
      gate: 'A12',
      terminal: 'T1',
      baggage: 'B3'
    };

    return mockStatus;
  } catch (error) {
    console.error('Flight status API error:', error);
    return null;
  }
}

async function getCabEstimates(from, to, service) {
  try {
    const estimates = [
      {
        service: 'Uber',
        vehicle: 'UberGo',
        estimatedFare: '₹250-300',
        estimatedTime: '8-12 minutes',
        distance: '5.2 km',
        surge: 1.2
      },
      {
        service: 'Ola',
        vehicle: 'Ola Mini',
        estimatedFare: '₹200-250',
        estimatedTime: '10-15 minutes',
        distance: '5.2 km',
        surge: 1.0
      },
      {
        service: 'Rapido',
        vehicle: 'Bike',
        estimatedFare: '₹80-120',
        estimatedTime: '5-8 minutes',
        distance: '5.2 km',
        surge: 1.0
      }
    ];

    return service === 'all' ? estimates : estimates.filter(e => e.service.toLowerCase() === service.toLowerCase());
  } catch (error) {
    console.error('Cab estimate error:', error);
    throw error;
  }
}

async function getWaterTransportSchedules(from, to, date) {
  try {
    const schedules = [
      {
        service: 'Kochi Water Metro',
        from: from || 'Vypin',
        to: to || 'Fort Kochi',
        departure: '08:00',
        arrival: '08:30',
        fare: '₹20',
        status: 'available',
        capacity: '100',
        occupied: '60'
      },
      {
        service: 'Ferry Service',
        from: from || 'Vypin',
        to: to || 'Fort Kochi',
        departure: '09:00',
        arrival: '09:20',
        fare: '₹15',
        status: 'available',
        capacity: '50',
        occupied: '30'
      }
    ];

    return schedules;
  } catch (error) {
    console.error('Water transport error:', error);
    throw error;
  }
}

async function getEVChargingStations(lat, lng, radius, connectorType) {
  try {
    const stations = [
      {
        id: 'ev_001',
        name: 'Kochi EV Charging Station',
        location: { lat: 10.5200, lng: 76.3000 },
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        power: '50 kW',
        available: 2,
        total: 4,
        price: '₹15/kWh',
        amenities: ['Restroom', 'Cafe', 'WiFi']
      },
      {
        id: 'ev_002',
        name: 'Trivandrum EV Hub',
        location: { lat: 8.5241, lng: 76.9361 },
        connectorTypes: ['CCS', 'Type 2'],
        power: '30 kW',
        available: 1,
        total: 2,
        price: '₹12/kWh',
        amenities: ['Restroom', 'Parking']
      }
    ];

    return stations;
  } catch (error) {
    console.error('EV stations error:', error);
    throw error;
  }
}

async function getParkingSpots(lat, lng, radius, type) {
  try {
    const spots = [
      {
        id: 'park_001',
        name: 'MG Road Parking',
        location: { lat: 10.5200, lng: 76.3000 },
        type: 'paid',
        price: '₹20/hour',
        available: 15,
        total: 50,
        amenities: ['Security', 'CCTV']
      },
      {
        id: 'park_002',
        name: 'Marine Drive Parking',
        location: { lat: 10.5100, lng: 76.3100 },
        type: 'free',
        price: 'Free',
        available: 8,
        total: 20,
        amenities: ['Security']
      }
    ];

    return spots;
  } catch (error) {
    console.error('Parking spots error:', error);
    throw error;
  }
}

async function getTrafficAlerts(lat, lng, radius) {
  try {
    const alerts = [
      {
        id: 'traffic_001',
        type: 'congestion',
        severity: 'medium',
        message: 'Heavy traffic on MG Road due to construction',
        location: { lat: 10.5200, lng: 76.3000 },
        estimatedDelay: '15 minutes',
        alternativeRoute: 'Use Marine Drive'
      },
      {
        id: 'traffic_002',
        type: 'accident',
        severity: 'high',
        message: 'Accident on NH66 near Aluva',
        location: { lat: 10.1000, lng: 76.3500 },
        estimatedDelay: '30 minutes',
        alternativeRoute: 'Use State Highway 1'
      }
    ];

    return alerts;
  } catch (error) {
    console.error('Traffic alerts error:', error);
    throw error;
  }
}

async function getRoutePlan(from, to, mode, avoid, preferences) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${from}&destination=${to}&mode=${mode}&avoid=${avoid.join('|')}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const route = response.data.routes[0];
    return {
      distance: route.legs[0].distance,
      duration: route.legs[0].duration,
      steps: route.legs[0].steps.map(step => ({
        instruction: step.html_instructions,
        distance: step.distance,
        duration: step.duration,
        coordinates: step.start_location
      })),
      overviewPolyline: route.overview_polyline.points
    };
  } catch (error) {
    console.error('Route planning error:', error);
    throw error;
  }
}

module.exports = router;













