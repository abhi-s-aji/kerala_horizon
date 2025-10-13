// Test Google Places API functionality
import { GOOGLE_PLACES_API_KEY } from '../firebase';

export const testGooglePlacesAPI = async () => {
  console.log('Testing Google Places API...');
  console.log('API Key:', GOOGLE_PLACES_API_KEY ? 'Present' : 'Missing');
  
  // Test with Kochi coordinates
  const testLocation = { lat: 9.9312, lng: 76.2673 };
  
  try {
    const endpoint = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const params = new URLSearchParams({
      location: `${testLocation.lat},${testLocation.lng}`,
      radius: '5000',
      type: 'parking',
      keyword: 'EV charging',
      key: GOOGLE_PLACES_API_KEY,
    });

    console.log('Making API request to:', `${endpoint}?${params}`);
    
    const response = await fetch(`${endpoint}?${params}`);
    const data = await response.json();
    
    console.log('API Response:', data);
    
    if (data.status === 'OK') {
      console.log('✅ Google Places API is working!');
      console.log('Found', data.results.length, 'places');
      return { success: true, data };
    } else {
      console.error('❌ Google Places API error:', data.status, data.error_message);
      return { success: false, error: data.error_message };
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test function for browser console
(window as any).testGooglePlaces = testGooglePlacesAPI;
