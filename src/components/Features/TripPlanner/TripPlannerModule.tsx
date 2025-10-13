import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Map,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Share2,
  Download,
  Navigation,
  Car,
  Train,
  Plane,
  Ship,
  CheckCircle
} from 'lucide-react';
import { geminiAIService } from '../../../services/geminiAI';
import { realAPIService, ExchangeRate } from '../../../services/realApis';
import { validateTripPlan } from '../../../utils/validation';
import { handleAPIError } from '../../../utils/errorHandler';
import APIErrorBoundary from '../../Common/APIErrorBoundary';
import LoadingSpinner from '../../Common/LoadingSpinner';

interface ItineraryItem {
  id: string;
  day: number;
  time: string;
  activity: string;
  location: string;
  duration: string;
  cost: number;
  transport: 'walking' | 'car' | 'train' | 'flight' | 'ship';
  notes: string;
  completed: boolean;
}

interface TripPlan {
  id: string;
  title: string;
  duration: number;
  budget: number;
  travelers: number;
  startDate: string;
  endDate: string;
  items: ItineraryItem[];
  totalCost: number;
  currency: string;
}

const TripPlannerModule: React.FC = () => {
  const { t } = useTranslation();
  const [tripPlans, setTripPlans] = useState<TripPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  const transportIcons = {
    walking: Navigation,
    car: Car,
    train: Train,
    flight: Plane,
    ship: Ship
  };

  useEffect(() => {
    loadTripPlans();
    loadExchangeRates();
  }, []);

  const loadTripPlans = () => {
    const savedPlans = localStorage.getItem('tripPlans');
    if (savedPlans) {
      setTripPlans(JSON.parse(savedPlans));
    }
  };

  const loadExchangeRates = async () => {
    try {
      const rates = await Promise.all([
        realAPIService.getExchangeRate('USD', 'INR'),
        realAPIService.getExchangeRate('EUR', 'INR'),
        realAPIService.getExchangeRate('GBP', 'INR'),
        realAPIService.getExchangeRate('AED', 'INR')
      ]);
      setExchangeRates(rates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    }
  };

  const saveTripPlans = (plans: TripPlan[]) => {
    setTripPlans(plans);
    localStorage.setItem('tripPlans', JSON.stringify(plans));
  };

  const createNewPlan = async (formData: any) => {
    setLoading(true);
    setSubmitError('');
    
    try {
      let aiItinerary = '';
      try {
        aiItinerary = await geminiAIService.getTravelAdvice(
          `Create an itinerary for ${formData.duration} days in Kerala with preferences: ${formData.preferences}`
        );
      } catch (aiError) {
        console.warn('AI suggestions failed:', aiError);
        // Continue without AI suggestions - not critical
      }

      const newPlan: TripPlan = {
        id: Date.now().toString(),
        title: formData.title,
        duration: formData.duration,
        budget: formData.budget,
        travelers: formData.travelers,
        startDate: formData.startDate,
        endDate: formData.endDate,
        items: aiItinerary ? parseAIItinerary(aiItinerary, formData.duration) : [],
        totalCost: 0,
        currency: formData.currency || 'INR'
      };

      newPlan.totalCost = newPlan.items.reduce((sum, item) => sum + item.cost, 0);
      const updatedPlans = [...tripPlans, newPlan];
      saveTripPlans(updatedPlans);
      setCurrentPlan(newPlan);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create trip plan:', error);
      setSubmitError(handleAPIError(error, 'Trip Plan Creation'));
    } finally {
      setLoading(false);
    }
  };

  const parseAIItinerary = (aiText: string, duration: number): ItineraryItem[] => {
    const items: ItineraryItem[] = [];
    const lines = aiText.split('\n').filter(line => line.trim());
    
    let currentDay = 1;
    let itemId = 1;

    lines.forEach((line) => {
      if (line.includes('Day') || line.includes('day')) {
        const dayMatch = line.match(/day\s*(\d+)/i);
        if (dayMatch) {
          currentDay = parseInt(dayMatch[1]);
        }
      } else if (line.includes('-') || line.includes('•')) {
        const activity = line.replace(/^[-•]\s*/, '').trim();
        if (activity) {
          items.push({
            id: itemId.toString(),
            day: currentDay,
            time: '09:00',
            activity,
            location: 'Kerala',
            duration: '2 hours',
            cost: Math.floor(Math.random() * 2000) + 500,
            transport: 'car',
            notes: '',
            completed: false
          });
          itemId++;
        }
      }
    });

    return items;
  };

  const addItineraryItem = (day: number) => {
    const newItem: ItineraryItem = {
      id: Date.now().toString(),
      day,
      time: '09:00',
      activity: '',
      location: '',
      duration: '2 hours',
      cost: 0,
      transport: 'car',
      notes: '',
      completed: false
    };
    setEditingItem(newItem);
  };

  const saveItineraryItem = (item: ItineraryItem) => {
    if (!currentPlan) return;

    const updatedItems = editingItem?.id === item.id
      ? currentPlan.items.map(i => i.id === item.id ? item : i)
      : [...currentPlan.items, item];

    const updatedPlan = {
      ...currentPlan,
      items: updatedItems,
      totalCost: updatedItems.reduce((sum, item) => sum + item.cost, 0)
    };

    setCurrentPlan(updatedPlan);
    const updatedPlans = tripPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    saveTripPlans(updatedPlans);
    setEditingItem(null);
  };

  const deleteItineraryItem = (itemId: string) => {
    if (!currentPlan) return;

    const updatedItems = currentPlan.items.filter(item => item.id !== itemId);
    const updatedPlan = {
      ...currentPlan,
      items: updatedItems,
      totalCost: updatedItems.reduce((sum, item) => sum + item.cost, 0)
    };

    setCurrentPlan(updatedPlan);
    const updatedPlans = tripPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    saveTripPlans(updatedPlans);
  };

  const toggleItemCompleted = (itemId: string) => {
    if (!currentPlan) return;

    const updatedItems = currentPlan.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updatedPlan = { ...currentPlan, items: updatedItems };
    setCurrentPlan(updatedPlan);
    const updatedPlans = tripPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    saveTripPlans(updatedPlans);
  };

  return (
    <APIErrorBoundary>
      <div className="space-y-8">
        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300 text-sm">{submitError}</p>
          </div>
        )}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
          {t('tripPlanner.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Plan your perfect Kerala adventure with AI-powered itinerary suggestions
        </p>
      </motion.div>

      {/* Exchange Rates */}
      {exchangeRates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Live Exchange Rates</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {exchangeRates.map((rate, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">{rate.from}</div>
                <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  ₹{rate.rate.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Trip Plans List */}
      {!currentPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Trip Plans</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create New Plan</span>
            </button>
          </div>

          {tripPlans.length === 0 ? (
            <div className="text-center py-12">
              <Map size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No trip plans yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first Kerala adventure plan
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Create Your First Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tripPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setCurrentPlan(plan)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {plan.title}
                    </h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {plan.duration} days
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users size={16} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {plan.travelers} travelers
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign size={16} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ₹{plan.totalCost.toLocaleString()} total
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {plan.items.length} activities
                    </span>
                    <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Create Trip Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Trip Plan
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                
                // Validate form
                const errors = validateTripPlan(formData);
                setFormErrors(errors);
                
                if (Object.keys(errors).length === 0) {
                  createNewPlan({
                    title: formData.get('title'),
                    duration: parseInt(formData.get('duration') as string),
                    budget: parseInt(formData.get('budget') as string),
                    travelers: parseInt(formData.get('travelers') as string),
                    startDate: formData.get('startDate'),
                    endDate: formData.get('endDate'),
                    preferences: formData.get('preferences'),
                    currency: formData.get('currency')
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trip Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="My Kerala Adventure"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    min="1"
                    max="30"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    min="1000"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Travelers
                  </label>
                  <input
                    type="number"
                    name="travelers"
                    min="1"
                    max="20"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Travel Preferences
                </label>
                <textarea
                  name="preferences"
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., cultural sites, backwaters, hill stations, beaches, adventure activities..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Plus size={20} />}
                  <span>{loading ? 'Creating...' : 'Create Plan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Trip Plan Details */}
      {currentPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Plan Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentPlan.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentPlan.duration} days • {currentPlan.travelers} travelers
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPlan(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ← Back
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Share2 size={20} />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Download size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  ₹{currentPlan.totalCost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {currentPlan.items.filter(item => item.completed).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currentPlan.items.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Activities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round((currentPlan.items.filter(item => item.completed).length / currentPlan.items.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
              </div>
            </div>
          </div>

          {/* Itinerary by Day */}
          <div className="space-y-6">
            {Array.from({ length: currentPlan.duration }, (_, dayIndex) => {
              const day = dayIndex + 1;
              const dayItems = currentPlan.items.filter(item => item.day === day);
              
              return (
                <div key={day} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Day {day}
                    </h3>
                    <button
                      onClick={() => addItineraryItem(day)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Activity</span>
                    </button>
                  </div>

                  {dayItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No activities planned for this day
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayItems.map((item) => {
                        const TransportIcon = transportIcons[item.transport];
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-lg border ${
                              item.completed
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <button
                                    onClick={() => toggleItemCompleted(item.id)}
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      item.completed
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                  >
                                    {item.completed && <CheckCircle size={12} />}
                                  </button>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {item.activity}
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.time}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center space-x-1">
                                    <MapPin size={14} />
                                    <span>{item.location}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock size={14} />
                                    <span>{item.duration}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <TransportIcon size={14} />
                                    <span className="capitalize">{item.transport}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <DollarSign size={14} />
                                    <span>₹{item.cost}</span>
                                  </div>
                                </div>

                                {item.notes && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    {item.notes}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => setEditingItem(item)}
                                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => deleteItineraryItem(item.id)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      </div>
    </APIErrorBoundary>
  );
};

export default TripPlannerModule;