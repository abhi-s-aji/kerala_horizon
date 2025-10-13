import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Bus,
  Train,
  Plane,
  Car,
  Ship,
  MapPin,
  Clock,
  Navigation,
  Zap,
  ParkingCircle,
  AlertTriangle
} from 'lucide-react';
import { apiService, BusRoute, TrainSchedule, FlightStatus, Location } from '../../../services/api';
import { realAPIService, FlightData, WeatherData } from '../../../services/realApis';
import backendAPI from '../../../services/backendApi';
import LoadingSpinner from '../../Common/LoadingSpinner';
import PlacesSearch from './PlacesSearch';

const TransportModule: React.FC = () => {
  const { t } = useTranslation();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [trainSchedules, setTrainSchedules] = useState<TrainSchedule[]>([]);
  const [flightStatus, setFlightStatus] = useState<FlightData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    try {
      const location = await apiService.getCurrentLocation();
      setCurrentLocation(location);
      
      // Load weather data for the location
      if (location) {
        const weather = await realAPIService.getWeatherData(location.lat, location.lng);
        setWeatherData(weather);
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  const handleServiceClick = async (serviceId: string) => {
    setSelectedService(selectedService === serviceId ? null : serviceId);
    
    if (selectedService !== serviceId) {
      setLoading(true);
      try {
        switch (serviceId) {
          case 'bus':
            if (currentLocation) {
              const busData = await backendAPI.trackBus('R001', 'KL-01-AB-1234');
              // Convert backend response to frontend format
              const routes = [{
                id: '1',
                name: busData.busNumber || 'KSRTC Bus',
                from: 'Kochi',
                to: 'Thiruvananthapuram',
                departureTime: '06:00',
                arrivalTime: '10:30',
                fare: 150,
                availableSeats: 25,
                status: 'on-time' as const
              }];
              setBusRoutes(routes);
            }
            break;
          case 'train':
            const trainData = await backendAPI.getTrainSchedules('Kochi', 'Thiruvananthapuram');
            setTrainSchedules(trainData.schedules || []);
            break;
          case 'flight':
            const flightData = await backendAPI.getFlightStatus('AI-123', new Date().toISOString());
            setFlightStatus(flightData.flights || []);
            break;
          case 'ev':
            // Google Places integration will be handled by PlacesSearch component
            break;
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to mock data
        if (serviceId === 'bus') {
          setBusRoutes([{
            id: '1',
            name: 'KSRTC Express',
            from: 'Kochi',
            to: 'Thiruvananthapuram',
            departureTime: '06:00',
            arrivalTime: '10:30',
            fare: 150,
            availableSeats: 25,
            status: 'on-time' as const
          }]);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Quick Actions
  const handleQuickAction = async (action: string, serviceId: string) => {
    setLoading(true);
    try {
      switch (action) {
        case 'findNearby':
          if (serviceId === 'ev' || serviceId === 'parking') {
            // This will be handled by PlacesSearch component
            setSelectedService(serviceId);
          } else if (currentLocation) {
            // Use backend API to get nearby transport options
            const locationData = await backendAPI.getLocationData(
              currentLocation.lat, 
              currentLocation.lng, 
              5000
            );
            alert(`Found ${locationData.transportOptions?.length || 0} nearby transport options`);
          } else {
            await loadCurrentLocation();
          }
          break;
        case 'checkSchedule':
          if (serviceId === 'bus') {
            const busData = await backendAPI.trackBus('R001', 'KL-01-AB-1234');
            const routes = [{
              id: '1',
              name: busData.busNumber || 'KSRTC Bus',
              from: 'Kochi',
              to: 'Thiruvananthapuram',
              departureTime: '06:00',
              arrivalTime: '10:30',
              fare: 150,
              availableSeats: 25,
              status: 'on-time' as const
            }];
            setBusRoutes(routes);
            setSelectedService('bus');
          } else if (serviceId === 'train') {
            const trainData = await backendAPI.getTrainSchedules('Kochi', 'Thiruvananthapuram');
            setTrainSchedules(trainData.schedules || []);
            setSelectedService('train');
          } else if (serviceId === 'flight') {
            const flightData = await backendAPI.getFlightStatus('AI-123', new Date().toISOString());
            setFlightStatus(flightData.flights || []);
            setSelectedService('flight');
          }
          break;
        case 'bookNow':
          // Open booking URLs
          const bookingUrls = {
            bus: 'https://www.ksrtc.in/',
            train: 'https://www.irctc.co.in/',
            flight: 'https://www.makemytrip.com/',
            cab: 'https://www.uber.com/',
            water: 'https://www.keralatourism.org/'
          };
          if (bookingUrls[serviceId as keyof typeof bookingUrls]) {
            window.open(bookingUrls[serviceId as keyof typeof bookingUrls], '_blank');
          }
          break;
        case 'getDirections':
          if (currentLocation) {
            const directionsUrl = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}`;
            window.open(directionsUrl, '_blank');
          } else {
            alert('Location not available. Please enable location services.');
          }
          break;
        case 'checkWeather':
          if (currentLocation) {
            const weather = await realAPIService.getWeatherData(currentLocation.lat, currentLocation.lng);
            setWeatherData(weather);
            alert(`Current weather: ${weather.temperature}°C, ${weather.condition}, Humidity: ${weather.humidity}%`);
          }
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
      alert('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const transportServices = [
    {
      id: 'bus',
      title: t('transport.busTracking'),
      description: 'Real-time KSRTC & Swift bus tracking',
      icon: Bus,
      color: 'bg-blue-500',
      features: ['Live tracking', 'Route information', 'Schedule updates', 'Fare calculator'],
      quickActions: [
        { label: 'Check Schedule', action: 'checkSchedule' },
        { label: 'Book Now', action: 'bookNow' },
        { label: 'Find Nearby', action: 'findNearby' }
      ]
    },
    {
      id: 'train',
      title: t('transport.trainSchedule'),
      description: 'IRCTC integration with live schedules',
      icon: Train,
      color: 'bg-green-500',
      features: ['Live schedules', 'Seat availability', 'Booking integration', 'Platform info'],
      quickActions: [
        { label: 'Check Schedule', action: 'checkSchedule' },
        { label: 'Book Now', action: 'bookNow' },
        { label: 'Find Nearby', action: 'findNearby' }
      ]
    },
    {
      id: 'flight',
      title: t('transport.flightStatus'),
      description: 'CIAL, Trivandrum, Kannur airport status',
      icon: Plane,
      color: 'bg-purple-500',
      features: ['Flight status', 'Terminal info', 'Baggage tracking', 'Airport services'],
      quickActions: [
        { label: 'Check Schedule', action: 'checkSchedule' },
        { label: 'Book Now', action: 'bookNow' },
        { label: 'Get Directions', action: 'getDirections' }
      ]
    },
    {
      id: 'cab',
      title: t('transport.cabBooking'),
      description: 'Uber, Ola, and local auto integration',
      icon: Car,
      color: 'bg-orange-500',
      features: ['Multi-app booking', 'Fare comparison', 'Driver tracking', 'Local autos'],
      quickActions: [
        { label: 'Book Now', action: 'bookNow' },
        { label: 'Find Nearby', action: 'findNearby' },
        { label: 'Get Directions', action: 'getDirections' }
      ]
    },
    {
      id: 'water',
      title: t('transport.waterTransport'),
      description: 'Ferries and houseboat schedules',
      icon: Ship,
      color: 'bg-cyan-500',
      features: ['Ferry schedules', 'Houseboat booking', 'Route planning', 'Weather alerts'],
      quickActions: [
        { label: 'Book Now', action: 'bookNow' },
        { label: 'Check Weather', action: 'checkWeather' },
        { label: 'Get Directions', action: 'getDirections' }
      ]
    },
    {
      id: 'route',
      title: t('transport.routePlanner'),
      description: 'Multi-modal route suggestions',
      icon: Navigation,
      color: 'bg-indigo-500',
      features: ['Multi-modal routes', 'Real-time traffic', 'Cost comparison', 'Time estimates'],
      quickActions: [
        { label: 'Get Directions', action: 'getDirections' },
        { label: 'Find Nearby', action: 'findNearby' },
        { label: 'Check Weather', action: 'checkWeather' }
      ]
    },
    {
      id: 'ev',
      title: 'EV Charging & Parking',
      description: 'Find nearby EV charging stations and parking facilities using Google Places API',
      icon: Zap,
      color: 'bg-emerald-500',
      features: ['Real-time search', 'Distance calculation', 'Google Maps integration', 'Offline caching'],
      quickActions: [
        { label: 'Find Nearby', action: 'findNearby' },
        { label: 'Get Directions', action: 'getDirections' },
        { label: 'Check Weather', action: 'checkWeather' }
      ]
    },
    {
      id: 'parking',
      title: t('transport.parking'),
      description: 'Parking finder and fuel stations',
      icon: ParkingCircle,
      color: 'bg-yellow-500',
      features: ['Parking spots', 'Fuel stations', 'Pricing info', 'Availability'],
      quickActions: [
        { label: 'Find Nearby', action: 'findNearby' },
        { label: 'Get Directions', action: 'getDirections' },
        { label: 'Check Weather', action: 'checkWeather' }
      ]
    },
    {
      id: 'traffic',
      title: t('transport.trafficAlerts'),
      description: 'Traffic alerts and smart detours',
      icon: AlertTriangle,
      color: 'bg-red-500',
      features: ['Traffic alerts', 'Accident reports', 'Road closures', 'Alternative routes'],
      quickActions: [
        { label: 'Check Weather', action: 'checkWeather' },
        { label: 'Get Directions', action: 'getDirections' },
        { label: 'Find Nearby', action: 'findNearby' }
      ]
    }
  ];

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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
          {t('transport.title')}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4 px-4">
          Navigate Kerala with ease using our comprehensive transport and connectivity solutions
        </p>
        <div className="flex flex-wrap gap-2 sm:gap-4 justify-center px-4">
          {currentLocation && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg">
              <MapPin size={16} />
              <span className="text-sm">
                Current Location: {currentLocation.address || `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`}
              </span>
            </div>
          )}
          
          {weatherData && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
              <span className="text-sm">
                🌤️ {weatherData.temperature}°C | {weatherData.condition} | Humidity: {weatherData.humidity}%
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Transport Services Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
      >
        {transportServices.map((service) => {
          const IconComponent = service.icon;
          const isSelected = selectedService === service.id;
          
          return (
            <motion.div
              key={service.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleServiceClick(service.id)}
              className={`
                card cursor-pointer transition-all duration-300 group
                ${isSelected ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md'}
              `}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${service.color} text-white`}>
                  <IconComponent size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {service.description}
                  </p>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex flex-wrap gap-2 mb-4">
                        {service.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Quick Action Buttons */}
                      {service.quickActions && service.quickActions.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 mb-4">
                          {service.quickActions.map((action, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction(action.action, service.id);
                              }}
                              className="w-full btn-primary text-sm flex items-center justify-center space-x-2"
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Loading...</span>
                                </>
                              ) : (
                                <span>{action.label}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {loading && <LoadingSpinner size="sm" className="my-4" />}
                      
                      {/* Real-time data display */}
                      {!loading && service.id === 'bus' && busRoutes.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">Available Routes:</h4>
                          {busRoutes.map((route) => (
                            <div key={route.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{route.name}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {route.departureTime} - {route.arrivalTime}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">₹{route.fare}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {route.availableSeats} seats
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {!loading && service.id === 'train' && trainSchedules.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">Train Schedules:</h4>
                          {trainSchedules.map((train) => (
                            <div key={train.trainNumber} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{train.trainName}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {train.trainNumber} | {train.departureTime} - {train.arrivalTime}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">₹{train.fare}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {train.availableSeats} seats
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {!loading && service.id === 'flight' && flightStatus.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">Flight Status:</h4>
                          {flightStatus.map((flight) => (
                            <div key={flight.flightNumber} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{flight.airline} {flight.flightNumber}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {flight.from} → {flight.to}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{flight.status}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {flight.gate && `Gate ${flight.gate}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {service.id === 'ev' && isSelected && (
                        <div className="mt-4">
                          <PlacesSearch searchType="both" />
                        </div>
                      )}
                      
                      <button className="w-full mt-4 btn-primary text-sm">
                        {t('common.learnMore')}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <MapPin className="text-primary-600 mb-2" size={24} />
            <span className="text-sm font-medium">Find Nearby</span>
          </button>
          <button className="flex flex-col items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Clock className="text-primary-600 mb-2" size={24} />
            <span className="text-sm font-medium">Check Schedule</span>
          </button>
          <button className="flex flex-col items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Navigation className="text-primary-600 mb-2" size={24} />
            <span className="text-sm font-medium">Plan Route</span>
          </button>
          <button className="flex flex-col items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <AlertTriangle className="text-primary-600 mb-2" size={24} />
            <span className="text-sm font-medium">Traffic Alerts</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TransportModule;
