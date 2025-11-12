import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode,
  Copy,
  ExternalLink
} from 'lucide-react';
import { paymentService, PaymentMethod, PaymentRequest, PaymentResponse, UPIResponse, CardDetails } from '../../services/paymentService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (response: PaymentResponse) => void;
  onError: (error: string) => void;
  paymentRequest: PaymentRequest;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  paymentRequest
}) => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'method' | 'details' | 'processing' | 'result'>('method');
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
    type: 'visa'
  });
  const [upiResponse, setUpiResponse] = useState<UPIResponse | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      console.error('Error loading payment methods:', err);
    }
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setStep('details');
  };

  const handleCardInputChange = (field: keyof CardDetails, value: string) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const detectCardType = (number: string): 'visa' | 'mastercard' | 'amex' | 'rupay' => {
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    return 'rupay';
  };

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    handleCardInputChange('number', formatted);
    
    if (cleaned.length >= 4) {
      const cardType = detectCardType(cleaned);
      handleCardInputChange('type', cardType);
    }
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    setStep('processing');
    setError('');

    try {
      let response: PaymentResponse;

      switch (selectedMethod) {
        case 'upi':
          const upiResponse = await paymentService.processUPIPayment(paymentRequest);
          if (upiResponse.success) {
            setUpiResponse(upiResponse);
            setStep('details');
            return;
          } else {
            throw new Error('UPI payment failed');
          }

        case 'card':
          response = await paymentService.processCardPayment(paymentRequest, cardDetails);
          break;

        case 'wallet':
          response = await paymentService.processWalletPayment(paymentRequest, 'paytm');
          break;

        default:
          throw new Error('Invalid payment method');
      }

      setPaymentResponse(response);
      setStep('result');

      if (response.success) {
        onSuccess(response);
      } else {
        onError(response.error || 'Payment failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  const handleUPIPayment = async () => {
    if (upiResponse?.deepLink) {
      window.open(upiResponse.deepLink, '_blank');
    }
  };

  const copyUPIId = () => {
    if (upiResponse?.upiId) {
      navigator.clipboard.writeText(upiResponse.upiId);
    }
  };

  const copyQRCode = () => {
    if (upiResponse?.qrCode) {
      // In a real implementation, you would copy the QR code image
      console.log('QR Code copied');
    }
  };

  const resetModal = () => {
    setSelectedMethod('');
    setStep('method');
    setCardDetails({
      number: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      name: '',
      type: 'visa'
    });
    setUpiResponse(null);
    setPaymentResponse(null);
    setError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
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
              {t('payment.title')}
            </h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
            {/* Payment Method Selection */}
            {step === 'method' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('payment.selectMethod')}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('payment.amount')}: ₹{paymentRequest.amount}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
                    >
                      <div className="text-2xl mb-2">{method.icon}</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {method.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Details */}
            {step === 'details' && selectedMethod === 'card' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('payment.cardDetails')}
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('payment.cardNumber')}
                    </label>
                    <input
                      type="text"
                      value={cardDetails.number}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      className="input-field"
                      maxLength={19}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('payment.expiryMonth')}
                      </label>
                      <select
                        value={cardDetails.expiryMonth}
                        onChange={(e) => handleCardInputChange('expiryMonth', e.target.value)}
                        className="select-field"
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('payment.expiryYear')}
                      </label>
                      <select
                        value={cardDetails.expiryYear}
                        onChange={(e) => handleCardInputChange('expiryYear', e.target.value)}
                        className="select-field"
                      >
                        <option value="">YY</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={String(year).slice(-2)}>
                              {String(year).slice(-2)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('payment.cvv')}
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cvv}
                        onChange={(e) => handleCardInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        className="input-field"
                        maxLength={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('payment.cardholderName')}
                      </label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) => handleCardInputChange('name', e.target.value)}
                        placeholder={t('payment.cardholderName')}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setStep('method')}
                    className="btn-secondary flex-1"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={!cardDetails.number || !cardDetails.expiryMonth || !cardDetails.expiryYear || !cardDetails.cvv || !cardDetails.name}
                    className="btn-primary flex-1"
                  >
                    {t('payment.payNow')}
                  </button>
                </div>
              </div>
            )}

            {/* UPI Payment */}
            {step === 'details' && selectedMethod === 'upi' && upiResponse && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('payment.upiPayment')}
                </h4>

                <div className="text-center">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {t('payment.scanQRCode')}
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded p-2 mb-2">
                      <img src={upiResponse.qrCode} alt="UPI QR Code" className="w-32 h-32 mx-auto" />
                    </div>
                    <button
                      onClick={copyQRCode}
                      className="btn-outline text-sm"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {t('payment.copyQR')}
                    </button>
                  </div>

                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {t('payment.upiId')}
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      <code className="bg-white dark:bg-gray-800 px-3 py-1 rounded text-sm font-mono">
                        {upiResponse.upiId}
                      </code>
                      <button
                        onClick={copyUPIId}
                        className="btn-outline text-sm"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleUPIPayment}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{t('payment.openUPIApp')}</span>
                  </button>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setStep('method')}
                    className="btn-secondary flex-1"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    className="btn-primary flex-1"
                  >
                    {t('payment.confirmPayment')}
                  </button>
                </div>
              </div>
            )}

            {/* Processing */}
            {step === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('payment.processing')}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('payment.processingMessage')}
                </p>
              </div>
            )}

            {/* Result */}
            {step === 'result' && paymentResponse && (
              <div className="text-center py-8">
                {paymentResponse.success ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('payment.success')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {t('payment.successMessage')}
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('payment.transactionId')}: {paymentResponse.transactionId}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('payment.failed')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {paymentResponse.error || t('payment.failedMessage')}
                    </p>
                  </>
                )}

                <button
                  onClick={handleClose}
                  className="btn-primary w-full"
                >
                  {t('common.close')}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;


















