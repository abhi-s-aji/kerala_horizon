import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Camera, Trophy, BookOpen } from 'lucide-react';
import backendAPI from '../../../services/backendApi';

const CommunityModule: React.FC = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityPosts();
  }, []);

  const loadCommunityPosts = async () => {
    try {
      setLoading(true);
      // Since we don't have a specific community posts endpoint in backendAPI,
      // we'll use mock data for now but structure it to be easily replaceable
      const mockPosts = [
        {
          id: 'post_001',
          author: 'Traveler123',
          title: 'Amazing Backwater Experience in Alleppey',
          content: 'Just spent an incredible day on the backwaters...',
          category: 'travel_tips',
          likes: 45,
          comments: 12,
          images: ['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400'],
          location: 'Alleppey',
          createdAt: '2024-01-10T14:30:00Z'
        },
        {
          id: 'post_002',
          author: 'FoodieExplorer',
          title: 'Best Street Food in Kochi',
          content: 'Found some amazing local delicacies...',
          category: 'food',
          likes: 32,
          comments: 8,
          images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'],
          location: 'Kochi',
          createdAt: '2024-01-09T16:45:00Z'
        }
      ];
      setPosts(mockPosts);
    } catch (error) {
      console.error('Failed to load community posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
          {t('community.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Connect with fellow travelers and share your Kerala stories
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {[
          { icon: BookOpen, title: 'Travel Blog', desc: 'Share your Kerala experiences' },
          { icon: Users, title: 'Local Voices', desc: 'Connect with local communities' },
          { icon: MessageCircle, title: 'Ask a Local', desc: 'Get real-time local help' },
          { icon: Camera, title: 'Photo Gallery', desc: 'Share your Kerala moments' },
          { icon: Users, title: 'Traveler Feed', desc: 'Follow other travelers' },
          { icon: Trophy, title: 'Photo Contests', desc: 'Participate in challenges' }
        ].map((item, index) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <IconComponent className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {item.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default CommunityModule;
