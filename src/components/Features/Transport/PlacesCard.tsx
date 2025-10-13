import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, ExternalLink, Zap, ParkingCircle } from 'lucide-react';
import { Place } from '../../../services/googlePlaces';

interface PlacesCardProps {
  place: Place;
  userLocation: { lat: number; lng: number };
  onOpenMaps: (url: string) => void;
}

const PlacesCard: React.FC<PlacesCardProps> = ({ place, userLocation, onOpenMaps }) => {
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    place.geometry.location.lat,
    place.geometry.location.lng
  );

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;

  const isEVCharging = place.types.includes('parking') && 
    (place.name.toLowerCase().includes('ev') || 
     place.name.toLowerCase().includes('charging') ||
     place.name.toLowerCase().includes('electric'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isEVCharging ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
            {isEVCharging ? (
              <Zap size={20} className="text-green-600 dark:text-green-400" />
            ) : (
              <ParkingCircle size={20} className="text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
              {place.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <MapPin size={14} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {place.vicinity}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {place.rating && (
            <div className="flex items-center space-x-1">
              <Star size={16} className="text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {place.rating.toFixed(1)}
              </span>
              {place.user_ratings_total && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({place.user_ratings_total})
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
            </span>
          </div>
        </div>

        {place.opening_hours && (
          <div className="flex items-center space-x-1">
            <Clock size={16} className={place.opening_hours.open_now ? "text-green-500" : "text-red-500"} />
            <span className={`text-sm font-medium ${place.opening_hours.open_now ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {place.opening_hours.open_now ? 'Open' : 'Closed'}
            </span>
          </div>
        )}
      </div>

      {place.price_level && (
        <div className="mb-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Price Level: {'₹'.repeat(place.price_level)}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {isEVCharging && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
              EV Charging
            </span>
          )}
          {place.types.slice(0, 2).map((type, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full capitalize"
            >
              {type.replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        <button
          onClick={() => onOpenMaps(mapsUrl)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          <ExternalLink size={16} />
          <span>Open in Maps</span>
        </button>
      </div>
    </motion.div>
  );
};

// Helper function to calculate distance
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default PlacesCard;

