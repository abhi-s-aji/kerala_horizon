import { GOOGLE_PLACES_API_KEY } from '../firebase';
import { firestoreService } from './firestore';

export interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

export interface PlacesSearchResult {
  results: Place[];
  status: string;
  next_page_token?: string;
  error_message?: string;
}

export interface CachedPlacesData {
  location: {
    lat: number;
    lng: number;
  };
  places: Place[];
  timestamp: number;
  searchType: 'ev_charging' | 'parking';
}

class GooglePlacesService {
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly SEARCH_RADIUS = 5000; // 5km

  // Get user's current location
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to Kochi coordinates
          resolve({
            lat: 9.9312,
            lng: 76.2673,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  // Search for EV charging stations
  async searchEVChargingStations(location: { lat: number; lng: number }): Promise<Place[]> {
    try {
      // Check cache first
      const cachedData = await this.getCachedPlaces(location, 'ev_charging');
      if (cachedData) {
        return cachedData.places;
      }

      // Search Google Places API
      const response = await this.searchPlaces(location, 'ev_charging');
      
      // Cache the results
      await this.cachePlaces(location, response.results, 'ev_charging');
      
      return response.results;
    } catch (error) {
      console.error('Error searching EV charging stations:', error);
      // Try to return cached data as fallback
      const cachedData = await this.getCachedPlaces(location, 'ev_charging');
      return cachedData?.places || [];
    }
  }

  // Search for parking facilities
  async searchParkingFacilities(location: { lat: number; lng: number }): Promise<Place[]> {
    try {
      // Check cache first
      const cachedData = await this.getCachedPlaces(location, 'parking');
      if (cachedData) {
        return cachedData.places;
      }

      // Search Google Places API
      const response = await this.searchPlaces(location, 'parking');
      
      // Cache the results
      await this.cachePlaces(location, response.results, 'parking');
      
      return response.results;
    } catch (error) {
      console.error('Error searching parking facilities:', error);
      // Try to return cached data as fallback
      const cachedData = await this.getCachedPlaces(location, 'parking');
      return cachedData?.places || [];
    }
  }

  // Generic places search
  private async searchPlaces(
    location: { lat: number; lng: number },
    searchType: 'ev_charging' | 'parking'
  ): Promise<PlacesSearchResult> {
    const endpoint = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: this.SEARCH_RADIUS.toString(),
      key: GOOGLE_PLACES_API_KEY,
    });

    if (searchType === 'ev_charging') {
      params.append('type', 'parking');
      params.append('keyword', 'EV charging');
    } else {
      params.append('type', 'parking');
    }

    console.log('Making Google Places API request:', `${endpoint}?${params}`);
    
    try {
      const response = await fetch(`${endpoint}?${params}`);
      
      if (!response.ok) {
        console.error('HTTP Error:', response.status, response.statusText);
        throw new Error(`Google Places API HTTP error: ${response.status} ${response.statusText}`);
      }

      const data: PlacesSearchResult = await response.json();
      console.log('Google Places API response:', data);
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.status, data.error_message);
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('Google Places API request failed:', error);
      throw error;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Generate Google Maps URL
  generateMapsUrl(place: Place): string {
    const { lat, lng } = place.geometry.location;
    const encodedName = encodeURIComponent(place.name);
    return `https://www.google.com/maps/search/?api=1&query=${encodedName}&query_place_id=${place.place_id}`;
  }

  // Cache places data in Firestore
  private async cachePlaces(
    location: { lat: number; lng: number },
    places: Place[],
    searchType: 'ev_charging' | 'parking'
  ): Promise<void> {
    try {
      const cacheKey = `${searchType}_${Math.round(location.lat * 1000)}_${Math.round(location.lng * 1000)}`;
      const cacheData: CachedPlacesData = {
        location,
        places,
        timestamp: Date.now(),
        searchType,
      };

      // Store in localStorage for immediate access
      localStorage.setItem(`places_cache_${cacheKey}`, JSON.stringify(cacheData));

      // Also store in Firestore for cross-device sync (if user is authenticated)
      // This would require user authentication to be implemented
      console.log('Places data cached locally');
    } catch (error) {
      console.error('Error caching places data:', error);
    }
  }

  // Get cached places data
  private async getCachedPlaces(
    location: { lat: number; lng: number },
    searchType: 'ev_charging' | 'parking'
  ): Promise<CachedPlacesData | null> {
    try {
      const cacheKey = `${searchType}_${Math.round(location.lat * 1000)}_${Math.round(location.lng * 1000)}`;
      const cached = localStorage.getItem(`places_cache_${cacheKey}`);
      
      if (!cached) return null;

      const cacheData: CachedPlacesData = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - cacheData.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(`places_cache_${cacheKey}`);
        return null;
      }

      return cacheData;
    } catch (error) {
      console.error('Error reading cached places data:', error);
      return null;
    }
  }

  // Log search for analytics and Green Score
  async logSearch(searchType: 'ev_charging' | 'parking', location: { lat: number; lng: number }): Promise<void> {
    try {
      // This would integrate with the Green Score system
      // For now, just log to console
      console.log(`Search logged: ${searchType} at ${location.lat}, ${location.lng}`);
      
      // TODO: Implement Green Score reward for eco-friendly searches
      // await firestoreService.addGreenScoreActivity({
      //   userId: currentUser.uid,
      //   activity: `Searched for ${searchType}`,
      //   points: 5,
      //   description: `Found eco-friendly ${searchType} options`
      // });
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }
}

export const googlePlacesService = new GooglePlacesService();
