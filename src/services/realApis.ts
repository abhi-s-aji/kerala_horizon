// Real API integrations for Kerala Horizon
import { GOOGLE_PLACES_API_KEY } from '../firebase';

// API Keys and Configuration - These would be loaded from environment variables in production
const API_CONFIG = {
  GOOGLE_PLACES: GOOGLE_PLACES_API_KEY,
  OPENWEATHER: process.env.REACT_APP_OPENWEATHER_API_KEY || 'demo_key',
  EXCHANGE_RATE: process.env.REACT_APP_EXCHANGE_RATE_API_KEY || 'demo_key',
  AVIATION_STACK: process.env.REACT_APP_AVIATION_STACK_API_KEY || 'demo_key',
  OPENAI: process.env.REACT_APP_OPENAI_API_KEY || 'demo_key',
};

// Types
export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  windSpeed: number;
  visibility: number;
  uvIndex: number;
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    precipitation: number;
  }>;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

export interface FlightData {
  flightNumber: string;
  airline: string;
  from: string;
  to: string;
  scheduledDeparture: string;
  actualDeparture?: string;
  scheduledArrival: string;
  actualArrival?: string;
  status: 'on-time' | 'delayed' | 'cancelled' | 'boarding';
  gate?: string;
  terminal?: string;
}

export interface RestaurantData {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  priceRange: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  isOpen: boolean;
  deliveryTime?: number;
  features: string[];
  imageUrl?: string;
}

export interface HotelData {
  id: string;
  name: string;
  type: 'ktdc' | 'pwd' | 'homestay' | 'resort' | 'budget';
  rating: number;
  price: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  amenities: string[];
  availableRooms: number;
  checkIn: string;
  checkOut: string;
  imageUrl?: string;
}

export interface CulturalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'kathakali' | 'theyyam' | 'music' | 'festival' | 'other';
  price: number;
  imageUrl?: string;
}

export interface EmergencyContact {
  name: string;
  number: string;
  type: 'police' | 'ambulance' | 'fire' | 'tourist' | 'hospital';
  location?: string;
}

class RealAPIService {
  // Weather API (OpenWeatherMap)
  async getWeatherData(lat: number, lng: number): Promise<WeatherData> {
    try {
      // For demo purposes, using mock data. Replace with real API call:
      // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_CONFIG.OPENWEATHER}&units=metric`);
      // const data = await response.json();
      
      return {
        temperature: 28,
        humidity: 75,
        condition: 'Partly Cloudy',
        windSpeed: 12,
        visibility: 10,
        uvIndex: 6,
        forecast: [
          {
            date: new Date().toISOString().split('T')[0],
            high: 32,
            low: 24,
            condition: 'Sunny',
            precipitation: 0
          },
          {
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            high: 30,
            low: 23,
            condition: 'Rainy',
            precipitation: 15
          }
        ]
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  // Exchange Rate API
  async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    try {
      // For demo purposes, using mock data. Replace with real API call:
      // const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_CONFIG.EXCHANGE_RATE}/pair/${from}/${to}`);
      // const data = await response.json();
      
      const mockRates: { [key: string]: number } = {
        'USD-INR': 83.25,
        'EUR-INR': 90.15,
        'GBP-INR': 105.80,
        'AED-INR': 22.65,
        'SAR-INR': 22.20,
      };
      
      const rateKey = `${from}-${to}`;
      return {
        from,
        to,
        rate: mockRates[rateKey] || 1,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Exchange rate API error:', error);
      throw new Error('Failed to fetch exchange rate');
    }
  }

  // Flight Status API (AviationStack)
  async getFlightStatus(airport: string): Promise<FlightData[]> {
    try {
      // For demo purposes, using mock data. Replace with real API call:
      // const response = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${API_CONFIG.AVIATION_STACK}&dep_iata=${airport}`);
      // const data = await response.json();
      
      return [
        {
          flightNumber: 'AI-501',
          airline: 'Air India',
          from: 'Mumbai',
          to: 'Kochi',
          scheduledDeparture: '14:30',
          actualDeparture: '14:45',
          scheduledArrival: '16:45',
          status: 'delayed',
          gate: 'A12',
          terminal: 'T1'
        },
        {
          flightNumber: '6E-1234',
          airline: 'IndiGo',
          from: 'Delhi',
          to: 'Kochi',
          scheduledDeparture: '18:00',
          scheduledArrival: '20:30',
          status: 'on-time',
          gate: 'B8',
          terminal: 'T1'
        }
      ];
    } catch (error) {
      console.error('Flight API error:', error);
      throw new Error('Failed to fetch flight data');
    }
  }

  // Restaurant API (Zomato-like)
  async getRestaurants(lat: number, lng: number, cuisine?: string): Promise<RestaurantData[]> {
    try {
      // For demo purposes, using mock data. Replace with real API call:
      // const response = await fetch(`https://developers.zomato.com/api/v2.1/search?lat=${lat}&lon=${lng}&cuisines=${cuisine}`, {
      //   headers: { 'user-key': 'YOUR_ZOMATO_API_KEY' }
      // });
      
      return [
        {
          id: '1',
          name: 'Paragon Restaurant',
          cuisine: ['Kerala', 'South Indian'],
          rating: 4.5,
          priceRange: '$$',
          location: { lat, lng, address: 'Near Marine Drive, Kochi' },
          isOpen: true,
          deliveryTime: 30,
          features: ['Traditional', 'Vegetarian Options', 'Spicy Food'],
          imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'
        },
        {
          id: '2',
          name: 'Grand Hotel Restaurant',
          cuisine: ['Kerala', 'Seafood'],
          rating: 4.2,
          priceRange: '$$$',
          location: { lat: lat + 0.01, lng: lng + 0.01, address: 'Fort Kochi' },
          isOpen: true,
          deliveryTime: 45,
          features: ['Seafood Specialties', 'Traditional Kerala', 'Beach View'],
          imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400'
        }
      ];
    } catch (error) {
      console.error('Restaurant API error:', error);
      throw new Error('Failed to fetch restaurant data');
    }
  }

  // Hotel API (KTDC and others)
  async getHotels(lat: number, lng: number, type?: string): Promise<HotelData[]> {
    try {
      return [
        {
          id: '1',
          name: 'KTDC Hotel',
          type: 'ktdc',
          rating: 4.2,
          price: 2500,
          location: { lat, lng, address: 'Kochi, Kerala' },
          amenities: ['WiFi', 'Restaurant', 'Parking', 'AC'],
          availableRooms: 5,
          checkIn: '14:00',
          checkOut: '11:00',
          imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'
        },
        {
          id: '2',
          name: 'Backwater Resort',
          type: 'resort',
          rating: 4.6,
          price: 4500,
          location: { lat: lat + 0.02, lng: lng + 0.02, address: 'Alleppey Backwaters' },
          amenities: ['WiFi', 'Restaurant', 'Parking', 'AC', 'Pool', 'Spa'],
          availableRooms: 3,
          checkIn: '15:00',
          checkOut: '12:00',
          imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400'
        }
      ];
    } catch (error) {
      console.error('Hotel API error:', error);
      throw new Error('Failed to fetch hotel data');
    }
  }

  // Cultural Events API
  async getCulturalEvents(): Promise<CulturalEvent[]> {
    try {
      return [
        {
          id: '1',
          title: 'Kathakali Performance',
          description: 'Traditional Kerala dance drama at Kerala Kalamandalam',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: '19:00',
          location: 'Kerala Kalamandalam, Thrissur',
          type: 'kathakali',
          price: 200,
          imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
        },
        {
          id: '2',
          title: 'Theyyam Festival',
          description: 'Sacred ritual dance performance',
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          time: '18:30',
          location: 'Kannur, Kerala',
          type: 'theyyam',
          price: 100,
          imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
        }
      ];
    } catch (error) {
      console.error('Cultural events API error:', error);
      throw new Error('Failed to fetch cultural events');
    }
  }

  // Emergency Contacts
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    return [
      { name: 'Police', number: '100', type: 'police' },
      { name: 'Ambulance', number: '108', type: 'ambulance' },
      { name: 'Fire Service', number: '101', type: 'fire' },
      { name: 'Tourist Helpline', number: '1363', type: 'tourist' },
      { name: 'Women Helpline', number: '1091', type: 'police' },
      { name: 'Child Helpline', number: '1098', type: 'police' }
    ];
  }

  // AI Chat (OpenAI)
  async getAIChatResponse(message: string, context: string = 'travel'): Promise<string> {
    try {
      // For demo purposes, using mock responses. Replace with real OpenAI API call:
      // const response = await fetch('https://api.openai.com/v1/chat/completions', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${API_KEYS.OPENAI}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     model: 'gpt-3.5-turbo',
      //     messages: [{ role: 'user', content: message }]
      //   })
      // });
      
      const mockResponses = [
        "I'd be happy to help you plan your Kerala trip! What specific information are you looking for?",
        "Based on your preferences, I recommend visiting the backwaters in Alleppey and the hill stations in Munnar.",
        "For the best experience, I suggest booking your accommodations in advance, especially during peak season.",
        "Don't forget to try the local cuisine - Kerala is famous for its seafood and traditional dishes!"
      ];
      
      return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    } catch (error) {
      console.error('AI API error:', error);
      return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }
  }

  // Route Planning (Google Maps Directions)
  async getRoute(from: string, to: string, mode: 'driving' | 'walking' | 'transit' = 'driving') {
    try {
      // For demo purposes, using mock data. Replace with real Google Maps API call:
      // const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${from}&destination=${to}&mode=${mode}&key=${API_KEYS.GOOGLE_PLACES}`);
      
      return {
        distance: '45.2 km',
        duration: '1 hour 15 minutes',
        steps: [
          'Start from Kochi',
          'Take NH66 towards Thrissur',
          'Continue on NH47',
          'Arrive at Munnar'
        ]
      };
    } catch (error) {
      console.error('Route API error:', error);
      throw new Error('Failed to get route information');
    }
  }
}

export const realAPIService = new RealAPIService();

