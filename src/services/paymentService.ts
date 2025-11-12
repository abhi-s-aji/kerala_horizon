import { apiService } from './api';

export interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'netbanking' | 'wallet';
  name: string;
  icon: string;
  enabled: boolean;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  method: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  gateway: string;
  transactionId?: string;
  error?: string;
}

export interface UPIResponse {
  success: boolean;
  upiId: string;
  deepLink: string;
  qrCode?: string;
}

export interface CardDetails {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  name: string;
  type: 'visa' | 'mastercard' | 'amex' | 'rupay';
}

class PaymentService {
  private readonly baseUrl = process.env.REACT_APP_PAYMENT_API_URL || 'https://api.razorpay.com/v1';
  private readonly keyId = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_1234567890';
  private readonly keySecret = process.env.REACT_APP_RAZORPAY_KEY_SECRET || 'test_secret';

  // Initialize Razorpay
  private initializeRazorpay(): Promise<any> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve((window as any).Razorpay);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        resolve(null);
      };
      document.body.appendChild(script);
    });
  }

  // Get available payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return [
      {
        id: 'upi',
        type: 'upi',
        name: 'UPI',
        icon: '💳',
        enabled: true
      },
      {
        id: 'card',
        type: 'card',
        name: 'Credit/Debit Card',
        icon: '💳',
        enabled: true
      },
      {
        id: 'netbanking',
        type: 'netbanking',
        name: 'Net Banking',
        icon: '🏦',
        enabled: true
      },
      {
        id: 'wallet',
        type: 'wallet',
        name: 'Digital Wallet',
        icon: '📱',
        enabled: true
      }
    ];
  }

  // Create payment order
  async createOrder(paymentRequest: PaymentRequest): Promise<{ orderId: string; amount: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`
        },
        body: JSON.stringify({
          amount: paymentRequest.amount * 100, // Convert to paise
          currency: paymentRequest.currency,
          receipt: paymentRequest.orderId,
          notes: {
            customer_id: paymentRequest.customerId,
            description: paymentRequest.description
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Payment order creation failed: ${response.statusText}`);
      }

      const order = await response.json();
      return {
        orderId: order.id,
        amount: order.amount
      };
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  // Process UPI payment
  async processUPIPayment(paymentRequest: PaymentRequest): Promise<UPIResponse> {
    try {
      const order = await this.createOrder(paymentRequest);
      
      // Simulate UPI payment flow
      const upiId = `${paymentRequest.customerPhone}@paytm`;
      const deepLink = `upi://pay?pa=${upiId}&pn=Kerala Horizon&am=${paymentRequest.amount}&cu=INR&tn=${paymentRequest.description}`;
      
      return {
        success: true,
        upiId,
        deepLink,
        qrCode: `data:image/svg+xml;base64,${btoa(`
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">UPI QR Code</text>
            <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="10">${upiId}</text>
          </svg>
        `)}`
      };
    } catch (error) {
      console.error('UPI payment error:', error);
      return {
        success: false,
        upiId: '',
        deepLink: ''
      };
    }
  }

  // Process card payment
  async processCardPayment(paymentRequest: PaymentRequest, cardDetails: CardDetails): Promise<PaymentResponse> {
    try {
      const order = await this.createOrder(paymentRequest);
      const Razorpay = await this.initializeRazorpay();

      if (!Razorpay) {
        throw new Error('Razorpay not available');
      }

      return new Promise((resolve) => {
        const options = {
          key: this.keyId,
          amount: order.amount,
          currency: paymentRequest.currency,
          name: 'Kerala Horizon',
          description: paymentRequest.description,
          order_id: order.orderId,
          prefill: {
            name: cardDetails.name,
            email: paymentRequest.customerEmail,
            contact: paymentRequest.customerPhone
          },
          notes: {
            customer_id: paymentRequest.customerId
          },
          handler: (response: any) => {
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: paymentRequest.amount,
              status: 'success',
              gateway: 'razorpay',
              transactionId: response.razorpay_payment_id
            });
          },
          modal: {
            ondismiss: () => {
              resolve({
                success: false,
                paymentId: '',
                orderId: order.orderId,
                amount: paymentRequest.amount,
                status: 'cancelled',
                gateway: 'razorpay',
                error: 'Payment cancelled by user'
              });
            }
          }
        };

        const razorpayInstance = new Razorpay(options);
        razorpayInstance.open();
      });
    } catch (error) {
      console.error('Card payment error:', error);
      return {
        success: false,
        paymentId: '',
        orderId: '',
        amount: paymentRequest.amount,
        status: 'failed',
        gateway: 'razorpay',
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  // Process wallet payment
  async processWalletPayment(paymentRequest: PaymentRequest, walletType: string): Promise<PaymentResponse> {
    try {
      // Simulate wallet payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        paymentId: `wallet_${Date.now()}`,
        orderId: paymentRequest.orderId,
        amount: paymentRequest.amount,
        status: 'success',
        gateway: walletType,
        transactionId: `txn_${Date.now()}`
      };
    } catch (error) {
      console.error('Wallet payment error:', error);
      return {
        success: false,
        paymentId: '',
        orderId: paymentRequest.orderId,
        amount: paymentRequest.amount,
        status: 'failed',
        gateway: walletType,
        error: 'Wallet payment failed'
      };
    }
  }

  // Verify payment
  async verifyPayment(paymentId: string, orderId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const payment = await response.json();
      return payment.status === 'captured' && payment.order_id === orderId;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment status');
      }

      const payment = await response.json();
      return {
        success: payment.status === 'captured',
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount / 100,
        status: payment.status === 'captured' ? 'success' : 'failed',
        gateway: 'razorpay',
        transactionId: payment.id
      };
    } catch (error) {
      console.error('Get payment status error:', error);
      return {
        success: false,
        paymentId,
        orderId: '',
        amount: 0,
        status: 'failed',
        gateway: 'razorpay',
        error: error instanceof Error ? error.message : 'Failed to get payment status'
      };
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.keyId}:${this.keySecret}`)}`
        },
        body: JSON.stringify({
          amount: amount ? amount * 100 : undefined // Convert to paise
        })
      });

      if (!response.ok) {
        throw new Error('Refund failed');
      }

      const refund = await response.json();
      return {
        success: true,
        refundId: refund.id
      };
    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed'
      };
    }
  }
}

export const paymentService = new PaymentService();


















