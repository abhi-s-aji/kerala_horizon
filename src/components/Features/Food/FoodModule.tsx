import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  Clock,
  DollarSign,
  Search,
  ChefHat,
  Leaf,
  Heart
} from 'lucide-react';
import { realAPIService, RestaurantData } from '../../../services/realApis';
import { apiService } from '../../../services/api';
import backendAPI from '../../../services/backendApi';
import LoadingSpinner from '../../Common/LoadingSpinner';

const FoodModule: React.FC = () => {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);

  const cuisines = [
    'All', 'Kerala', 'South Indian', 'Seafood', 'Vegetarian', 'Non-Vegetarian', 'Chinese', 'Continental'
  ];

  const loadCurrentLocation = useCallback(async () => {
    try {
      const location = await apiService.getCurrentLocation();
      setCurrentLocation({ lat: location.lat, lng: location.lng });
      await searchRestaurants(location.lat, location.lng);
    } catch (error) {
      console.error('Failed to get location:', error);
      // Fallback to Kochi coordinates
      const fallbackLocation = { lat: 9.9312, lng: 76.2673 };
      setCurrentLocation(fallbackLocation);
      await searchRestaurants(fallbackLocation.lat, fallbackLocation.lng);
    }
  }, []);

  useEffect(() => {
    loadCurrentLocation();
  }, [loadCurrentLocation]);

  const searchRestaurants = async (lat: number, lng: number, cuisine?: string) => {
    setLoading(true);
    try {
      // Try backend API first
      const searchFilters = {
        lat,
        lng,
        radius: 5000,
        cuisine: cuisine || 'all',
        priceRange: 'all',
        rating: 0,
        dietary: [],
        openNow: false
      };

      const backendResults = await backendAPI.searchRestaurants(searchFilters);
      if (backendResults.success && backendResults.restaurants.length > 0) {
        // Convert backend format to frontend format
        const convertedRestaurants = backendResults.restaurants.map((restaurant: any) => ({
          id: restaurant.id,
          name: restaurant.name,
          cuisine: restaurant.types || ['Indian'],
          rating: restaurant.rating || 4.0,
          priceRange: restaurant.priceRange || '$$',
          location: {
            lat: restaurant.location?.lat || lat,
            lng: restaurant.location?.lng || lng,
            address: restaurant.vicinity || 'Kochi, Kerala'
          },
          isOpen: restaurant.openNow || true,
          deliveryTime: restaurant.deliveryTime || 30,
          features: restaurant.features || ['Traditional'],
          imageUrl: restaurant.photos?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'
        }));
        setRestaurants(convertedRestaurants);
        return;
      }

      // Fallback to real API service
      const results = await realAPIService.getRestaurants(lat, lng, cuisine);
      setRestaurants(results);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      // Fallback to mock data
      setRestaurants([
        {
          id: '1',
          name: 'Traditional Kerala Restaurant',
          cuisine: ['Kerala'],
          rating: 4.5,
          priceRange: '$$',
          location: { lat, lng, address: 'Kochi, Kerala' },
          isOpen: true,
          deliveryTime: 30,
          features: ['Traditional', 'Vegetarian'],
          imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCuisineFilter = (cuisine: string) => {
    setSelectedCuisine(cuisine);
    if (currentLocation) {
      searchRestaurants(currentLocation.lat, currentLocation.lng, cuisine === 'All' ? undefined : cuisine);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
          {t('food.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover authentic Kerala cuisine and local dining experiences
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search restaurants or cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Cuisine Filter */}
          <div className="flex flex-wrap gap-2">
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => handleCuisineFilter(cuisine)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCuisine === cuisine
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Leaf size={24} />
            <div>
              <h3 className="font-semibold">Ayurvedic Diet</h3>
              <p className="text-sm opacity-90">Traditional healthy eating</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <ChefHat size={24} />
            <div>
              <h3 className="font-semibold">Cooking Classes</h3>
              <p className="text-sm opacity-90">Learn Kerala recipes</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Heart size={24} />
            <div>
              <h3 className="font-semibold">Food Safety</h3>
              <p className="text-sm opacity-90">FSSAI ratings & tips</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Restaurants Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredRestaurants.map((restaurant) => (
            <motion.div
              key={restaurant.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedRestaurant(restaurant)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              {restaurant.imageUrl && (
                <div className="h-48 bg-gray-200 dark:bg-gray-700">
                  <img
                    src={restaurant.imageUrl}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Star size={16} className="text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {restaurant.rating}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {restaurant.location.address}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {restaurant.cuisine.map((cuisine, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <DollarSign size={16} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {restaurant.priceRange}
                      </span>
                    </div>
                    
                    {restaurant.deliveryTime && (
                      <div className="flex items-center space-x-1">
                        <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {restaurant.deliveryTime} min
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    restaurant.isOpen 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {restaurant.isOpen ? 'Open' : 'Closed'}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {restaurant.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Restaurant Detail Modal */}
      {selectedRestaurant && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRestaurant(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedRestaurant.name}
              </h2>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {selectedRestaurant.imageUrl && (
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4">
                <img
                  src={selectedRestaurant.imageUrl}
                  alt={selectedRestaurant.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Star size={20} className="text-yellow-500 fill-current" />
                  <span className="font-medium">{selectedRestaurant.rating}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign size={20} className="text-gray-500 dark:text-gray-400" />
                  <span>{selectedRestaurant.priceRange}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin size={20} className="text-gray-500 dark:text-gray-400" />
                  <span>{selectedRestaurant.location.address}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cuisines</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRestaurant.cuisine.map((cuisine, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-full"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRestaurant.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors">
                  View Menu
                </button>
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                  Order Now
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default FoodModule;