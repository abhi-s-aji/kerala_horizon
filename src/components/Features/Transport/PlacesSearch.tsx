import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  MapPin, 
  Zap, 
  ParkingCircle, 
  Filter, 
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { googlePlacesService, Place } from '../../../services/googlePlaces';
import PlacesCard from './PlacesCard';
import LoadingSpinner from '../../Common/LoadingSpinner';

interface PlacesSearchProps {
  searchType: 'ev_charging' | 'parking' | 'both';
}

const PlacesSearch: React.FC<PlacesSearchProps> = ({ searchType }) => {
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [evChargingStations, setEvChargingStations] = useState<Place[]>([]);
  const [parkingFacilities, setParkingFacilities] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterDistance, setFilterDistance] = useState<number | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await googlePlacesService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Unable to get your current location. Please enable location services.');
    }
  };

  const searchPlaces = async () => {
    if (!userLocation) {
      setError('Location not available. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      console.log('Starting places search for location:', userLocation);
      
      const promises = [];

      if (searchType === 'ev_charging' || searchType === 'both') {
        console.log('Searching for EV charging stations...');
        promises.push(googlePlacesService.searchEVChargingStations(userLocation));
        promises.push(googlePlacesService.logSearch('ev_charging', userLocation));
      }

      if (searchType === 'parking' || searchType === 'both') {
        console.log('Searching for parking facilities...');
        promises.push(googlePlacesService.searchParkingFacilities(userLocation));
        promises.push(googlePlacesService.logSearch('parking', userLocation));
      }

      const results = await Promise.all(promises);
      console.log('Search results:', results);

      if (searchType === 'ev_charging' || searchType === 'both') {
        setEvChargingStations(results[0] || []);
        console.log('EV charging stations set:', results[0]?.length || 0);
      }

      if (searchType === 'parking' || searchType === 'both') {
        const parkingIndex = searchType === 'both' ? 2 : 0;
        setParkingFacilities(results[parkingIndex] || []);
        console.log('Parking facilities set:', results[parkingIndex]?.length || 0);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setError(`Failed to search for places: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshSearch = () => {
    setEvChargingStations([]);
    setParkingFacilities([]);
    setHasSearched(false);
    searchPlaces();
  };

  const filterPlaces = (places: Place[]) => {
    let filtered = [...places];

    if (filterRating) {
      filtered = filtered.filter(place => place.rating && place.rating >= filterRating);
    }

    if (filterDistance && userLocation) {
      filtered = filtered.filter(place => {
        const distance = googlePlacesService.calculateDistance(
          userLocation.lat,
          userLocation.lng,
          place.geometry.location.lat,
          place.geometry.location.lng
        );
        return distance <= filterDistance;
      });
    }

    return filtered;
  };

  const openMaps = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              {searchType === 'ev_charging' ? (
                <Zap size={24} className="text-primary-600 dark:text-primary-400" />
              ) : searchType === 'parking' ? (
                <ParkingCircle size={24} className="text-primary-600 dark:text-primary-400" />
              ) : (
                <Search size={24} className="text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {searchType === 'ev_charging' ? 'EV Charging Stations' : 
                 searchType === 'parking' ? 'Parking Facilities' : 
                 'EV Charging & Parking'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find nearby {searchType === 'both' ? 'charging stations and parking' : searchType} facilities
              </p>
            </div>
          </div>
          
          {userLocation && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin size={16} />
              <span>
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={searchPlaces}
            disabled={loading || !userLocation}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Search size={20} />
            )}
            <span>
              {loading ? 'Searching...' : 'Find Nearby'}
            </span>
          </button>

          {hasSearched && (
            <button
              onClick={refreshSearch}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 font-medium"
            >
              <RefreshCw size={20} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {/* Filters */}
        {hasSearched && (evChargingStations.length > 0 || parkingFacilities.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <Filter size={20} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
              
              <select
                value={filterRating || ''}
                onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
              </select>

              <select
                value={filterDistance || ''}
                onChange={(e) => setFilterDistance(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Distances</option>
                <option value="1">Within 1km</option>
                <option value="2">Within 2km</option>
                <option value="5">Within 5km</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {hasSearched && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* EV Charging Stations */}
            {(searchType === 'ev_charging' || searchType === 'both') && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Zap size={20} className="text-green-600 dark:text-green-400" />
                  <span>EV Charging Stations ({filterPlaces(evChargingStations).length})</span>
                </h4>
                
                {filterPlaces(evChargingStations).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No EV charging stations found nearby.
                  </div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {filterPlaces(evChargingStations).map((place) => (
                      <motion.div key={place.place_id} variants={itemVariants}>
                        <PlacesCard
                          place={place}
                          userLocation={userLocation!}
                          onOpenMaps={openMaps}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* Parking Facilities */}
            {(searchType === 'parking' || searchType === 'both') && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <ParkingCircle size={20} className="text-blue-600 dark:text-blue-400" />
                  <span>Parking Facilities ({filterPlaces(parkingFacilities).length})</span>
                </h4>
                
                {filterPlaces(parkingFacilities).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No parking facilities found nearby.
                  </div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {filterPlaces(parkingFacilities).map((place) => (
                      <motion.div key={place.place_id} variants={itemVariants}>
                        <PlacesCard
                          place={place}
                          userLocation={userLocation!}
                          onOpenMaps={openMaps}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlacesSearch;
