import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Leaf,
  TreePine,
  Recycle,
  Droplets,
  Sun,
  Wind,
  Zap,
  Award,
  TrendingUp,
  Users,
  Target,
  Star,
  Plus,
  CheckCircle,
  AlertCircle,
  Info,
  Trophy,
  Medal,
  Shield
} from 'lucide-react';
import { greenScoreService, GreenScoreProfile, GreenScoreBadge, GreenScoreActivity } from '../../../services/greenScoreService';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../Common/LoadingSpinner';

interface EcoTip {
  id: string;
  title: string;
  description: string;
  category: 'transport' | 'accommodation' | 'food' | 'activity' | 'general';
  impact: 'low' | 'medium' | 'high';
  points: number;
  icon: any;
}

interface CarbonFootprintData {
  transport: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
}

const SustainabilityModule: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [greenScoreProfile, setGreenScoreProfile] = useState<GreenScoreProfile | null>(null);
  const [badges, setBadges] = useState<GreenScoreBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'activities' | 'badges' | 'tips'>('overview');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprintData>({
    transport: 0,
    accommodation: 0,
    food: 0,
    activities: 0,
    total: 0
  });

  const ecoTips: EcoTip[] = [
    {
      id: '1',
      title: 'Use Public Transport',
      description: 'Choose buses, trains, or metro instead of private vehicles',
      category: 'transport',
      impact: 'high',
      points: 15,
      icon: TreePine
    },
    {
      id: '2',
      title: 'Stay in Eco-Friendly Hotels',
      description: 'Choose accommodations with green certifications',
      category: 'accommodation',
      impact: 'high',
      points: 25,
      icon: Leaf
    },
    {
      id: '3',
      title: 'Eat Local & Organic',
      description: 'Support local farmers and choose organic food',
      category: 'food',
      impact: 'medium',
      points: 20,
      icon: Recycle
    },
    {
      id: '4',
      title: 'Reduce Water Usage',
      description: 'Take shorter showers and reuse towels',
      category: 'general',
      impact: 'medium',
      points: 10,
      icon: Droplets
    },
    {
      id: '5',
      title: 'Use Renewable Energy',
      description: 'Choose accommodations powered by solar or wind',
      category: 'accommodation',
      impact: 'high',
      points: 30,
      icon: Sun
    },
    {
      id: '6',
      title: 'Walk or Cycle',
      description: 'Explore destinations on foot or by bicycle',
      category: 'transport',
      impact: 'high',
      points: 20,
      icon: Wind
    }
  ];

  useEffect(() => {
    if (user) {
      loadGreenScoreData();
    }
  }, [user]);

  const loadGreenScoreData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const profile = await greenScoreService.getUserGreenScore(user.uid);
      setGreenScoreProfile(profile);
      
      if (profile) {
        setCarbonFootprint({
          transport: profile.activities
            .filter(a => a.type === 'transport')
            .reduce((sum, a) => sum + (a.carbonSaved || 0), 0),
          accommodation: profile.activities
            .filter(a => a.type === 'accommodation')
            .reduce((sum, a) => sum + (a.carbonSaved || 0), 0),
          food: profile.activities
            .filter(a => a.type === 'food')
            .reduce((sum, a) => sum + (a.carbonSaved || 0), 0),
          activities: profile.activities
            .filter(a => a.type === 'activity')
            .reduce((sum, a) => sum + (a.carbonSaved || 0), 0),
          total: profile.carbonFootprint
        });
      }
      
      const allBadges = greenScoreService.getBadges();
      setBadges(allBadges);
    } catch (error) {
      console.error('Failed to load green score data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async (activityData: Omit<GreenScoreActivity, 'id' | 'timestamp'>) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const updatedProfile = await greenScoreService.addActivity(user.uid, activityData);
      if (updatedProfile) {
        setGreenScoreProfile(updatedProfile);
        setShowAddActivity(false);
      }
    } catch (error) {
      console.error('Failed to add activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <CheckCircle size={16} className="text-green-600" />;
      case 'medium': return <AlertCircle size={16} className="text-yellow-600" />;
      case 'low': return <Info size={16} className="text-blue-600" />;
      default: return <Info size={16} className="text-gray-600" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'activities', label: 'Activities', icon: TrendingUp },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'tips', label: 'Eco Tips', icon: Leaf }
  ];

  if (loading && !greenScoreProfile) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
          {t('sustainability.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Track your eco-friendly travel choices and earn Green Score points
        </p>
      </motion.div>

      {/* Green Score Overview */}
      {greenScoreProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Green Score</h2>
              <p className="text-green-100">Level {greenScoreProfile.level} • {greenScoreProfile.badge}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{greenScoreProfile.totalScore}</div>
              <div className="text-green-100">Total Points</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <TreePine size={24} />
                <span className="font-semibold">Carbon Saved</span>
              </div>
              <div className="text-2xl font-bold">{greenScoreProfile.carbonFootprint.toFixed(1)} kg</div>
              <div className="text-green-100 text-sm">CO2 emissions prevented</div>
            </div>

            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Award size={24} />
                <span className="font-semibold">Achievements</span>
              </div>
              <div className="text-2xl font-bold">{greenScoreProfile.achievements.length}</div>
              <div className="text-green-100 text-sm">Badges earned</div>
            </div>

            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp size={24} />
                <span className="font-semibold">Activities</span>
              </div>
              <div className="text-2xl font-bold">{greenScoreProfile.activities.length}</div>
              <div className="text-green-100 text-sm">Eco-friendly actions</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-center gap-2"
      >
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <IconComponent size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={selectedTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carbon Footprint Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Carbon Footprint Breakdown
              </h3>
              <div className="space-y-4">
                {[
                  { category: 'Transport', value: carbonFootprint.transport, color: 'bg-blue-500' },
                  { category: 'Accommodation', value: carbonFootprint.accommodation, color: 'bg-green-500' },
                  { category: 'Food', value: carbonFootprint.food, color: 'bg-yellow-500' },
                  { category: 'Activities', value: carbonFootprint.activities, color: 'bg-purple-500' }
                ].map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                      <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {item.value.toFixed(1)} kg
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Total Saved</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {carbonFootprint.total.toFixed(1)} kg CO2
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Recent Activities
                </h3>
                <button
                  onClick={() => setShowAddActivity(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Activity</span>
                </button>
              </div>
              <div className="space-y-3">
                {greenScoreProfile?.activities.slice(-5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        +{activity.points}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'tips' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ecoTips.map((tip) => {
              const IconComponent = tip.icon;
              return (
                <div
                  key={tip.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <IconComponent size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {tip.title}
                        </h3>
                        {getImpactIcon(tip.impact)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {tip.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          {tip.category}
                        </span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          +{tip.points} points
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SustainabilityModule;