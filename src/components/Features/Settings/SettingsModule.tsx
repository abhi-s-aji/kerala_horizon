import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Palette, Globe, Eye, Bell, Shield, Info } from 'lucide-react';

const SettingsModule: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
          {t('settings.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Customize your Kerala Horizon experience
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {[
          { icon: Palette, title: 'Theme', desc: 'Dark and light mode settings' },
          { icon: Globe, title: 'Language', desc: 'Choose your preferred language' },
          { icon: Eye, title: 'Accessibility', desc: 'High contrast and large text' },
          { icon: Bell, title: 'Notifications', desc: 'Manage your alerts' },
          { icon: Shield, title: 'Privacy', desc: 'Data and privacy settings' },
          { icon: Info, title: 'About', desc: 'App information and support' }
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
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <IconComponent className="text-gray-600 dark:text-gray-400" size={24} />
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

export default SettingsModule;
