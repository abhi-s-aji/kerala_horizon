import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Hotel,
  MapPin,
  Star,
  Users,
  Wifi,
  Car,
  Utensils,
  Waves,
  Heart,
  Accessibility,
  QrCode,
  Search
} from 'lucide-react';
import { keralaHotels, HotelData, getHotelsByCategory, getHotelsByType, getHotelsByLocation, searchHotels } from '../../../services/keralaHotels';
import { apiService } from '../../../services/api';
import backendAPI from '../../../services/backendApi';
import LoadingSpinner from '../../Common/LoadingSpinner';

const StayModule: React.FC = () => {
  const { t } = useTranslation();
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 25000]);
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const hotelTypes = [
    { id: 'all', label: 'All', icon: Hotel },
    { id: 'hotel', label: 'Hotels', icon: Hotel },
    { id: 'resort', label: 'Resorts', icon: Hotel },
    { id: 'homestay', label: 'Homestays', icon: Hotel },
    { id: 'ktdc', label: 'KTDC', icon: Hotel },
    { id: 'pwd', label: 'PWD', icon: Hotel }
  ];

  const hotelCategories = [
    { id: 'all', label: 'All Categories', color: 'bg-gray-100 text-gray-800' },
    { id: 'budget', label: 'Budget', color: 'bg-green-100 text-green-800' },
    { id: 'mid-range', label: 'Mid-range', color: 'bg-blue-100 text-blue-800' },
    { id: 'luxury', label: 'Luxury', color: 'bg-purple-100 text-purple-800' }
  ];

  const cities = [
    { id: 'all', label: 'All Cities' },
    { id: 'thiruvananthapuram', label: 'Thiruvananthapuram' },
    { id: 'kochi', label: 'Kochi' },
    { id: 'munnar', label: 'Munnar' },
    { id: 'wayanad', label: 'Wayanad' },
    { id: 'thekkady', label: 'Thekkady' },
    { id: 'alappuzha', label: 'Alappuzha' }
  ];

  const amenities = [
    { name: 'WiFi', icon: Wifi },
    { name: 'Parking', icon: Car },
    { name: 'Restaurant', icon: Utensils },
    { name: 'Pool', icon: Waves },
    { name: 'Spa', icon: Heart },
    { name: 'Accessibility', icon: Accessibility }
  ];

  const loadHotels = useCallback(async () => {
    setLoading(true);
    try {
      // Try to use backend API first
      if (currentLocation) {
        const searchFilters = {
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          radius: 10000,
          type: selectedType !== 'all' ? selectedType : undefined,
          priceMin: priceRange[0],
          priceMax: priceRange[1],
          amenities: [],
          accessibility: false,
          rating: 0
        };

        const backendResults = await backendAPI.searchAccommodations(searchFilters);
        if (backendResults.success && backendResults.accommodations.length > 0) {
          // Convert backend format to frontend format
          const convertedHotels = backendResults.accommodations.map((acc: any) => ({
            id: acc.id,
            name: acc.name,
            type: acc.type,
            category: acc.category || 'mid-range',
            rating: acc.rating || 4.0,
            reviewCount: acc.reviewCount || 0,
            location: {
              city: acc.location?.city || 'Kochi',
              district: acc.location?.district || 'Ernakulam',
              address: acc.location?.address || ''
            },
            priceRange: {
              min: acc.price || 1000,
              max: acc.price || 5000
            },
            amenities: acc.amenities || ['WiFi', 'Parking'],
            images: acc.images || [],
            nearbyAttractions: acc.nearbyAttractions || [],
            transportHubs: acc.transportHubs || [],
            contact: {
              phone: acc.contact?.phone || '+91-1234567890',
              email: acc.contact?.email || 'info@hotel.com',
              website: acc.contact?.website || ''
            },
            bookingLinks: {
              bookingCom: acc.bookingLinks?.bookingCom || '',
              makeMyTrip: acc.bookingLinks?.makeMyTrip || ''
            }
          }));
          setHotels(convertedHotels);
          return;
        }
      }

      // Fallback to local data
      let filteredHotels = keralaHotels;

      // Filter by type
      if (selectedType !== 'all') {
        filteredHotels = getHotelsByType(selectedType);
      }

      // Filter by category
      if (selectedCategory !== 'all') {
        filteredHotels = filteredHotels.filter(hotel => hotel.category === selectedCategory);
      }

      // Filter by city
      if (selectedCity !== 'all') {
        filteredHotels = getHotelsByLocation(selectedCity);
      }

      // Filter by price range
      filteredHotels = filteredHotels.filter(hotel => 
        hotel.priceRange.min >= priceRange[0] && hotel.priceRange.max <= priceRange[1]
      );

      // Filter by search query
      if (searchQuery) {
        filteredHotels = searchHotels(searchQuery);
      }

      setHotels(filteredHotels);
    } catch (error) {
      console.error('Failed to load hotels:', error);
      // Fallback to local data on error
      setHotels(keralaHotels.slice(0, 10));
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedCategory, selectedCity, priceRange, searchQuery, currentLocation]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  const handleCityFilter = (city: string) => {
    setSelectedCity(city);
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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
          {t('stay.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Find the perfect accommodation for your Kerala adventure
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search hotels or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Hotel Type Filter */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hotel Type</h4>
              <div className="flex flex-wrap gap-2">
                {hotelTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleTypeFilter(type.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedType === type.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <IconComponent size={16} />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget Category</h4>
              <div className="flex flex-wrap gap-2">
                {hotelCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryFilter(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-600 text-white'
                        : category.color + ' hover:opacity-80'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* City Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</h4>
              <select
                value={selectedCity}
                onChange={(e) => handleCityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range (per night)</h4>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">₹{priceRange[0].toLocaleString()}</span>
              <input
                type="range"
                min="0"
                max="25000"
                step="500"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ₹{priceRange[1].toLocaleString()}
              </span>
            </div>
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
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            try {
              // Simulate QR check-in process
              const qrCode = prompt('Scan QR code or enter booking reference:');
              if (qrCode) {
                // In real implementation, this would call backend API
                alert('QR Check-in successful! Welcome to your accommodation.');
              }
            } catch (error) {
              console.error('QR check-in failed:', error);
              alert('QR Check-in failed. Please try again.');
            }
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <QrCode size={24} />
            <div>
              <h3 className="font-semibold">QR Check-in</h3>
              <p className="text-sm opacity-90">Contactless check-in</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            try {
              // Filter hotels by accessibility
              const accessibleHotels = hotels.filter(hotel => 
                hotel.amenities.includes('Accessibility') || 
                hotel.amenities.includes('Wheelchair Access')
              );
              setHotels(accessibleHotels);
              alert(`Found ${accessibleHotels.length} accessible accommodations`);
            } catch (error) {
              console.error('Accessibility filter failed:', error);
            }
          }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Accessibility size={24} />
            <div>
              <h3 className="font-semibold">Accessibility</h3>
              <p className="text-sm opacity-90">Wheelchair friendly</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            try {
              // Show group booking options
              const groupSize = prompt('Enter group size (minimum 10 people):');
              if (groupSize && parseInt(groupSize) >= 10) {
                alert(`Group booking available for ${groupSize} people. Special rates and group amenities included!`);
              } else {
                alert('Group booking requires minimum 10 people.');
              }
            } catch (error) {
              console.error('Group booking failed:', error);
            }
          }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Users size={24} />
            <div>
              <h3 className="font-semibold">Group Booking</h3>
              <p className="text-sm opacity-90">Special group rates</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Hotels Grid */}
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
          {hotels.map((hotel) => (
            <motion.div
              key={hotel.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedHotel(hotel)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              {hotel.images && hotel.images.length > 0 && (
                <div className="h-48 bg-gray-200 dark:bg-gray-700">
                  <img
                    src={hotel.images[0]}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        hotel.category === 'budget' ? 'bg-green-100 text-green-800' :
                        hotel.category === 'mid-range' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {hotel.category.charAt(0).toUpperCase() + hotel.category.slice(1)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                        {hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star size={16} className="text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {hotel.rating}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {hotel.location.city}, {hotel.location.district}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      ₹{hotel.priceRange.min.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">- ₹{hotel.priceRange.max.toLocaleString()}/night</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Users size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {hotel.reviewCount} reviews
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {hotel.amenities.slice(0, 4).map((amenity, index) => {
                    const amenityIcon = amenities.find(a => a.name === amenity);
                    const IconComponent = amenityIcon?.icon || Hotel;
                    return (
                      <div key={index} className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        <IconComponent size={12} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{amenity}</span>
                      </div>
                    );
                  })}
                  {hotel.amenities.length > 4 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{hotel.amenities.length - 4} more
                    </span>
                  )}
                </div>

                {hotel.nearbyAttractions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nearby:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {hotel.nearbyAttractions.slice(0, 2).join(', ')}
                      {hotel.nearbyAttractions.length > 2 && '...'}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hotel.bookingLinks.bookingCom) {
                        window.open(hotel.bookingLinks.bookingCom, '_blank');
                      }
                    }}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Book Now
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHotel(hotel);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Hotel Detail Modal */}
      {selectedHotel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedHotel(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedHotel.name}
              </h2>
              <button
                onClick={() => setSelectedHotel(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedHotel.images && selectedHotel.images.length > 0 && (
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg">
                  <img
                    src={selectedHotel.images[0]}
                    alt={selectedHotel.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star size={20} className="text-yellow-500 fill-current" />
                    <span className="font-medium">{selectedHotel.rating}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({selectedHotel.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin size={20} className="text-gray-500 dark:text-gray-400" />
                    <span>{selectedHotel.location.city}, {selectedHotel.location.district}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedHotel.category === 'budget' ? 'bg-green-100 text-green-800' :
                    selectedHotel.category === 'mid-range' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedHotel.category.charAt(0).toUpperCase() + selectedHotel.category.slice(1)}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-400">
                    {selectedHotel.type.charAt(0).toUpperCase() + selectedHotel.type.slice(1)}
                  </span>
                </div>

                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  ₹{selectedHotel.priceRange.min.toLocaleString()} - ₹{selectedHotel.priceRange.max.toLocaleString()}
                  <span className="text-lg text-gray-500 dark:text-gray-400">/night</span>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Amenities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedHotel.amenities.map((amenity, index) => {
                      const amenityIcon = amenities.find(a => a.name === amenity);
                      const IconComponent = amenityIcon?.icon || Hotel;
                      return (
                        <div key={index} className="flex items-center space-x-2">
                          <IconComponent size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedHotel.nearbyAttractions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Nearby Attractions</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedHotel.nearbyAttractions.map((attraction, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                          {attraction}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedHotel.transportHubs.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Transport Hubs</h3>
                    <div className="space-y-1">
                      {selectedHotel.transportHubs.map((hub, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          • {hub}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Contact Information</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Phone: {selectedHotel.contact.phone}</p>
                    {selectedHotel.contact.email && <p>Email: {selectedHotel.contact.email}</p>}
                    {selectedHotel.contact.website && <p>Website: {selectedHotel.contact.website}</p>}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button 
                    onClick={() => {
                      if (selectedHotel.bookingLinks.bookingCom) {
                        window.open(selectedHotel.bookingLinks.bookingCom, '_blank');
                      }
                    }}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Book Now
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedHotel.bookingLinks.makeMyTrip) {
                        window.open(selectedHotel.bookingLinks.makeMyTrip, '_blank');
                      }
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Check Availability
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default StayModule;