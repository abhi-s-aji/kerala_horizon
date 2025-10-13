import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, 
  Volume2, 
  Contrast, 
  Keyboard
} from 'lucide-react';

interface AccessibilityToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilityTools: React.FC<AccessibilityToolsProps> = ({ isOpen, onClose }) => {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}px`;
  };

  const handleHighContrast = () => {
    setHighContrast(!highContrast);
    document.body.classList.toggle('high-contrast');
  };

  const handleScreenReader = () => {
    setScreenReader(!screenReader);
    // This would integrate with actual screen reader APIs
    console.log('Screen reader mode:', !screenReader);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 border-l border-gray-200 dark:border-gray-700"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Accessibility Tools
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Font Size */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Type size={20} className="text-primary-600" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Font Size
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFontSizeChange(14)}
                    className={`px-3 py-1 rounded text-sm ${
                      fontSize === 14 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Small
                  </button>
                  <button
                    onClick={() => handleFontSizeChange(16)}
                    className={`px-3 py-1 rounded text-sm ${
                      fontSize === 16 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => handleFontSizeChange(18)}
                    className={`px-3 py-1 rounded text-sm ${
                      fontSize === 18 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Large
                  </button>
                </div>
              </div>

              {/* High Contrast */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Contrast size={20} className="text-primary-600" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    High Contrast
                  </h3>
                </div>
                <button
                  onClick={handleHighContrast}
                  className={`w-full p-3 rounded-lg border transition-colors ${
                    highContrast
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {highContrast ? 'Disable High Contrast' : 'Enable High Contrast'}
                </button>
              </div>

              {/* Screen Reader */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Volume2 size={20} className="text-primary-600" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Screen Reader
                  </h3>
                </div>
                <button
                  onClick={handleScreenReader}
                  className={`w-full p-3 rounded-lg border transition-colors ${
                    screenReader
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {screenReader ? 'Disable Screen Reader' : 'Enable Screen Reader'}
                </button>
              </div>

              {/* Keyboard Navigation */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Keyboard size={20} className="text-primary-600" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Keyboard Navigation
                  </h3>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>• Use Tab to navigate</p>
                  <p>• Use Enter/Space to activate</p>
                  <p>• Use Arrow keys for menus</p>
                  <p>• Use Escape to close dialogs</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AccessibilityTools;
