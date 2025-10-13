import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
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
  Eye,
  Image as ImageIcon,
  Smartphone,
  Mail,
  Bluetooth,
  MoreVertical,
  Copy,
  ExternalLink
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  tags: string[];
  expiryDate?: string;
  createdAt: string;
  thumbnail?: string;
  extractedData?: {
    name?: string;
    documentNumber?: string;
    expiryDate?: string;
  };
}

interface DocumentGridProps {
  documents: Document[];
  onDocumentSelect: (document: Document) => void;
  loading?: boolean;
  error?: string | null;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  onDocumentSelect,
  loading = false,
  error = null
}) => {
  const { t } = useTranslation();
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

  const handleShare = async (document: Document, method: 'whatsapp' | 'email' | 'bluetooth' | 'copy') => {
    try {
      const shareData = {
        title: document.name,
        text: `Document: ${document.name}\nType: ${document.type}\nExpiry: ${document.expiryDate || 'N/A'}`,
        url: document.thumbnail || ''
      };

      switch (method) {
        case 'whatsapp':
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text)}`;
          window.open(whatsappUrl, '_blank');
          break;
        case 'email':
          const emailUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text)}`;
          window.open(emailUrl);
          break;
        case 'bluetooth':
          // In a real app, this would use Web Bluetooth API
          if ('bluetooth' in navigator) {
            console.log('Bluetooth sharing not implemented yet');
          } else {
            alert('Bluetooth not supported on this device');
          }
          break;
        case 'copy':
          await navigator.clipboard.writeText(shareData.text);
          alert('Document details copied to clipboard');
          break;
      }
    } catch (error) {
      console.error('Error sharing document:', error);
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', days: 0, color: 'text-red-600 bg-red-100' };
    if (diffDays === 0) return { status: 'today', days: 0, color: 'text-red-600 bg-red-100' };
    if (diffDays === 1) return { status: 'tomorrow', days: 1, color: 'text-orange-600 bg-orange-100' };
    if (diffDays <= 5) return { status: 'soon', days: diffDays, color: 'text-orange-600 bg-orange-100' };
    if (diffDays <= 30) return { status: 'warning', days: diffDays, color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'valid', days: diffDays, color: 'text-green-600 bg-green-100' };
  };

  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'passport':
      case 'visa':
      case 'id':
        return FileText;
      default:
        return FileText;
    }
  };

  const getTagColor = (tag: string) => {
    const colors = {
      id: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      health: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      travel: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[tag as keyof typeof colors] || colors.other;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('wallet.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('wallet.error')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('wallet.noDocuments')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('wallet.noDocumentsMessage')}
        </p>
        <div className="flex justify-center space-x-3">
          <button className="btn-primary">
            {t('wallet.scanDocument')}
          </button>
          <button className="btn-secondary">
            {t('wallet.uploadFile')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((document) => {
        const expiryStatus = getExpiryStatus(document.expiryDate);
        const DocumentIcon = getDocumentIcon(document.type);
        
        return (
          <motion.div
            key={document.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200"
          >
            {/* Thumbnail */}
            <div className="relative h-32 bg-gray-100 dark:bg-gray-700">
              {document.thumbnail ? (
                <img
                  src={document.thumbnail}
                  alt={document.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <DocumentIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Expiry Status */}
              {expiryStatus && (
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                  {expiryStatus.status === 'expired' && (
                    <span className="flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{t('wallet.expiryAlerts.expired')}</span>
                    </span>
                  )}
                  {expiryStatus.status === 'today' && (
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{t('wallet.expiryAlerts.expiresToday')}</span>
                    </span>
                  )}
                  {expiryStatus.status === 'tomorrow' && (
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{t('wallet.expiryAlerts.expiresTomorrow')}</span>
                    </span>
                  )}
                  {expiryStatus.status === 'soon' && (
                    <span>
                      {t('wallet.expiryAlerts.expiresIn')} {expiryStatus.days} {t('wallet.expiryAlerts.days')}
                    </span>
                  )}
                  {expiryStatus.status === 'warning' && (
                    <span>
                      {t('wallet.expiryAlerts.expiresIn')} {expiryStatus.days} {t('wallet.expiryAlerts.days')}
                    </span>
                  )}
                  {expiryStatus.status === 'valid' && (
                    <span className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{expiryStatus.days} {t('wallet.expiryAlerts.days')}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate flex-1">
                  {document.name}
                </h4>
                <button
                  onClick={() => onDocumentSelect(document)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ml-2"
                >
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Document Type */}
              <div className="flex items-center space-x-2 mb-3">
                <DocumentIcon className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {document.type}
                </span>
              </div>

              {/* Tags */}
              {document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {document.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                  {document.tags.length > 2 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      +{document.tags.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <button
                    onClick={() => onDocumentSelect(document)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title={t('wallet.actions.view')}
                  >
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => setShowQuickActions(showQuickActions === document.id ? null : document.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors relative"
                    title={t('wallet.actions.share')}
                  >
                    <Share2 className="w-4 h-4 text-gray-500" />
                    
                    {/* Quick Actions Dropdown */}
                    {showQuickActions === document.id && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => {
                              handleShare(document, 'whatsapp');
                              setShowQuickActions(null);
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Smartphone className="w-4 h-4 text-green-500" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={() => {
                              handleShare(document, 'email');
                              setShowQuickActions(null);
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Mail className="w-4 h-4 text-blue-500" />
                            <span>Email</span>
                          </button>
                          <button
                            onClick={() => {
                              handleShare(document, 'bluetooth');
                              setShowQuickActions(null);
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Bluetooth className="w-4 h-4 text-blue-600" />
                            <span>Bluetooth</span>
                          </button>
                          <button
                            onClick={() => {
                              handleShare(document, 'copy');
                              setShowQuickActions(null);
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </button>
                  <button
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title={t('wallet.actions.download')}
                  >
                    <Download className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(document.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DocumentGrid;

