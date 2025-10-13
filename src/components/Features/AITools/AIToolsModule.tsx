import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Brain,
  MessageCircle,
  Sparkles,
  Languages,
  Luggage,
  Shield,
  Calculator,
  Send,
  Loader
} from 'lucide-react';
import { geminiAIService } from '../../../services/geminiAI';
import backendAPI from '../../../services/backendApi';
import InteractiveTile from '../../Common/InteractiveTile';

const AIToolsModule: React.FC = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const aiTools = [
    {
      id: 'concierge',
      title: 'Intelligent Travel Concierge',
      description: 'Advanced AI-powered travel assistance with personalized recommendations and 24/7 support',
      icon: MessageCircle,
      color: 'bg-blue-600',
      features: ['24/7 intelligent assistance', 'Local expert insights', 'Personalized itinerary recommendations', 'Real-time travel advice']
    },
    {
      id: 'surprise',
      title: 'Adventure Discovery Engine',
      description: 'AI-curated unique experiences and hidden gems tailored to your preferences',
      icon: Sparkles,
      color: 'bg-purple-600',
      features: ['Curated adventure recommendations', 'Exclusive local experiences', 'Budget-optimized suggestions', 'Off-the-beaten-path discoveries']
    },
    {
      id: 'translator',
      title: 'Multilingual Communication Assistant',
      description: 'Advanced language translation with cultural context and pronunciation guidance',
      icon: Languages,
      color: 'bg-green-600',
      features: ['Malayalam ↔ English translation', 'Malayalam ↔ Hindi translation', 'Cultural context integration', 'Pronunciation assistance']
    },
    {
      id: 'packing',
      title: 'Smart Packing Optimizer',
      description: 'AI-driven packing recommendations based on weather, activities, and travel duration',
      icon: Luggage,
      color: 'bg-orange-600',
      features: ['Weather-adaptive packing lists', 'Activity-specific recommendations', 'Kerala travel essentials', 'Optimized luggage management']
    },
    {
      id: 'safety',
      title: 'Safety & Security Monitor',
      description: 'Comprehensive safety monitoring with real-time alerts and emergency assistance',
      icon: Shield,
      color: 'bg-red-600',
      features: ['Real-time weather alerts', 'Traffic condition updates', 'Health advisory notifications', 'Emergency contact integration']
    },
    {
      id: 'budget',
      title: 'Financial Optimization Engine',
      description: 'Intelligent expense tracking and budget optimization for your Kerala journey',
      icon: Calculator,
      color: 'bg-indigo-600',
      features: ['Automated budget tracking', 'Smart expense categorization', 'Cost optimization recommendations', 'Multi-currency conversion']
    }
  ];

  const [toolResults, setToolResults] = useState<Record<string, any>>({});

  const handleToolClick = async (toolId: string) => {
    setActiveTool(activeTool === toolId ? null : toolId);
    
    if (activeTool !== toolId) {
      setLoading(true);
      try {
        switch (toolId) {
          case 'concierge':
            const conciergeData = await backendAPI.getAIRecommendations({
              location: 'Kochi, Kerala',
              interests: ['culture', 'nature', 'food'],
              budget: 'medium',
              duration: '3 days',
              groupSize: 2
            });
            setToolResults(prev => ({ ...prev, concierge: conciergeData }));
            break;
          case 'surprise':
            const surpriseData = await backendAPI.getSurpriseItinerary({
              location: 'Kochi, Kerala',
              mood: 'adventure',
              duration: '1 day',
              budget: 'medium'
            });
            setToolResults(prev => ({ ...prev, surprise: surpriseData }));
            break;
          case 'translate':
            const translation = await backendAPI.translateText({
              text: 'Hello, how are you?',
              fromLang: 'en',
              toLang: 'ml'
            });
            setToolResults(prev => ({ ...prev, translate: translation }));
            break;
          case 'packing':
            const packing = await backendAPI.getPackingList({
              destination: 'Kerala',
              duration: '1 week',
              season: 'monsoon',
              activities: ['trekking', 'beach', 'temple'],
              preferences: {}
            });
            setToolResults(prev => ({ ...prev, packing }));
            break;
          case 'safety':
            const safetyData = await backendAPI.getSafetyAlerts(10.5200, 76.3000, 10000);
            setToolResults(prev => ({ ...prev, safety: safetyData }));
            break;
          case 'budget':
            const budgetData = await backendAPI.optimizeExpenses({
              totalBudget: 50000,
              duration: '7 days',
              preferences: { accommodation: 'mid-range', transport: 'public', food: 'local' }
            });
            setToolResults(prev => ({ ...prev, budget: budgetData }));
            break;
        }
      } catch (error) {
        console.error('Error using AI tool:', error);
        setToolResults(prev => ({ ...prev, [toolId]: 'Error: Unable to fetch data. Please try again.' }));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setLoading(true);

    try {
      const response = await geminiAIService.getTravelAdvice(currentMessage);
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderToolContent = (toolId: string) => {
    switch (toolId) {
      case 'concierge':
        return (
          <div className="space-y-4">
            <div className="h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              {chatMessages.map((message) => (
                <div key={message.id} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Loader className="animate-spin" size={16} />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              )}
            </div>
            <form onSubmit={handleChatSubmit} className="flex space-x-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask me anything about Kerala travel..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !currentMessage.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        );

      case 'surprise':
        const adventure = toolResults.surprise;
        return adventure ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">{adventure.title}</h3>
              <p className="text-purple-100 mb-4">{adventure.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Duration:</span> {adventure.duration}
                </div>
                <div>
                  <span className="font-semibold">Budget:</span> {adventure.budget}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Activities</h4>
                <ul className="space-y-1">
                  {adventure.activities.map((activity: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tips</h4>
                <ul className="space-y-1">
                  {adventure.tips.map((tip: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles size={48} className="mx-auto text-purple-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Click to generate a surprise adventure!</p>
          </div>
        );

      case 'safety':
        const safety = toolResults.safety;
        return safety ? (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Safety Information</h3>
              <p className="text-red-700 dark:text-red-300 text-sm">{safety}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Click to get safety information!</p>
          </div>
        );

      case 'budget':
        const budget = toolResults.budget;
        return budget ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Budget Optimization Tips</h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">{budget}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calculator size={48} className="mx-auto text-yellow-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Click to get budget optimization tips!</p>
          </div>
        );

      case 'packing':
        const packing = toolResults.packing;
        return packing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(packing).map(([category, items]: [string, any]) => (
                <div key={category} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                    {category}
                  </h4>
                  <ul className="space-y-1">
                    {Array.isArray(items) ? items.map((item: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        {item}
                      </li>
                    )) : (
                      <li className="text-sm text-gray-600 dark:text-gray-400">{items}</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Luggage size={48} className="mx-auto text-orange-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Click to get packing list!</p>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Brain size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Tool content coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Professional Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-display font-bold text-gray-900 dark:text-white mb-6">
            AI-Powered Intelligence Platform
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            Advanced artificial intelligence solutions designed to enhance your Kerala travel experience with personalized recommendations, real-time assistance, and intelligent automation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enterprise-Grade Security</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your data is protected with industry-standard encryption and privacy controls.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">24/7 Intelligent Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Round-the-clock AI assistance powered by advanced machine learning algorithms.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Seamless Integration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Works seamlessly across all devices with real-time synchronization.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Tools Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {aiTools.map((tool) => {
          const IconComponent = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <InteractiveTile
              key={tool.id}
              id={tool.id}
              title={tool.title}
              description={tool.description}
              icon={IconComponent}
              color={tool.color}
              features={tool.features}
              onClick={() => handleToolClick(tool.id)}
              expandedContent={isActive ? renderToolContent(tool.id) : undefined}
              loading={loading && isActive}
              quickActionLabel="Use Tool"
            />
          );
        })}
      </motion.div>
    </div>
  );
};

export default AIToolsModule;
