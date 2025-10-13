import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface QuickAction {
  label: string;
  action: string;
}

interface InteractiveTileProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  features?: string[];
  onClick?: () => void;
  onQuickAction?: (action: string) => void;
  quickActions?: QuickAction[];
  quickActionLabel?: string;
  expandedContent?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  badge?: string;
  rating?: number;
  price?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'coming-soon';
  className?: string;
}

const InteractiveTile: React.FC<InteractiveTileProps> = ({
  id,
  title,
  description,
  icon: IconComponent,
  color,
  features = [],
  onClick,
  onQuickAction,
  quickActions = [],
  quickActionLabel = 'Learn More',
  expandedContent,
  loading = false,
  disabled = false,
  badge,
  rating,
  price,
  location,
  status = 'active',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (disabled || status === 'coming-soon') return;
    if (onClick) {
      onClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'hover:shadow-lg';
      case 'inactive': return 'opacity-60 cursor-not-allowed';
      case 'coming-soon': return 'opacity-75 cursor-not-allowed';
      default: return '';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'coming-soon': return 'Coming Soon';
      case 'inactive': return 'Unavailable';
      default: return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!disabled && status === 'active' ? { scale: 1.02 } : {}}
      whileTap={!disabled && status === 'active' ? { scale: 0.98 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        card cursor-pointer transition-all duration-300 group relative overflow-hidden
        ${getStatusColor()}
        ${isExpanded ? 'ring-2 ring-primary-500 shadow-lg' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Status Badge */}
      {getStatusBadge() && (
        <div className="absolute top-4 right-4 z-10">
          <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
            {getStatusBadge()}
          </span>
        </div>
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute top-4 left-4 z-10">
          <span className="px-2 py-1 bg-primary-500 text-white text-xs rounded-full">
            {badge}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-start space-x-4">
        <motion.div
          className={`p-3 rounded-lg ${color} text-white relative overflow-hidden`}
          animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <IconComponent size={24} />
          {/* Hover effect overlay */}
          <motion.div
            className="absolute inset-0 bg-white opacity-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {title}
            </h3>
            {rating && (
              <div className="flex items-center space-x-1 ml-2">
                <span className="text-yellow-500">★</span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {rating}
                </span>
              </div>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
            {description}
          </p>

          {/* Additional Info */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
            {location && (
              <span className="flex items-center space-x-1">
                <span>📍</span>
                <span>{location}</span>
              </span>
            )}
            {price && (
              <span className="flex items-center space-x-1">
                <span>💰</span>
                <span>{price}</span>
              </span>
            )}
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                >
                  {feature}
                </span>
              ))}
              {features.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  +{features.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Quick Action Buttons */}
          {status === 'active' && (
            <div className="space-y-2">
              {quickActions.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={(e) => handleQuickAction(e, action.action)}
                      className="w-full btn-primary text-sm flex items-center justify-center space-x-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>{action.label}</span>
                          <ExternalLink size={14} />
                        </>
                      )}
                    </button>
                  ))}
                </div>
              ) : onQuickAction ? (
                <button
                  onClick={(e) => handleQuickAction(e, 'default')}
                  className="w-full btn-primary text-sm flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>{quickActionLabel}</span>
                      <ExternalLink size={14} />
                    </>
                  )}
                </button>
              ) : null}
            </div>
          )}

          {/* Expand/Collapse Button */}
          {expandedContent && status === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="w-full mt-2 flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <span className="text-sm">
                {isExpanded ? 'Show Less' : 'Show More'}
              </span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && expandedContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            {expandedContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Loading...
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InteractiveTile;
