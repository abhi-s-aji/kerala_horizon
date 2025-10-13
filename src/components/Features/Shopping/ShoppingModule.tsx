import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShoppingBag, Palette, Coffee, Gift, CreditCard, Tag } from 'lucide-react';

const ShoppingModule: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
          {t('shopping.title')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover local artisans, spices, and authentic Kerala products
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {[
          { icon: Palette, title: 'Handicrafts', desc: 'Traditional artisan products' },
          { icon: Coffee, title: 'Spice Market', desc: 'Authentic Kerala spices' },
          { icon: Gift, title: 'Souvenirs', desc: 'Memorable Kerala keepsakes' },
          { icon: CreditCard, title: 'Digital Wallet', desc: 'UPI and card payments' },
          { icon: Tag, title: 'Tax Free Shopping', desc: 'Special rates for tourists' },
          { icon: ShoppingBag, title: 'Local Marketplace', desc: 'Support local businesses' }
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
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <IconComponent className="text-orange-600 dark:text-orange-400" size={24} />
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

export default ShoppingModule;
