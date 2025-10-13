import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Unlock,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Fingerprint,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Settings,
  Key,
  Database,
  Smartphone
} from 'lucide-react';

interface SecuritySettingsProps {
  isBiometricEnabled: boolean;
  onEnableBiometric: () => void;
  onDisableBiometric: () => void;
  isCloudSyncEnabled: boolean;
  onToggleCloudSync: () => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  isBiometricEnabled,
  onEnableBiometric,
  onDisableBiometric,
  isCloudSyncEnabled,
  onToggleCloudSync
}) => {
  const { t } = useTranslation();
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'none'>('none');

  const handleBiometricToggle = () => {
    if (isBiometricEnabled) {
      onDisableBiometric();
    } else {
      setShowBiometricSetup(true);
    }
  };

  const handleBiometricSetup = () => {
    // Simulate biometric setup
    setTimeout(() => {
      onEnableBiometric();
      setShowBiometricSetup(false);
    }, 2000);
  };

  const securityFeatures = [
    {
      id: 'biometric',
      title: t('wallet.security.biometricLock'),
      description: t('wallet.security.biometricDescription'),
      icon: Fingerprint,
      enabled: isBiometricEnabled,
      onToggle: handleBiometricToggle,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-300'
    },
    {
      id: 'encryption',
      title: t('wallet.security.encryptedStorage'),
      description: t('wallet.security.encryptionDescription'),
      icon: Database,
      enabled: true,
      onToggle: null,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300'
    },
    {
      id: 'cloud',
      title: t('wallet.security.cloudSync'),
      description: t('wallet.security.cloudDescription'),
      icon: Cloud,
      enabled: isCloudSyncEnabled,
      onToggle: onToggleCloudSync,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300'
    },
    {
      id: 'offline',
      title: t('wallet.security.offlineAccess'),
      description: t('wallet.security.offlineDescription'),
      icon: WifiOff,
      enabled: true,
      onToggle: null,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
          <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('wallet.security.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('wallet.security.subtitle')}
        </p>
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {securityFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <motion.div
              key={feature.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${feature.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
                
                {feature.onToggle ? (
                  <button
                    onClick={feature.onToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feature.enabled
                        ? 'bg-primary-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feature.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                ) : (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">
                      {t('wallet.security.active')}
                    </span>
                  </div>
                )}
              </div>

              {feature.id === 'biometric' && feature.enabled && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {t('wallet.security.biometricActive')}
                    </span>
                  </div>
                </div>
              )}

              {feature.id === 'encryption' && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('wallet.security.encryptionLevel')}:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      AES-256
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('wallet.security.keyDerivation')}:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      PBKDF2
                    </span>
                  </div>
                </div>
              )}

              {feature.id === 'cloud' && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t('wallet.security.syncStatus')}:
                    </span>
                    <span className={`font-medium ${
                      feature.enabled
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {feature.enabled ? t('wallet.security.synced') : t('wallet.security.notSynced')}
                    </span>
                  </div>
                  {feature.enabled && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('wallet.security.lastSync')}:
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {new Date().toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {feature.id === 'offline' && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <WifiOff className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">
                      {t('wallet.security.offlineAvailable')}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {t('wallet.security.tips.title')}
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• {t('wallet.security.tips.biometric')}</li>
              <li>• {t('wallet.security.tips.encryption')}</li>
              <li>• {t('wallet.security.tips.backup')}</li>
              <li>• {t('wallet.security.tips.updates')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Biometric Setup Modal */}
      {showBiometricSetup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
                <Fingerprint className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('wallet.security.setupBiometric')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('wallet.security.setupBiometricDescription')}
              </p>
              
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setBiometricType('fingerprint')}
                  className={`w-full p-3 rounded-lg border-2 transition-colors ${
                    biometricType === 'fingerprint'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Fingerprint className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">
                      {t('wallet.security.fingerprint')}
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => setBiometricType('face')}
                  className={`w-full p-3 rounded-lg border-2 transition-colors ${
                    biometricType === 'face'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">
                      {t('wallet.security.faceId')}
                    </span>
                  </div>
                </button>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBiometricSetup(false)}
                  className="btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleBiometricSetup}
                  disabled={biometricType === 'none'}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('wallet.security.setup')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SecuritySettings;









