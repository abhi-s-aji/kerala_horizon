import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  Image,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  Tag,
  Calendar,
  User
} from 'lucide-react';

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentData, setDocumentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf'
  };

  const documentTypes = [
    { id: 'passport', label: t('wallet.documentTypes.passport'), icon: FileText },
    { id: 'visa', label: t('wallet.documentTypes.visa'), icon: FileText },
    { id: 'insurance', label: t('wallet.documentTypes.insurance'), icon: FileText },
    { id: 'vaccination', label: t('wallet.documentTypes.vaccination'), icon: FileText },
    { id: 'id', label: t('wallet.documentTypes.id'), icon: FileText },
    { id: 'other', label: t('wallet.documentTypes.other'), icon: FileText }
  ];

  const predefinedTags = [
    { id: 'id', label: t('wallet.documentTags.id'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
    { id: 'health', label: t('wallet.documentTags.health'), color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
    { id: 'travel', label: t('wallet.documentTags.travel'), color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
    { id: 'work', label: t('wallet.documentTags.work'), color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
    { id: 'education', label: t('wallet.documentTags.education'), color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300' },
    { id: 'financial', label: t('wallet.documentTags.financial'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
    { id: 'other', label: t('wallet.documentTags.other'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
  ];

  // Auto-suggested tags based on file analysis
  const autoSuggestedTags = [
    { id: 'scanned', label: 'Scanned', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300' },
    { id: 'expiring-soon', label: 'Expiring Soon', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
    { id: 'international', label: 'International', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300' },
    { id: 'government', label: 'Government', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);
    
    // Validate file type
    if (!Object.keys(acceptedTypes).includes(file.type)) {
      setError(t('wallet.upload.invalidFileType'));
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('wallet.upload.fileTooLarge'));
      return;
    }

    setUploadedFile(file);
    processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = e.target?.result as string;
        
        // Mock extracted data based on file type
        const mockData = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type.includes('image') ? 'passport' : 'other',
          fileData,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          extractedData: {
            name: 'John Doe',
            documentNumber: 'A12345678',
            expiryDate: '2025-12-31',
            issueDate: '2020-01-01'
          },
          tags: ['travel'],
          expiryDate: '2025-12-31'
        };
        
        setDocumentData(mockData);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(t('wallet.upload.processingError'));
      setIsProcessing(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setDocumentData((prev: any) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((t: string) => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleAddCustomTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags([...customTags, newTag.trim()]);
      setDocumentData((prev: any) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleComplete = () => {
    if (documentData) {
      onComplete(documentData);
      setDocumentData(null);
      setUploadedFile(null);
      setCustomTags([]);
      setNewTag('');
      onClose();
    }
  };

  const handleRetry = () => {
    setUploadedFile(null);
    setDocumentData(null);
    setError(null);
    setCustomTags([]);
    setNewTag('');
  };

  if (!isOpen) return null;

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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('wallet.upload.title')}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-400">{error}</span>
                </div>
              </div>
            )}

            {!uploadedFile && (
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('wallet.upload.dragDrop')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t('wallet.upload.supportedFormats')}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary"
                  >
                    {t('wallet.upload.selectFile')}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {documentTypes.map((type) => (
                    <button
                      key={type.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <type.icon className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uploadedFile && !documentData && (
              <div className="text-center py-8">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('wallet.upload.processing')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('wallet.upload.processingMessage')}
                    </p>
                  </>
                ) : (
                  <>
                    <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {uploadedFile.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                )}
              </div>
            )}

            {documentData && (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('wallet.upload.success')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('wallet.upload.reviewData')}
                  </p>
                </div>

                {/* Document Details */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('wallet.upload.documentName')}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {documentData.extractedData.name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('wallet.upload.documentNumber')}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {documentData.extractedData.documentNumber}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('wallet.upload.expiryDate')}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {documentData.extractedData.expiryDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    {t('wallet.upload.tags')}
                  </h5>
                  
                  <div className="flex flex-wrap gap-2">
                    {predefinedTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          documentData.tags.includes(tag.id)
                            ? tag.color
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder={t('wallet.upload.addCustomTag')}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddCustomTag}
                      className="btn-secondary flex items-center space-x-1"
                    >
                      <Tag className="w-4 h-4" />
                      <span>{t('wallet.upload.add')}</span>
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleRetry}
                    className="btn-secondary flex items-center space-x-2 flex-1"
                  >
                    <X className="w-4 h-4" />
                    <span>{t('wallet.upload.retry')}</span>
                  </button>
                  <button
                    onClick={handleComplete}
                    className="btn-primary flex items-center space-x-2 flex-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('wallet.upload.save')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentUpload;
