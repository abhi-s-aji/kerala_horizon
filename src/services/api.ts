// API service for external integrations
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface BusRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  availableSeats: number;
  status: 'on-time' | 'delayed' | 'cancelled';
}

export interface TrainSchedule {
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  availableSeats: number;
  status: 'on-time' | 'delayed' | 'cancelled';
}

export interface FlightStatus {
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

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  priceRange: string;
  location: Location;
  isOpen: boolean;
  deliveryTime?: number;
  features: string[];
}

export interface Hotel {
  id: string;
  name: string;
  type: 'ktdc' | 'pwd' | 'homestay' | 'resort' | 'budget';
  rating: number;
  price: number;
  location: Location;
  amenities: string[];
  availableRooms: number;
  checkIn: string;
  checkOut: string;
}

// Mock API functions - Replace with real API calls
export const apiService = {
  // Location Services
  getCurrentLocation: async (): Promise<Location> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {
            // Fallback to Kochi coordinates
            resolve({
              lat: 9.9312,
              lng: 76.2673,
              address: 'Kochi, Kerala, India'
            });
          }
        );
      } else {
        resolve({
          lat: 9.9312,
          lng: 76.2673,
          address: 'Kochi, Kerala, India'
        });
      }
    });
  },

  // Transport APIs
  getBusRoutes: async (from: string, to: string): Promise<BusRoute[]> => {
    // Mock data - Replace with real KSRTC API
    return [
      {
        id: '1',
        name: 'KSRTC Express',
        from,
        to,
        departureTime: '08:00',
        arrivalTime: '12:00',
        fare: 150,
        availableSeats: 25,
        status: 'on-time'
      },
      {
        id: '2',
        name: 'Swift Bus',
        from,
        to,
        departureTime: '10:30',
        arrivalTime: '14:30',
        fare: 200,
        availableSeats: 15,
        status: 'on-time'
      }
    ];
  },

  getTrainSchedules: async (from: string, to: string): Promise<TrainSchedule[]> => {
    // Mock data - Replace with real IRCTC API
    return [
      {
        trainNumber: '12625',
        trainName: 'Kerala Express',
        from,
        to,
        departureTime: '11:30',
        arrivalTime: '06:00+1',
        fare: 450,
        availableSeats: 120,
        status: 'on-time'
      }
    ];
  },

  getFlightStatus: async (airport: string): Promise<FlightStatus[]> => {
    // Mock data - Replace with real aviation API
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
      }
    ];
  },

  // Weather API
  getWeatherData: async (location: Location): Promise<WeatherData> => {
    // Mock data - Replace with real weather API
    return {
      temperature: 28,
      humidity: 75,
      condition: 'Partly Cloudy',
      windSpeed: 12,
      visibility: 10,
      uvIndex: 6,
      forecast: [
        {
          date: '2024-01-01',
          high: 32,
          low: 24,
          condition: 'Sunny',
          precipitation: 0
        },
        {
          date: '2024-01-02',
          high: 30,
          low: 23,
          condition: 'Rainy',
          precipitation: 15
        }
      ]
    };
  },

  // Food APIs
  getNearbyRestaurants: async (location: Location): Promise<Restaurant[]> => {
    // Mock data - Replace with real restaurant API
    return [
      {
        id: '1',
        name: 'Paragon Restaurant',
        cuisine: ['Kerala', 'South Indian'],
        rating: 4.5,
        priceRange: '$$',
        location,
        isOpen: true,
        deliveryTime: 30,
        features: ['Traditional', 'Vegetarian Options']
      }
    ];
  },

  // Accommodation APIs
  getHotels: async (location: Location, type?: string): Promise<Hotel[]> => {
    // Mock data - Replace with real hotel API
    return [
      {
        id: '1',
        name: 'KTDC Hotel',
        type: 'ktdc',
        rating: 4.2,
        price: 2500,
        location,
        amenities: ['WiFi', 'Restaurant', 'Parking'],
        availableRooms: 5,
        checkIn: '14:00',
        checkOut: '11:00'
      }
    ];
  },

  // Emergency Services
  getEmergencyContacts: async (): Promise<Array<{name: string, number: string, type: string}>> => {
    return [
      { name: 'Police', number: '100', type: 'emergency' },
      { name: 'Ambulance', number: '108', type: 'emergency' },
      { name: 'Fire Service', number: '101', type: 'emergency' },
      { name: 'Tourist Helpline', number: '1363', type: 'tourist' }
    ];
  }
};

