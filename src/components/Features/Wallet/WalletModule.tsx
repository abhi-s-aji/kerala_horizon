import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Shield,
  Cloud,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Scan,
  Upload,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Share2,
  Edit3,
  Trash2,
  Download,
  Tag,
  Lock,
  Unlock,
  Settings,
  CreditCard,
  Heart,
  Syringe,
  File,
  Bell,
  BellOff,
  Smartphone,
  Mail,
  Bluetooth,
  MoreVertical
} from 'lucide-react';
import DocumentScanner from './DocumentScanner';
import DocumentUpload from './DocumentUpload';
import DocumentGrid from './DocumentGrid';
import DocumentModal from './DocumentModal';
import SecuritySettings from './SecuritySettings';
import { useDocumentManager } from '../../../hooks/useDocumentManager';
import { useBiometricAuth } from '../../../hooks/useBiometricAuth';
import { useNotificationService } from '../../../hooks/useNotificationService';
import backendAPI from '../../../services/backendApi';

const WalletModule: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'documents' | 'security' | 'settings'>('documents');
  const [showScanner, setShowScanner] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAddDocument, setShowAddDocument] = useState(false);

  const {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    syncWithCloud,
    isCloudSyncEnabled
  } = useDocumentManager();

  const { isBiometricEnabled, enableBiometric, disableBiometric, authenticate } = useBiometricAuth();
  const { requestPermission, scheduleNotification } = useNotificationService();

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const handleScanComplete = async (scannedData: any) => {
    try {
      await addDocument(scannedData);
      setShowScanner(false);
    } catch (error) {
      console.error('Error adding scanned document:', error);
    }
  };

  const handleUploadComplete = async (uploadedData: any) => {
    try {
      await addDocument(uploadedData);
      setShowUpload(false);
    } catch (error) {
      console.error('Error adding uploaded document:', error);
    }
  };

  const handleLockToggle = async () => {
    if (isLocked) {
      const authenticated = await authenticate();
      if (authenticated) {
        setIsLocked(false);
      }
    } else {
      setIsLocked(true);
    }
  };

  // Enhanced document categories for travel wallet
  const documentCategories = [
    { 
      id: 'passport', 
      label: t('wallet.documentTypes.passport'), 
      icon: FileText, 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      description: t('wallet.categories.passportDesc'),
      lastUpdated: new Date().toISOString(),
      count: documents.filter(doc => doc.type.toLowerCase() === 'passport').length
    },
    { 
      id: 'visa', 
      label: t('wallet.documentTypes.visa'), 
      icon: CreditCard, 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      description: t('wallet.categories.visaDesc'),
      lastUpdated: new Date().toISOString(),
      count: documents.filter(doc => doc.type.toLowerCase() === 'visa').length
    },
    { 
      id: 'insurance', 
      label: t('wallet.documentTypes.insurance'), 
      icon: Shield, 
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      description: t('wallet.categories.insuranceDesc'),
      lastUpdated: new Date().toISOString(),
      count: documents.filter(doc => doc.type.toLowerCase() === 'insurance').length
    },
    { 
      id: 'vaccination', 
      label: t('wallet.documentTypes.vaccination'), 
      icon: Syringe, 
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      description: t('wallet.categories.vaccinationDesc'),
      lastUpdated: new Date().toISOString(),
      count: documents.filter(doc => doc.type.toLowerCase() === 'vaccination').length
    },
    { 
      id: 'other', 
      label: t('wallet.documentTypes.other'), 
      icon: File, 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      description: t('wallet.categories.otherDesc'),
      lastUpdated: new Date().toISOString(),
      count: documents.filter(doc => doc.type.toLowerCase() === 'other').length
    }
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !filterTag || doc.tags.includes(filterTag);
    const matchesCategory = !filterCategory || doc.type.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesTag && matchesCategory;
  });

  // Group documents by category for display
  const documentsByCategory = documentCategories.map(category => ({
    ...category,
    documents: filteredDocuments.filter(doc => doc.type.toLowerCase() === category.id),
    count: filteredDocuments.filter(doc => doc.type.toLowerCase() === category.id).length
  }));

  // Get documents with expiry alerts
  const getExpiryAlerts = () => {
    const today = new Date();
    return documents.filter(doc => {
      if (!doc.expiryDate) return false;
      const expiry = new Date(doc.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays >= 0;
    });
  };

  const expiryAlerts = getExpiryAlerts();

  const tabs = [
    { id: 'documents', label: t('wallet.documents'), icon: FileText },
    { id: 'security', label: t('wallet.security'), icon: Shield },
    { id: 'settings', label: t('wallet.settings'), icon: Settings }
  ];

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
        >
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('wallet.security.locked')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('wallet.security.unlockMessage')}
          </p>
          <button
            onClick={handleLockToggle}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Unlock size={20} />
            <span>{t('wallet.security.unlock')}</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                <Wallet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('wallet.title')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('wallet.subtitle')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Online/Offline Status */}
              <div className="flex items-center space-x-2 text-sm">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                  {isOnline ? t('wallet.online') : t('wallet.offline')}
                </span>
              </div>

              {/* Security Toggle */}
              <button
                onClick={handleLockToggle}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t('wallet.security.lock')}
              >
                <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <IconComponent size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Expiry Alerts */}
              {expiryAlerts.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                      {t('wallet.expiryAlerts.title')}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {expiryAlerts.map((doc) => {
                      const today = new Date();
                      const expiry = new Date(doc.expiryDate!);
                      const diffTime = expiry.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={doc.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {diffDays === 0 ? t('wallet.expiryAlerts.expiresToday') :
                                 diffDays === 1 ? t('wallet.expiryAlerts.expiresTomorrow') :
                                 `${t('wallet.expiryAlerts.expiresIn')} ${diffDays} ${t('wallet.expiryAlerts.days')}`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDocumentSelect(doc)}
                            className="btn-primary text-sm"
                          >
                            {t('wallet.actions.view')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Enhanced Dashboard Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {documentCategories.map((category) => {
                  const categoryDocs = documents.filter(doc => doc.type.toLowerCase() === category.id);
                  const expiringDocs = categoryDocs.filter(doc => {
                    if (!doc.expiryDate) return false;
                    const expiry = new Date(doc.expiryDate);
                    const today = new Date();
                    const diffTime = expiry.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 30 && diffDays >= 0;
                  });

                  return (
                    <motion.div
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-all duration-200"
                      onClick={() => setFilterCategory(category.id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.color}`}>
                          <category.icon className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {category.count}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {category.count === 1 ? t('wallet.document') : t('wallet.documents')}
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {category.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {category.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('wallet.lastUpdated')}: {new Date(category.lastUpdated).toLocaleDateString()}
                        </div>
                        {expiringDocs.length > 0 && (
                          <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-medium">{expiringDocs.length}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Document Categories */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('wallet.documentCategories')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentsByCategory.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <motion.div
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFilterCategory(filterCategory === category.id ? null : category.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          filterCategory === category.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 rounded-lg ${category.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {category.label}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {category.count} {t('wallet.documents')}
                            </p>
                          </div>
                        </div>
                        {category.count > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('wallet.lastUpdated')}: {new Date().toLocaleDateString()}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowScanner(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Scan size={20} />
                  <span>{t('wallet.scanDocument')}</span>
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Upload size={20} />
                  <span>{t('wallet.uploadFile')}</span>
                </button>
                <button 
                  onClick={() => setShowAddDocument(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>{t('wallet.addDocument')}</span>
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder={t('wallet.searchDocuments')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterCategory || ''}
                    onChange={(e) => setFilterCategory(e.target.value || null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('wallet.allCategories')}</option>
                    {documentCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterTag || ''}
                    onChange={(e) => setFilterTag(e.target.value || null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('wallet.allTags')}</option>
                    <option value="id">{t('wallet.documentTags.id')}</option>
                    <option value="health">{t('wallet.documentTags.health')}</option>
                    <option value="travel">{t('wallet.documentTags.travel')}</option>
                    <option value="other">{t('wallet.documentTags.other')}</option>
                  </select>
                </div>
              </div>

              {/* Documents Grid */}
              <DocumentGrid
                documents={filteredDocuments}
                onDocumentSelect={handleDocumentSelect}
                loading={loading}
                error={error}
              />
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SecuritySettings
                isBiometricEnabled={isBiometricEnabled}
                onEnableBiometric={enableBiometric}
                onDisableBiometric={disableBiometric}
                isCloudSyncEnabled={isCloudSyncEnabled}
                onToggleCloudSync={syncWithCloud}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('wallet.settings.title')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {t('wallet.settings.notifications')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('wallet.settings.notificationsDescription')}
                      </p>
                    </div>
                    <button
                      onClick={requestPermission}
                      className="btn-primary"
                    >
                      {t('wallet.settings.enableNotifications')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <DocumentScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onComplete={handleScanComplete}
      />

      <DocumentUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onComplete={handleUploadComplete}
      />

      <DocumentModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        document={selectedDocument}
        onUpdate={updateDocument}
        onDelete={deleteDocument}
      />

        {/* Enhanced Floating Action Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddDocument(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-xl flex items-center justify-center z-40 group"
          title={t('wallet.addDocument')}
        >
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
        </motion.button>

      {/* Enhanced Add Document Modal */}
      <AnimatePresence>
        {showAddDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddDocument(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('wallet.addDocument')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('wallet.addDocumentDescription')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowAddDocument(false);
                    setShowScanner(true);
                  }}
                  className="w-full p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                      <Scan className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t('wallet.scanDocument')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('wallet.scanDescription')}
                      </p>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowAddDocument(false);
                    setShowUpload(true);
                  }}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t('wallet.uploadFile')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('wallet.uploadDescription')}
                      </p>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowAddDocument(false);
                    // Handle manual document creation
                    const newDocument = {
                      id: Date.now().toString(),
                      name: 'New Document',
                      type: 'other',
                      tags: [],
                      createdAt: new Date().toISOString(),
                      expiryDate: undefined
                    };
                    addDocument(newDocument);
                  }}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t('wallet.createManually')}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('wallet.manualDescription')}
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>
              
              <button
                onClick={() => setShowAddDocument(false)}
                className="w-full mt-6 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletModule;
