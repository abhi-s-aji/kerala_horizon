import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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
  User,
  Hash,
  MapPin,
  Shield,
  Eye,
  EyeOff
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
    issueDate?: string;
    issuingCountry?: string;
  };
}

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  onUpdate,
  onDelete
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImage, setShowImage] = useState(true);

  React.useEffect(() => {
    if (document) {
      setEditedData({ ...document });
    }
  }, [document]);

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

  const handleSave = () => {
    if (editedData && document) {
      onUpdate(document.id, editedData);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (document) {
      onDelete(document.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleTagToggle = (tag: string) => {
    if (!editedData) return;
    
    setEditedData({
      ...editedData,
      tags: editedData.tags.includes(tag)
        ? editedData.tags.filter((t: string) => t !== tag)
        : [...editedData.tags, tag]
    });
  };

  const handleFieldChange = (field: string, value: string) => {
    if (!editedData) return;
    
    setEditedData({
      ...editedData,
      extractedData: {
        ...editedData.extractedData,
        [field]: value
      }
    });
  };

  if (!isOpen || !document) return null;

  const expiryStatus = getExpiryStatus(document.expiryDate);
  const data = isEditing ? editedData : document;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {data.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {data.type}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                  >
                    {t('common.save')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={t('wallet.actions.edit')}
                  >
                    <Edit3 className="w-5 h-5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={t('wallet.actions.delete')}
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Document Image */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {data.thumbnail && showImage ? (
                      <img
                        src={data.thumbnail}
                        alt={data.name}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center">
                        <FileText className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {data.thumbnail && (
                    <button
                      onClick={() => setShowImage(!showImage)}
                      className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
                    >
                      {showImage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button className="btn-secondary flex items-center space-x-2 flex-1">
                    <Share2 className="w-4 h-4" />
                    <span>{t('wallet.actions.share')}</span>
                  </button>
                  <button className="btn-secondary flex items-center space-x-2 flex-1">
                    <Download className="w-4 h-4" />
                    <span>{t('wallet.actions.download')}</span>
                  </button>
                </div>
              </div>

              {/* Document Details */}
              <div className="space-y-6">
                {/* Expiry Status */}
                {expiryStatus && (
                  <div className={`p-4 rounded-lg ${expiryStatus.color}`}>
                    <div className="flex items-center space-x-2">
                      {expiryStatus.status === 'expired' && <AlertTriangle className="w-5 h-5" />}
                      {expiryStatus.status === 'today' && <Clock className="w-5 h-5" />}
                      {expiryStatus.status === 'tomorrow' && <Clock className="w-5 h-5" />}
                      {expiryStatus.status === 'soon' && <Clock className="w-5 h-5" />}
                      {expiryStatus.status === 'warning' && <Clock className="w-5 h-5" />}
                      {expiryStatus.status === 'valid' && <CheckCircle className="w-5 h-5" />}
                      <span className="font-medium">
                        {expiryStatus.status === 'expired' && t('wallet.expiryAlerts.expired')}
                        {expiryStatus.status === 'today' && t('wallet.expiryAlerts.expiresToday')}
                        {expiryStatus.status === 'tomorrow' && t('wallet.expiryAlerts.expiresTomorrow')}
                        {expiryStatus.status === 'soon' && `${t('wallet.expiryAlerts.expiresIn')} ${expiryStatus.days} ${t('wallet.expiryAlerts.days')}`}
                        {expiryStatus.status === 'warning' && `${t('wallet.expiryAlerts.expiresIn')} ${expiryStatus.days} ${t('wallet.expiryAlerts.days')}`}
                        {expiryStatus.status === 'valid' && `${expiryStatus.days} ${t('wallet.expiryAlerts.days')} ${t('wallet.expiryAlerts.remaining')}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Document Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {t('wallet.documentInfo')}
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {t('wallet.documentName')}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={data.extractedData?.name || ''}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {data.extractedData?.name || t('wallet.notAvailable')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Hash className="w-5 h-5 text-gray-500" />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {t('wallet.documentNumber')}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={data.extractedData?.documentNumber || ''}
                            onChange={(e) => handleFieldChange('documentNumber', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {data.extractedData?.documentNumber || t('wallet.notAvailable')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {t('wallet.expiryDate')}
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={data.extractedData?.expiryDate || ''}
                            onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {data.extractedData?.expiryDate || t('wallet.notAvailable')}
                          </div>
                        )}
                      </div>
                    </div>

                    {data.extractedData?.issueDate && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t('wallet.issueDate')}
                          </label>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {data.extractedData.issueDate}
                          </div>
                        </div>
                      </div>
                    )}

                    {data.extractedData?.issuingCountry && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t('wallet.issuingCountry')}
                          </label>
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            {data.extractedData.issuingCountry}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {t('wallet.tags')}
                  </h4>
                  
                  <div className="flex flex-wrap gap-2">
                    {['id', 'health', 'travel', 'other'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          data.tags.includes(tag)
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {t(`wallet.documentTags.${tag}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {t('wallet.metadata')}
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('wallet.createdAt')}:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(data.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('wallet.documentType')}:
                      </span>
                      <span className="text-gray-900 dark:text-white capitalize">
                        {data.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('wallet.deleteConfirm.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('wallet.deleteConfirm.message')}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary flex-1"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex-1"
                  >
                    {t('wallet.actions.delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default DocumentModal;




















