import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  RotateCcw,
  Flashlight,
  FlashlightOff,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface DocumentScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(t('wallet.scanner.cameraError'));
      setHasPermission(false);
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Enhanced OCR processing with ML Kit/Tesseract simulation
    setIsScanning(true);
    
    try {
      // Simulate advanced OCR processing
      const ocrResult = await simulateAdvancedOCR(imageData) as any;
      
      const scannedDocument = {
        id: Date.now().toString(),
        name: ocrResult.documentType || 'Scanned Document',
        type: ocrResult.documentType?.toLowerCase() || 'other',
        imageData,
        extractedData: ocrResult,
        tags: generateAutoTags(ocrResult),
        createdAt: new Date().toISOString(),
        expiryDate: ocrResult.expiryDate
      };
      
      setScannedData(scannedDocument);
    } catch (error) {
      console.error('OCR processing failed:', error);
      // Fallback to basic processing
      const fallbackData = {
        id: Date.now().toString(),
        name: 'Scanned Document',
        type: 'other',
        imageData,
        extractedData: {
          name: 'Unknown',
          documentNumber: 'N/A',
          expiryDate: undefined,
          issueDate: undefined,
          issuingCountry: 'Unknown'
        },
        tags: ['scanned'],
        createdAt: new Date().toISOString(),
        expiryDate: undefined
      };
      
      setScannedData(fallbackData);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Simulate advanced OCR processing
  const simulateAdvancedOCR = async (imageData: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate ML Kit/Tesseract OCR results
        const documentTypes = ['passport', 'visa', 'insurance', 'vaccination', 'id'];
        const randomType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
        
        const mockResults = {
          documentType: randomType,
          name: 'John Doe',
          documentNumber: `A${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          expiryDate: '2025-12-31',
          issueDate: '2020-01-01',
          issuingCountry: 'United States',
          confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
          rawText: 'PASSPORT\nJOHN DOE\nA12345678\nEXP: 12/31/2025\nUSA',
          detectedFields: ['name', 'documentNumber', 'expiryDate', 'issuingCountry']
        };
        
        resolve(mockResults);
      }, 2000);
    });
  };

  // Generate auto-suggested tags based on OCR results
  const generateAutoTags = (ocrResult: any) => {
    const tags = ['scanned'];
    
    if (ocrResult.documentType) {
      tags.push(ocrResult.documentType);
    }
    
    if (ocrResult.issuingCountry) {
      tags.push('international');
    }
    
    if (ocrResult.expiryDate) {
      const expiry = new Date(ocrResult.expiryDate);
      const today = new Date();
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 30) {
        tags.push('expiring-soon');
      }
    }
    
    return tags;
  };

  const handleComplete = () => {
    if (scannedData) {
      onComplete(scannedData);
      setScannedData(null);
      onClose();
    }
  };

  const handleRetry = () => {
    setScannedData(null);
    setError(null);
  };

  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedData(null);
      setError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('wallet.scanner.title')}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-400">{error}</span>
                </div>
              </div>
            )}

            {hasPermission === false && (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('wallet.scanner.permissionDenied')}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('wallet.scanner.permissionMessage')}
                </p>
                <button
                  onClick={startCamera}
                  className="btn-primary"
                >
                  {t('wallet.scanner.retry')}
                </button>
              </div>
            )}

            {hasPermission === true && !scannedData && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white border-dashed rounded-lg w-48 h-32 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {t('wallet.scanner.positionDocument')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={captureImage}
                    disabled={isScanning}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isScanning ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    <span>
                      {isScanning ? t('wallet.scanner.processing') : t('wallet.scanner.capture')}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setFlashEnabled(!flashEnabled)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      flashEnabled
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {flashEnabled ? (
                      <Flashlight className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <FlashlightOff className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {scannedData && (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('wallet.scanner.success')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('wallet.scanner.extractedData')}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('wallet.scanner.name')}:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {scannedData.extractedData.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('wallet.scanner.documentNumber')}:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {scannedData.extractedData.documentNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('wallet.scanner.expiryDate')}:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {scannedData.extractedData.expiryDate}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleRetry}
                    className="btn-secondary flex items-center space-x-2 flex-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('wallet.scanner.retry')}</span>
                  </button>
                  <button
                    onClick={handleComplete}
                    className="btn-primary flex items-center space-x-2 flex-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('wallet.scanner.save')}</span>
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

export default DocumentScanner;

