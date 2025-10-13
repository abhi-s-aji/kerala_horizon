import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  Camera,
  Headphones,
  Search,
  Filter,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  Download
} from 'lucide-react';
import { realAPIService, CulturalEvent } from '../../../services/realApis';
import { geminiAIService } from '../../../services/geminiAI';
import { handleAPIError } from '../../../utils/errorHandler';
import backendAPI from '../../../services/backendApi';
import APIErrorBoundary from '../../Common/APIErrorBoundary';
import LoadingSpinner from '../../Common/LoadingSpinner';

interface HeritageSite {
  id: string;
  name: string;
  type: 'temple' | 'palace' | 'fort' | 'museum' | 'monument';
  location: string;
  description: string;
  timings: string;
  entryFee: number;
  imageUrl: string;
  significance: string;
  bestTimeToVisit: string;
  nearbyAttractions: string[];
}

interface ArtForm {
  id: string;
  name: string;
  description: string;
  origin: string;
  performers: string;
  duration: string;
  imageUrl: string;
  videoUrl?: string;
  venues: string[];
  bookingInfo: string;
}

const CultureModule: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<CulturalEvent[]>([]);
  const [heritageSites, setHeritageSites] = useState<HeritageSite[]>([]);
  const [artForms, setArtForms] = useState<ArtForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CulturalEvent | null>(null);
  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null);
  const [selectedArtForm, setSelectedArtForm] = useState<ArtForm | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const categories = [
    { id: 'events', label: 'Cultural Events', icon: Calendar },
    { id: 'heritage', label: 'Heritage Sites', icon: BookOpen },
    { id: 'artforms', label: 'Art Forms', icon: Headphones }
  ];

  useEffect(() => {
    loadCulturalData();
  }, []);

  const loadCulturalData = async () => {
    setLoading(true);
    try {
      // Load cultural events
      const culturalEvents = await realAPIService.getCulturalEvents();
      setEvents(culturalEvents);

      // Load heritage sites (mock data for now)
      const sites: HeritageSite[] = [
        {
          id: '1',
          name: 'Padmanabhaswamy Temple',
          type: 'temple',
          location: 'Thiruvananthapuram',
          description: 'One of the 108 Divya Desams, famous for its Dravidian architecture and the mysterious vaults.',
          timings: '3:30 AM - 12:00 PM, 5:00 PM - 8:30 PM',
          entryFee: 0,
          imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400',
          significance: 'Sacred Hindu temple dedicated to Lord Vishnu',
          bestTimeToVisit: 'Early morning or evening',
          nearbyAttractions: ['Kovalam Beach', 'Napier Museum', 'Kuthira Malika Palace']
        },
        {
          id: '2',
          name: 'Mattancherry Palace',
          type: 'palace',
          location: 'Kochi',
          description: 'Portuguese palace with beautiful murals depicting scenes from the Ramayana and Mahabharata.',
          timings: '10:00 AM - 5:00 PM',
          entryFee: 5,
          imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
          significance: 'Historic palace showcasing Kerala mural art',
          bestTimeToVisit: 'Morning hours',
          nearbyAttractions: ['Jewish Synagogue', 'Chinese Fishing Nets', 'Fort Kochi Beach']
        },
        {
          id: '3',
          name: 'Bekal Fort',
          type: 'fort',
          location: 'Kasaragod',
          description: 'Largest fort in Kerala, offering panoramic views of the Arabian Sea.',
          timings: '8:00 AM - 6:00 PM',
          entryFee: 20,
          imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
          significance: 'Historic fort with strategic importance',
          bestTimeToVisit: 'Sunset for best views',
          nearbyAttractions: ['Bekal Beach', 'Kappil Beach', 'Chandragiri Fort']
        }
      ];
      setHeritageSites(sites);

      // Load art forms (mock data for now)
      const forms: ArtForm[] = [
        {
          id: '1',
          name: 'Kathakali',
          description: 'Classical dance-drama of Kerala, known for elaborate costumes and facial expressions.',
          origin: '17th century Kerala',
          performers: 'Trained Kathakali artists',
          duration: '2-4 hours',
          imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
          venues: ['Kerala Kalamandalam', 'Kochi Cultural Centre', 'Thiruvananthapuram Theatre'],
          bookingInfo: 'Advance booking recommended'
        },
        {
          id: '2',
          name: 'Theyyam',
          description: 'Sacred ritual dance form performed in North Kerala, believed to be a divine manifestation.',
          origin: 'Ancient Kerala',
          performers: 'Traditional Theyyam artists',
          duration: '1-3 hours',
          imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
          venues: ['Kannur Theyyam Centres', 'Kasaragod Temples', 'Kozhikode Cultural Sites'],
          bookingInfo: 'Seasonal performances, check local schedules'
        },
        {
          id: '3',
          name: 'Mohiniyattam',
          description: 'Classical dance form of Kerala, characterized by graceful movements and expressions.',
          origin: '16th century Kerala',
          performers: 'Trained Mohiniyattam dancers',
          duration: '1-2 hours',
          imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
          venues: ['Kerala Kalamandalam', 'Kochi Cultural Centre', 'Thrissur Theatre'],
          bookingInfo: 'Regular performances available'
        }
      ];
      setArtForms(forms);
    } catch (error) {
      console.error('Failed to load cultural data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = () => {
    const query = searchQuery.toLowerCase();
    switch (selectedCategory) {
      case 'events':
        return events.filter(event => 
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.type.toLowerCase().includes(query)
        );
      case 'heritage':
        return heritageSites.filter(site =>
          site.name.toLowerCase().includes(query) ||
          site.location.toLowerCase().includes(query) ||
          site.type.toLowerCase().includes(query)
        );
      case 'artforms':
        return artForms.filter(form =>
          form.name.toLowerCase().includes(query) ||
          form.description.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  };

  const filteredEvents = () => {
    const query = searchQuery.toLowerCase();
    return events.filter(event => 
      event.title.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.type.toLowerCase().includes(query)
    );
  };

  const filteredHeritageSites = () => {
    const query = searchQuery.toLowerCase();
    return heritageSites.filter(site =>
      site.name.toLowerCase().includes(query) ||
      site.location.toLowerCase().includes(query) ||
      site.type.toLowerCase().includes(query)
    );
  };

  const filteredArtForms = () => {
    const query = searchQuery.toLowerCase();
    return artForms.filter(form =>
      form.name.toLowerCase().includes(query) ||
      form.description.toLowerCase().includes(query)
    );
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
          {t('culture.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover the rich cultural heritage and vibrant traditions of Kerala
        </p>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-center gap-2"
      >
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <IconComponent size={20} />
              <span>{category.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={`Search ${selectedCategory}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </motion.div>

      {/* Content Grid */}
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
          {selectedCategory === 'events' && filteredEvents().map((event) => (
            <motion.div
              key={event.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedEvent(event)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              {event.imageUrl && (
                <div className="h-48 bg-gray-200 dark:bg-gray-700">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {event.title}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Star size={16} className="text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      4.5
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {event.time}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {event.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    ₹{event.price}
                  </span>
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                    {event.type}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {selectedCategory === 'heritage' && filteredHeritageSites().map((site) => (
            <motion.div
              key={site.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedSite(site)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              <div className="h-48 bg-gray-200 dark:bg-gray-700">
                <img
                  src={site.imageUrl}
                  alt={site.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {site.name}
                  </h3>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                    {site.type}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {site.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {site.location}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {site.timings}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {site.entryFee === 0 ? 'Free' : `₹${site.entryFee}`}
                  </span>
                  <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {selectedCategory === 'artforms' && filteredArtForms().map((form) => (
            <motion.div
              key={form.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedArtForm(form)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              <div className="h-48 bg-gray-200 dark:bg-gray-700">
                <img
                  src={form.imageUrl}
                  alt={form.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {form.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Headphones size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {form.duration}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {form.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {form.origin}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {form.performers}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {form.bookingInfo}
                  </span>
                  <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Book Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedEvent.title}
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {selectedEvent.imageUrl && (
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4">
                <img
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {selectedEvent.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar size={20} className="text-gray-500 dark:text-gray-400" />
                  <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={20} className="text-gray-500 dark:text-gray-400" />
                  <span>{selectedEvent.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin size={20} className="text-gray-500 dark:text-gray-400" />
                  <span>{selectedEvent.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ₹{selectedEvent.price}
                  </span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors">
                  Book Tickets
                </button>
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                  Add to Calendar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Heritage Site Detail Modal */}
      {selectedSite && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSite(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedSite.name}
              </h2>
              <button
                onClick={() => setSelectedSite(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <img
                  src={selectedSite.imageUrl}
                  alt={selectedSite.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedSite.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Significance</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedSite.significance}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Timings</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedSite.timings}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Entry Fee</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedSite.entryFee === 0 ? 'Free' : `₹${selectedSite.entryFee}`}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Best Time</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedSite.bestTimeToVisit}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Location</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedSite.location}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Nearby Attractions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSite.nearbyAttractions.map((attraction, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-full"
                      >
                        {attraction}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors">
                    Get Directions
                  </button>
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                    Add to Itinerary
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Art Form Detail Modal */}
      {selectedArtForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedArtForm(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedArtForm.name}
              </h2>
              <button
                onClick={() => setSelectedArtForm(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <img
                  src={selectedArtForm.imageUrl}
                  alt={selectedArtForm.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedArtForm.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Origin</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedArtForm.origin}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Duration</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedArtForm.duration}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Performers</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedArtForm.performers}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Booking</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedArtForm.bookingInfo}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Performance Venues</h4>
                  <div className="space-y-2">
                    {selectedArtForm.venues.map((venue, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{venue}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors">
                    Book Performance
                  </button>
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                    Learn More
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

export default CultureModule;