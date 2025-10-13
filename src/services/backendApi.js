// Backend API Integration Service for Kerala Horizon
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class BackendAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      // Return mock data for development
      return this.getMockData(endpoint);
    }
  }

  // Mock data fallback
  getMockData(endpoint) {
    const mockData = {
      '/transport/location': {
        success: true,
        location: { lat: 10.5200, lng: 76.3000 },
        transportOptions: [
          { id: 'bus_001', name: 'KSRTC Bus Station', type: 'bus_station', location: { lat: 10.5200, lng: 76.3000 } }
        ]
      },
      '/transport/bus/tracking': {
        success: true,
        busData: {
          routeId: 'R001',
          busNumber: 'KL-01-AB-1234',
          currentLocation: { lat: 10.5200, lng: 76.3000 },
          nextStop: 'Kochi Metro Station',
          estimatedArrival: '5 minutes',
          status: 'on_time'
        }
      },
      '/stay/search': {
        success: true,
        accommodations: [
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
        ],
        total: 1
      },
      '/food/restaurants/search': {
        success: true,
        restaurants: [
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
        ],
        total: 1
      },
      '/wallet/balance': {
        success: true,
        wallet: { balance: 5000, currency: 'INR', isActive: true },
        transactions: []
      },
      '/user/profile': {
        success: true,
        profile: {
          id: 'user_001',
          email: 'user@example.com',
          name: 'John Doe',
          preferences: { language: 'en', currency: 'INR' },
          travelHistory: 5,
          greenScore: 150
        }
      }
    };

    return mockData[endpoint] || { success: false, message: 'No mock data available' };
  }

  // Authentication APIs
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getProfile() {
    return this.request('/user/profile');
  }

  async updateProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Document Vault APIs
  async uploadDocument(formData) {
    return this.request('/documents/upload', {
      method: 'POST',
      headers: {
        // Remove Content-Type to let browser set it for FormData
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      body: formData
    });
  }

  async scanDocument(formData) {
    return this.request('/documents/scan', {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      body: formData
    });
  }

  async getDocuments(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/documents/documents?${params}`);
  }

  async getDocument(id) {
    return this.request(`/documents/documents/${id}`);
  }

  async updateDocument(id, data) {
    return this.request(`/documents/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteDocument(id) {
    return this.request(`/documents/documents/${id}`, {
      method: 'DELETE'
    });
  }

  async getExpiryAlerts(days = 30) {
    return this.request(`/documents/expiry-alerts?days=${days}`);
  }

  async shareDocument(id, method, recipient) {
    return this.request(`/documents/documents/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ method, recipient })
    });
  }

  // Transport APIs
  async getLocationData(lat, lng, radius = 5000) {
    return this.request(`/transport/location?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async trackBus(routeId, busNumber) {
    return this.request(`/transport/bus/tracking?routeId=${routeId}&busNumber=${busNumber}`);
  }

  async getTrainSchedules(from, to, date) {
    return this.request(`/transport/train/schedules?from=${from}&to=${to}&date=${date}`);
  }

  async getFlightStatus(flightNumber, date) {
    return this.request(`/transport/flight/status?flightNumber=${flightNumber}&date=${date}`);
  }

  async getCabEstimates(from, to, service = 'all') {
    return this.request(`/transport/cab/estimate?from=${from}&to=${to}&service=${service}`);
  }

  async getWaterSchedules(from, to, date) {
    return this.request(`/transport/water/schedules?from=${from}&to=${to}&date=${date}`);
  }

  async getEVStations(lat, lng, radius = 10000) {
    return this.request(`/transport/ev/stations?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async getParkingSpots(lat, lng, radius = 5000) {
    return this.request(`/transport/parking/spots?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async getTrafficAlerts(lat, lng, radius = 20000) {
    return this.request(`/transport/traffic/alerts?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async planRoute(from, to, mode = 'driving', avoid = []) {
    return this.request(`/transport/route/plan?from=${from}&to=${to}&mode=${mode}&avoid=${avoid.join(',')}`);
  }

  async saveFavoriteRoute(routeData) {
    return this.request('/transport/route/favorite', {
      method: 'POST',
      body: JSON.stringify(routeData)
    });
  }

  async getFavoriteRoutes() {
    return this.request('/transport/route/favorites');
  }

  // Stay & Accommodation APIs
  async searchAccommodations(filters) {
    const params = new URLSearchParams(filters);
    return this.request(`/stay/search?${params}`);
  }

  async getAccommodation(id) {
    return this.request(`/stay/${id}`);
  }

  async bookAccommodation(id, bookingData) {
    return this.request(`/stay/${id}/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  async checkIn(id, checkInData) {
    return this.request(`/stay/${id}/checkin`, {
      method: 'POST',
      body: JSON.stringify(checkInData)
    });
  }

  async getMyBookings() {
    return this.request('/stay/bookings/my');
  }

  async getEmergencySuggestions(lat, lng, reason = 'weather') {
    return this.request(`/stay/emergency/suggestions?lat=${lat}&lng=${lng}&reason=${reason}`);
  }

  // Food & Cuisine APIs
  async searchRestaurants(filters) {
    const params = new URLSearchParams(filters);
    return this.request(`/food/restaurants/search?${params}`);
  }

  async getRestaurant(id) {
    return this.request(`/food/restaurants/${id}`);
  }

  async getCuisineGuide(cuisine = 'all', region = 'all') {
    return this.request(`/food/cuisine/guide?cuisine=${cuisine}&region=${region}`);
  }

  async getSafetyRating(restaurantId) {
    return this.request(`/food/safety/ratings?restaurantId=${restaurantId}`);
  }

  async getAISuggestions(suggestionData) {
    return this.request('/food/ai/suggestions', {
      method: 'POST',
      body: JSON.stringify(suggestionData)
    });
  }

  async getCookingClasses(filters) {
    const params = new URLSearchParams(filters);
    return this.request(`/food/cooking/classes?${params}`);
  }

  async bookCookingClass(id, bookingData) {
    return this.request(`/food/cooking/classes/${id}/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }

  async addRestaurantReview(id, reviewData) {
    return this.request(`/food/restaurants/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  // AI Intelligence APIs
  async getAIRecommendations(conciergeData) {
    return this.request('/ai/concierge', {
      method: 'POST',
      body: JSON.stringify(conciergeData)
    });
  }

  async getSurpriseItinerary(surpriseData) {
    return this.request('/ai/surprise-me', {
      method: 'POST',
      body: JSON.stringify(surpriseData)
    });
  }

  async translateText(translationData) {
    return this.request('/ai/translate', {
      method: 'POST',
      body: JSON.stringify(translationData)
    });
  }

  async translateVoice(voiceData) {
    return this.request('/ai/voice-translate', {
      method: 'POST',
      body: JSON.stringify(voiceData)
    });
  }

  async getPackingList(packingData) {
    return this.request('/ai/packing-assistant', {
      method: 'POST',
      body: JSON.stringify(packingData)
    });
  }

  async getSafetyAlerts(lat, lng, radius = 10000) {
    return this.request(`/ai/safety-alerts?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  async optimizeExpenses(expenseData) {
    return this.request('/ai/expense-optimizer', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });
  }

  async getWeatherRecommendations(lat, lng) {
    return this.request(`/ai/weather-recommendations?lat=${lat}&lng=${lng}`);
  }

  // Wallet & Payment APIs
  async getWalletBalance() {
    return this.request('/wallet/balance');
  }

  async addMoney(amount, paymentMethod, paymentDetails) {
    return this.request('/wallet/add-money', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod, paymentDetails })
    });
  }

  async verifyPayment(transactionId, paymentSignature, paymentMethod) {
    return this.request('/wallet/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ transactionId, paymentSignature, paymentMethod })
    });
  }

  async payFromWallet(paymentData) {
    return this.request('/wallet/pay', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async getTransactionHistory(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/wallet/transactions?${params}`);
  }

  async payWithUPI(upiData) {
    return this.request('/wallet/upi/pay', {
      method: 'POST',
      body: JSON.stringify(upiData)
    });
  }

  async payWithCard(cardData) {
    return this.request('/wallet/card/pay', {
      method: 'POST',
      body: JSON.stringify(cardData)
    });
  }

  // User Profile APIs
  async updatePreferences(preferences) {
    return this.request('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  }

  async getTravelHistory(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/user/travel-history?${params}`);
  }

  async getAchievements() {
    return this.request('/user/achievements');
  }

  async updateLocation(locationData) {
    return this.request('/user/location', {
      method: 'POST',
      body: JSON.stringify(locationData)
    });
  }

  async getRecommendations(lat, lng, radius = 10000) {
    return this.request(`/user/recommendations?lat=${lat}&lng=${lng}&radius=${radius}`);
  }
}

// Create singleton instance
const backendAPI = new BackendAPI();

export default backendAPI;
