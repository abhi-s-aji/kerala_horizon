import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Siren,
  Phone,
  MapPin,
  AlertTriangle,
  Shield,
  Heart,
  Users,
  Home,
  Clock,
  Star,
  Navigation,
  Camera,
  MessageCircle,
  Share2,
  Mic,
  MicOff,
  DollarSign,
  Utensils
} from 'lucide-react';
import { realAPIService, EmergencyContact } from '../../../services/realApis';
import { geminiAIService } from '../../../services/geminiAI';
import { apiService } from '../../../services/api';
import backendAPI from '../../../services/backendApi';
import LoadingSpinner from '../../Common/LoadingSpinner';

interface EmergencyService {
  id: string;
  name: string;
  number: string;
  type: 'police' | 'ambulance' | 'fire' | 'tourist' | 'hospital' | 'women' | 'child';
  description: string;
  icon: any;
  color: string;
  available24x7: boolean;
  responseTime: string;
}

interface SafetyAlert {
  id: string;
  type: 'weather' | 'traffic' | 'health' | 'security' | 'disaster';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  timestamp: Date;
  expiresAt?: Date;
  actionRequired: boolean;
}

interface NearbyService {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'pharmacy' | 'atm' | 'restaurant' | 'hotel';
  distance: number;
  address: string;
  phone?: string;
  rating: number;
  isOpen: boolean;
  coordinates: { lat: number; lng: number };
}

const SOSModule: React.FC = () => {
  const { t } = useTranslation();
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [nearbyServices, setNearbyServices] = useState<NearbyService[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedService, setSelectedService] = useState<EmergencyService | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const emergencyServices: EmergencyService[] = [
    {
      id: '1',
      name: 'Police',
      number: '100',
      type: 'police',
      description: 'Emergency police assistance',
      icon: Shield,
      color: 'bg-blue-500',
      available24x7: true,
      responseTime: '5-10 minutes'
    },
    {
      id: '2',
      name: 'Ambulance',
      number: '108',
      type: 'ambulance',
      description: 'Medical emergency services',
      icon: Heart,
      color: 'bg-red-500',
      available24x7: true,
      responseTime: '10-15 minutes'
    },
    {
      id: '3',
      name: 'Fire Service',
      number: '101',
      type: 'fire',
      description: 'Fire and rescue services',
      icon: Siren,
      color: 'bg-orange-500',
      available24x7: true,
      responseTime: '5-8 minutes'
    },
    {
      id: '4',
      name: 'Tourist Helpline',
      number: '1363',
      type: 'tourist',
      description: 'Tourist assistance and information',
      icon: Users,
      color: 'bg-green-500',
      available24x7: true,
      responseTime: 'Immediate'
    },
    {
      id: '5',
      name: 'Women Helpline',
      number: '1091',
      type: 'women',
      description: 'Women safety and support',
      icon: Heart,
      color: 'bg-pink-500',
      available24x7: true,
      responseTime: 'Immediate'
    },
    {
      id: '6',
      name: 'Child Helpline',
      number: '1098',
      type: 'child',
      description: 'Child protection and support',
      icon: Heart,
      color: 'bg-purple-500',
      available24x7: true,
      responseTime: 'Immediate'
    }
  ];

  const loadCurrentLocation = useCallback(async () => {
    try {
      const location = await apiService.getCurrentLocation();
      setCurrentLocation({ lat: location.lat, lng: location.lng });
      await loadNearbyServices(location.lat, location.lng);
    } catch (error) {
      console.error('Failed to get location:', error);
      // Fallback to Kochi coordinates
      const fallbackLocation = { lat: 9.9312, lng: 76.2673 };
      setCurrentLocation(fallbackLocation);
      await loadNearbyServices(fallbackLocation.lat, fallbackLocation.lng);
    }
  }, []);

  useEffect(() => {
    loadCurrentLocation();
    generateSafetyAlerts();
  }, [loadCurrentLocation]);

  const loadNearbyServices = async (lat: number, lng: number) => {
    try {
      // Mock nearby services data
      const services: NearbyService[] = [
        {
          id: '1',
          name: 'General Hospital',
          type: 'hospital',
          distance: 0.8,
          address: 'MG Road, Kochi',
          phone: '+91-484-1234567',
          rating: 4.2,
          isOpen: true,
          coordinates: { lat: lat + 0.01, lng: lng + 0.01 }
        },
        {
          id: '2',
          name: 'Police Station',
          type: 'police',
          distance: 1.2,
          address: 'Fort Kochi Police Station',
          phone: '+91-484-1234568',
          rating: 4.0,
          isOpen: true,
          coordinates: { lat: lat - 0.01, lng: lng + 0.01 }
        },
        {
          id: '3',
          name: 'Apollo Pharmacy',
          type: 'pharmacy',
          distance: 0.5,
          address: 'Marine Drive, Kochi',
          phone: '+91-484-1234569',
          rating: 4.5,
          isOpen: true,
          coordinates: { lat: lat + 0.005, lng: lng - 0.005 }
        }
      ];
      setNearbyServices(services);
    } catch (error) {
      console.error('Failed to load nearby services:', error);
    }
  };

  const generateSafetyAlerts = async () => {
    try {
      const alerts: SafetyAlert[] = [
        {
          id: '1',
          type: 'weather',
          title: 'Heavy Rain Alert',
          message: 'Heavy rainfall expected in Kochi area. Avoid water activities and stay indoors.',
          severity: 'medium',
          location: 'Kochi',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          actionRequired: true
        },
        {
          id: '2',
          type: 'traffic',
          title: 'Road Closure',
          message: 'MG Road closed for maintenance. Use alternative routes.',
          severity: 'low',
          location: 'Kochi',
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
          actionRequired: false
        }
      ];
      setSafetyAlerts(alerts);
    } catch (error) {
      console.error('Failed to generate safety alerts:', error);
    }
  };

  const makeEmergencyCall = (number: string) => {
    window.open(`tel:${number}`, '_self');
  };


  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording implementation would go here
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'hospital': return Heart;
      case 'police': return Shield;
      case 'pharmacy': return Heart;
      case 'atm': return DollarSign;
      case 'restaurant': return Utensils;
      case 'hotel': return Home;
      default: return MapPin;
    }
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
          {t('sos.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Emergency assistance and safety information for your Kerala journey
        </p>
      </motion.div>

      {/* Emergency Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => makeEmergencyCall('100')}
          className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl shadow-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Shield size={32} />
            <div className="text-left">
              <h3 className="text-xl font-bold">Emergency Police</h3>
              <p className="text-sm opacity-90">Call 100</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => makeEmergencyCall('108')}
          className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-xl shadow-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Heart size={32} />
            <div className="text-left">
              <h3 className="text-xl font-bold">Medical Emergency</h3>
              <p className="text-sm opacity-90">Call 108</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => makeEmergencyCall('1363')}
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl shadow-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Users size={32} />
            <div className="text-left">
              <h3 className="text-xl font-bold">Tourist Helpline</h3>
              <p className="text-sm opacity-90">Call 1363</p>
            </div>
          </div>
        </motion.button>
      </motion.div>

      {/* Safety Alerts */}
      {safetyAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Safety Alerts</h2>
          <div className="space-y-3">
            {safetyAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  alert.severity === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                  alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-green-500 bg-green-50 dark:bg-green-900/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle size={20} className="text-orange-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {alert.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MapPin size={12} />
                        <span>{alert.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{alert.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  {alert.actionRequired && (
                    <button className="ml-4 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-lg transition-colors">
                      Action Required
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Emergency Services */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Emergency Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emergencyServices.map((service) => {
            const IconComponent = service.icon;
            return (
              <motion.div
                key={service.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedService(service)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${service.color} text-white`}>
                    <IconComponent size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {service.number}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          makeEmergencyCall(service.number);
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Call Now
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Response Time: {service.responseTime}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Nearby Services */}
      {nearbyServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nearby Services</h2>
          <div className="space-y-3">
            {nearbyServices.map((service) => {
              const IconComponent = getServiceIcon(service.type);
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <IconComponent size={20} className="text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {service.address}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {service.distance} km away
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star size={14} className="text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {service.rating}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            service.isOpen 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {service.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {service.phone && (
                        <button
                          onClick={() => makeEmergencyCall(service.phone!)}
                          className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                        >
                          <Phone size={16} />
                        </button>
                      )}
                      <button className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                        <Navigation size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Emergency Tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Emergency Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={toggleRecording}
            className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
              isRecording
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
            }`}
          >
            <div className="text-center">
              {isRecording ? <MicOff size={24} className="mx-auto mb-2" /> : <Mic size={24} className="mx-auto mb-2" />}
              <h3 className="font-medium text-sm">
                {isRecording ? 'Stop Recording' : 'Voice Recording'}
              </h3>
            </div>
          </button>

          <button className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
            <div className="text-center">
              <Camera size={24} className="mx-auto mb-2" />
              <h3 className="font-medium text-sm">Emergency Photo</h3>
            </div>
          </button>

          <button className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
            <div className="text-center">
              <MessageCircle size={24} className="mx-auto mb-2" />
              <h3 className="font-medium text-sm">Send Location</h3>
            </div>
          </button>

          <button className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
            <div className="text-center">
              <Share2 size={24} className="mx-auto mb-2" />
              <h3 className="font-medium text-sm">Share Status</h3>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Service Detail Modal */}
      {selectedService && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedService(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedService.name}
              </h2>
              <button
                onClick={() => setSelectedService(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className={`inline-flex p-4 rounded-full ${selectedService.color} text-white mb-4`}>
                  <selectedService.icon size={32} />
                </div>
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {selectedService.number}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedService.description}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                  <span className="font-medium">{selectedService.responseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Available:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {selectedService.available24x7 ? '24/7' : 'Limited Hours'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => makeEmergencyCall(selectedService.number)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Call Now
                </button>
                <button
                  onClick={() => setSelectedService(null)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SOSModule;