const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockBusData = {
  routeId: 'R001',
  busNumber: 'KL-01-AB-1234',
  currentLocation: { lat: 10.5200, lng: 76.3000 },
  nextStop: 'Kochi Metro Station',
  estimatedArrival: '5 minutes',
  status: 'on_time'
};

const mockAccommodations = [
  {
    id: 'acc_001',
    name: 'Kochi Heritage Hotel',
    type: 'hotel',
    category: 'mid-range',
    rating: 4.5,
    price: 2500,
    location: { lat: 10.5200, lng: 76.3000, city: 'Kochi' },
    amenities: ['WiFi', 'Parking', 'Restaurant']
  }
];

const mockRestaurants = [
  {
    id: 'rest_001',
    name: 'Traditional Kerala Restaurant',
    rating: 4.5,
    priceLevel: 2,
    location: { lat: 10.5200, lng: 76.3000 },
    vicinity: 'Fort Kochi, Kochi',
    types: ['restaurant', 'food'],
    openNow: true
  }
];

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kerala Horizon Backend is running' });
});

app.get('/api/transport/location', (req, res) => {
  res.json({
    success: true,
    location: { lat: 10.5200, lng: 76.3000 },
    transportOptions: [{ id: 'bus_001', name: 'KSRTC Bus Station', type: 'bus_station' }]
  });
});

app.get('/api/transport/bus/tracking', (req, res) => {
  res.json({ success: true, busData: mockBusData });
});

app.get('/api/stay/search', (req, res) => {
  res.json({ success: true, accommodations: mockAccommodations, total: 1 });
});

app.get('/api/food/restaurants/search', (req, res) => {
  res.json({ success: true, restaurants: mockRestaurants, total: 1 });
});

app.get('/api/wallet/balance', (req, res) => {
  res.json({
    success: true,
    wallet: { balance: 5000, currency: 'INR', isActive: true },
    transactions: []
  });
});

app.get('/api/user/profile', (req, res) => {
  res.json({
    success: true,
    profile: {
      id: 'user_001',
      email: 'user@example.com',
      name: 'John Doe',
      preferences: { language: 'en', currency: 'INR' },
      travelHistory: 5,
      greenScore: 150
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Kerala Horizon Test Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});







