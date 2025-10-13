import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  Home,
  Utensils,
  Heart,
  Leaf,
  Users,
  Bot,
  MapPin,
  Shield,
  ShoppingBag,
  Settings,
  Wallet,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = [
    { id: 'transport', icon: Bus, label: t('navigation.transport') },
    { id: 'stay', icon: Home, label: t('navigation.stay') },
    { id: 'food', icon: Utensils, label: t('navigation.food') },
    { id: 'culture', icon: Heart, label: t('navigation.culture') },
    { id: 'sustainability', icon: Leaf, label: t('navigation.sustainability') },
    { id: 'community', icon: Users, label: t('navigation.community') },
    { id: 'aiTools', icon: Bot, label: t('navigation.aiTools') },
    { id: 'tripPlanner', icon: MapPin, label: t('navigation.tripPlanner') },
    { id: 'wallet', icon: Wallet, label: t('navigation.wallet') },
    { id: 'sos', icon: Shield, label: t('navigation.sos') },
    { id: 'shopping', icon: ShoppingBag, label: t('navigation.shopping') },
    { id: 'settings', icon: Settings, label: t('navigation.settings') },
  ];

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' }
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        className={`
          fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    variants={contentVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <img 
                        src="/logo.svg" 
                        alt="Kerala Horizon Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h1 className="font-display font-bold text-lg text-gray-900 dark:text-white">
                        {t('app.title')}
                      </h1>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('app.subtitle')}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full sidebar-item group relative
                    ${isActive ? 'active' : ''}
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent 
                    size={20} 
                    className={`flex-shrink-0 ${
                      isActive 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    }`} 
                  />
                  
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        variants={contentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="ml-3 text-sm font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-l-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="text-center"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Made with ❤️ for Kerala
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
