import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { installPWA, canInstallPWA, isOnline } from '../../utils/pwa';

interface PWAInstallButtonProps {
  className?: string;
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '' }) => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);

  useEffect(() => {
    // Check if install is available
    setShowInstallPrompt(canInstallPWA());

    // Listen for PWA events
    const handleInstallAvailable = () => setShowInstallPrompt(true);
    const handleInstallCompleted = () => setShowInstallPrompt(false);
    const handleUpdateAvailable = () => setShowUpdatePrompt(true);
    const handleNotification = (event: CustomEvent) => {
      setNotification(event.detail);
      setTimeout(() => setNotification(null), 5000);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-completed', handleInstallCompleted);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    window.addEventListener('pwa-notification', handleNotification as EventListener);

    // Check online status
    const updateOnlineStatus = () => {
      setShowOfflineNotice(!isOnline());
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-completed', handleInstallCompleted);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      window.removeEventListener('pwa-notification', handleNotification as EventListener);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installPWA();
      if (success) {
        setShowInstallPrompt(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = () => {
    window.location.reload();
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 space-y-2 ${className}`}>
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`
              flex items-center justify-between p-4 rounded-lg shadow-lg max-w-sm
              ${notification.type === 'success' ? 'bg-green-500 text-white' : ''}
              ${notification.type === 'warning' ? 'bg-yellow-500 text-white' : ''}
              ${notification.type === 'error' ? 'bg-red-500 text-white' : ''}
            `}
          >
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={dismissNotification}
              className="ml-2 p-1 hover:bg-black/20 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Notice */}
      <AnimatePresence>
        {showOfflineNotice && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="flex items-center p-3 bg-orange-500 text-white rounded-lg shadow-lg"
          >
            <WifiOff size={20} className="mr-2" />
            <span className="text-sm font-medium">You're offline</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Available Prompt */}
      <AnimatePresence>
        {showUpdatePrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm"
          >
            <div className="flex items-center mb-2">
              <RefreshCw size={20} className="mr-2" />
              <span className="font-medium">Update Available</span>
            </div>
            <p className="text-sm mb-3">A new version of Kerala Horizon is available.</p>
            <div className="flex space-x-2">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-white text-blue-500 px-3 py-2 rounded font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={() => setShowUpdatePrompt(false)}
                className="px-3 py-2 border border-white/30 rounded text-sm hover:bg-white/10 transition-colors"
              >
                Later
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install App Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="bg-primary-600 text-white p-4 rounded-lg shadow-lg max-w-sm"
          >
            <div className="flex items-center mb-2">
              <Download size={20} className="mr-2" />
              <span className="font-medium">Install Kerala Horizon</span>
            </div>
            <p className="text-sm mb-3">
              Install our app for a better experience with offline access and quick launch.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-white text-primary-600 px-3 py-2 rounded font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Installing...
                  </>
                ) : (
                  'Install App'
                )}
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="px-3 py-2 border border-white/30 rounded text-sm hover:bg-white/10 transition-colors"
              >
                Not Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online Status Indicator */}
      {isOnline() && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-full shadow-lg"
        >
          <Wifi size={20} />
        </motion.div>
      )}
    </div>
  );
};

export default PWAInstallButton;























