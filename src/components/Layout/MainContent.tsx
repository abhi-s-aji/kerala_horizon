import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Import feature components (we'll create these next)
import TransportModule from '../Features/Transport/TransportModule';
import StayModule from '../Features/Stay/StayModule';
import FoodModule from '../Features/Food/FoodModule';
import CultureModule from '../Features/Culture/CultureModule';
import SustainabilityModule from '../Features/Sustainability/SustainabilityModule';
import CommunityModule from '../Features/Community/CommunityModule';
import AIToolsModule from '../Features/AITools/AIToolsModule';
import TripPlannerModule from '../Features/TripPlanner/TripPlannerModule';
import WalletModule from '../Features/Wallet/WalletModule';
import SOSModule from '../Features/SOS/SOSModule';
import ShoppingModule from '../Features/Shopping/ShoppingModule';
import SettingsModule from '../Features/Settings/SettingsModule';

interface MainContentProps {
  activeSection: string;
}

const MainContent: React.FC<MainContentProps> = ({ activeSection }) => {

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  const pageTransition = {
    type: 'tween' as const,
    ease: 'anticipate' as const,
    duration: 0.3
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'transport':
        return <TransportModule />;
      case 'stay':
        return <StayModule />;
      case 'food':
        return <FoodModule />;
      case 'culture':
        return <CultureModule />;
      case 'sustainability':
        return <SustainabilityModule />;
      case 'community':
        return <CommunityModule />;
      case 'aiTools':
        return <AIToolsModule />;
      case 'tripPlanner':
        return <TripPlannerModule />;
      case 'wallet':
        return <WalletModule />;
      case 'sos':
        return <SOSModule />;
      case 'shopping':
        return <ShoppingModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <TransportModule />;
    }
  };

  return (
    <main id="main-content" className="lg:ml-80 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-4 lg:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="max-w-7xl mx-auto"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
};

export default MainContent;
