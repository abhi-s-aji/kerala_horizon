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

      // Handle both { success: true, data: {...} } and { success: true, ...data } formats
      if (data.success && data.data) {
        return { ...data, ...data.data };
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
    const response = await this.request(`/transport/bus/tracking?routeId=${routeId}&busNumber=${busNumber}`);
    return {
      success: response.success || true,
      busNumber: response.busNumber || response.data?.busNumber || busNumber,
      ...response.data || response
    };
  }

  async getTrainSchedules(from, to, date) {
    const response = await this.request(`/transport/train/schedules?from=${from}&to=${to}&date=${date}`);
    return {
      success: response.success || true,
      schedules: response.schedules || response.data?.schedules || response.data?.data?.schedules || [],
      ...response
    };
  }

  async getFlightStatus(flightNumber, date) {
    const response = await this.request(`/transport/flight/status?flightNumber=${flightNumber}&date=${date}`);
    return {
      success: response.success || true,
      flights: response.flights || response.data?.flights || response.data?.data?.flights || [],
      ...response
    };
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
    // Convert filters object to URL params
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (Array.isArray(filters[key])) {
        filters[key].forEach(item => params.append(key, item));
      } else if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    const response = await this.request(`/stay/search?${params}`);
    // Ensure accommodations array is properly returned
    return {
      success: response.success || true,
      accommodations: response.accommodations || response.data?.accommodations || [],
      total: response.total || response.data?.total || 0,
      ...response
    };
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
    // Convert filters object to URL params, handling nested objects
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (Array.isArray(filters[key])) {
        filters[key].forEach(item => params.append(key, item));
      } else if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    const response = await this.request(`/food/restaurants/search?${params}`);
    // Ensure restaurants array is properly returned
    return {
      success: response.success || true,
      restaurants: response.restaurants || response.data?.restaurants || [],
      total: response.total || response.data?.total || 0,
      ...response
    };
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

  // Culture APIs
  async getCulturalExperiences(lat, lng, radius = 20000, category = 'all') {
    const response = await this.request(`/culture/experiences?lat=${lat}&lng=${lng}&radius=${radius}&category=${category}`);
    return {
      success: response.success || true,
      experiences: response.experiences || response.data?.experiences || [],
      ...response
    };
  }

  async getHeritageSites(lat, lng, radius = 20000, type = 'all') {
    const response = await this.request(`/culture/heritage-sites?lat=${lat}&lng=${lng}&radius=${radius}&type=${type}`);
    return {
      success: response.success || true,
      heritageSites: response.heritageSites || response.data?.heritageSites || [],
      ...response
    };
  }

  async getArtForms() {
    const response = await this.request('/culture/art-forms');
    return {
      success: response.success || true,
      artForms: response.artForms || response.data?.artForms || [],
      ...response
    };
  }

  // Trip Planner APIs
  async getTripTemplates() {
    const response = await this.request('/trip-planner/templates');
    return {
      success: response.success || true,
      templates: response.templates || response.data?.templates || [],
      ...response
    };
  }

  async createTripPlan(planData) {
    return this.request('/trip-planner/plan', {
      method: 'POST',
      body: JSON.stringify(planData)
    });
  }

  // Sustainability APIs
  async getGreenScore(userId) {
    const response = await this.request(`/sustainability/green-score?userId=${userId}`);
    return {
      success: response.success || true,
      totalScore: response.totalScore || 0,
      level: response.level || 'Beginner',
      badges: response.badges || [],
      activities: response.activities || [],
      rewards: response.rewards || [],
      carbonFootprint: response.carbonFootprint || {},
      ...response
    };
  }

  async addEcoActivity(activity, points, category) {
    return this.request('/sustainability/activity', {
      method: 'POST',
      body: JSON.stringify({ activity, points, category })
    });
  }

  // Community APIs
  async getCommunityPosts(limit = 20, offset = 0, category = 'all') {
    const response = await this.request(`/community/posts?limit=${limit}&offset=${offset}&category=${category}`);
    return {
      success: response.success || true,
      posts: response.posts || response.data?.posts || [],
      total: response.total || 0,
      ...response
    };
  }

  async createCommunityPost(postData) {
    return this.request('/community/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }

  // SOS APIs
  async getEmergencyContacts(lat, lng) {
    const response = await this.request(`/sos/emergency-contacts?lat=${lat}&lng=${lng}`);
    return {
      success: response.success || true,
      emergencyContacts: response.emergencyContacts || response.data?.emergencyContacts || [],
      nearbyServices: response.nearbyServices || response.data?.nearbyServices || [],
      ...response
    };
  }

  // Shopping APIs
  async getShoppingStores(lat, lng, radius = 10000, category = 'all') {
    const response = await this.request(`/shopping/stores?lat=${lat}&lng=${lng}&radius=${radius}&category=${category}`);
    return {
      success: response.success || true,
      stores: response.stores || response.data?.stores || [],
      total: response.total || 0,
      ...response
    };
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
