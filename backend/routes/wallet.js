const express = require('express');
const Razorpay = require('razorpay');
const Stripe = require('stripe');
const admin = require('firebase-admin');
const Joi = require('joi');
const crypto = require('crypto');
const NodeCache = require('node-cache');

const router = express.Router();

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Initialize payment gateways
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'demo_secret'
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo');

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

// Validation schemas
const addMoneySchema = Joi.object({
  amount: Joi.number().min(100).max(50000).required(),
  paymentMethod: Joi.string().valid('upi', 'card', 'netbanking', 'wallet').required(),
  paymentDetails: Joi.object({
    upiId: Joi.string().when('paymentMethod', {
      is: 'upi',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    cardNumber: Joi.string().when('paymentMethod', {
      is: 'card',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    expiryDate: Joi.string().when('paymentMethod', {
      is: 'card',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    cvv: Joi.string().when('paymentMethod', {
      is: 'card',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }).required()
});

const paymentSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  description: Joi.string().max(200).required(),
  recipientId: Joi.string().optional(),
  category: Joi.string().valid('transport', 'stay', 'food', 'shopping', 'other').required(),
  metadata: Joi.object().optional()
});

// Get wallet balance
router.get('/balance', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    const walletDoc = await db.collection('wallets').doc(uid).get();
    
    if (!walletDoc.exists) {
      // Create new wallet
      const newWallet = {
        userId: uid,
        balance: 0,
        currency: 'INR',
        isActive: true,
        transactions: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('wallets').doc(uid).set(newWallet);
      
      return res.json({
        success: true,
        data: {
          wallet: newWallet,
          transactions: []
        }
      });
    }

    const walletData = walletDoc.data();
    
    // Get recent transactions
    const transactionsSnapshot = await db
      .collection('transactions')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: {
        wallet: walletData,
        transactions
      }
    });

  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add money to wallet
router.post('/add-money', verifyFirebaseToken, async (req, res) => {
  try {
    const { error, value } = addMoneySchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { uid } = req.user;
    const { amount, paymentMethod, paymentDetails } = value;

    // Create Razorpay order
    const orderOptions = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `wallet_${uid}_${Date.now()}`,
      notes: {
        userId: uid,
        type: 'wallet_topup',
        paymentMethod
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    // Store pending transaction
    const transactionId = crypto.randomUUID();
    const pendingTransaction = {
      id: transactionId,
      userId: uid,
      type: 'credit',
      amount,
      currency: 'INR',
      status: 'pending',
      paymentMethod,
      paymentDetails,
      orderId: order.id,
      description: 'Wallet top-up',
      category: 'wallet',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('transactions').doc(transactionId).set(pendingTransaction);

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        transactionId,
        paymentOptions: {
          razorpay_key: process.env.RAZORPAY_KEY_ID,
          order_id: order.id
        }
      }
    });

  } catch (error) {
    console.error('Add money error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify payment and add money
router.post('/verify-payment', verifyFirebaseToken, async (req, res) => {
  try {
    const { transactionId, paymentSignature, paymentMethod } = req.body;

    if (!transactionId || !paymentSignature) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and payment signature are required'
      });
    }

    // Get transaction details
    const transactionDoc = await db.collection('transactions').doc(transactionId).get();
    
    if (!transactionDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const transaction = transactionDoc.data();

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transaction already processed'
      });
    }

    // Verify Razorpay signature
    const body = transactionId + "|" + paymentSignature;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'demo_secret')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== paymentSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update transaction status
    await db.collection('transactions').doc(transactionId).update({
      status: 'completed',
      paymentSignature,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update wallet balance
    const walletRef = db.collection('wallets').doc(transaction.userId);
    
    await db.runTransaction(async (t) => {
      const walletDoc = await t.get(walletRef);
      
      if (walletDoc.exists) {
        const currentBalance = walletDoc.data().balance || 0;
        t.update(walletRef, {
          balance: currentBalance + transaction.amount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        t.set(walletRef, {
          userId: transaction.userId,
          balance: transaction.amount,
          currency: 'INR',
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    res.json({
      success: true,
      message: 'Payment verified and money added to wallet successfully',
      data: {
        transactionId,
        amount: transaction.amount,
        newBalance: transaction.amount // Will be updated with actual balance
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Pay from wallet
router.post('/pay', verifyFirebaseToken, async (req, res) => {
  try {
    const { error, value } = paymentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { uid } = req.user;
    const { amount, description, recipientId, category, metadata } = value;

    // Check wallet balance
    const walletDoc = await db.collection('wallets').doc(uid).get();
    
    if (!walletDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const walletData = walletDoc.data();
    
    if (walletData.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        data: {
          required: amount,
          available: walletData.balance,
          shortfall: amount - walletData.balance
        }
      });
    }

    // Create transaction
    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      userId: uid,
      type: 'debit',
      amount,
      currency: 'INR',
      status: 'completed',
      paymentMethod: 'wallet',
      description,
      category,
      recipientId,
      metadata,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update wallet balance and create transaction
    await db.runTransaction(async (t) => {
      // Update wallet balance
      t.update(walletRef, {
        balance: walletData.balance - amount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create transaction record
      t.set(db.collection('transactions').doc(transactionId), transaction);
    });

    res.json({
      success: true,
      message: 'Payment completed successfully',
      data: {
        transactionId,
        amount,
        newBalance: walletData.balance - amount,
        description
      }
    });

  } catch (error) {
    console.error('Pay from wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get transaction history
router.get('/transactions', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { limit = 20, offset = 0, category, type, startDate, endDate } = req.query;

    let query = db.collection('transactions')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc');

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate));
    }

    const snapshot = await query.limit(parseInt(limit)).offset(parseInt(offset)).get();
    
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get total count for pagination
    const totalSnapshot = await db.collection('transactions')
      .where('userId', '==', uid)
      .get();

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: totalSnapshot.size,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: totalSnapshot.size > parseInt(offset) + parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// UPI Payment
router.post('/upi/pay', verifyFirebaseToken, async (req, res) => {
  try {
    const { upiId, amount, description, category } = req.body;

    if (!upiId || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID, amount, and description are required'
      });
    }

    const { uid } = req.user;

    // Create transaction
    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      userId: uid,
      type: 'debit',
      amount,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'upi',
      upiId,
      description,
      category: category || 'other',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('transactions').doc(transactionId).set(transaction);

    // Generate UPI payment URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=Kerala Horizon&am=${amount}&cu=INR&tn=${description}`;

    res.json({
      success: true,
      message: 'UPI payment initiated',
      data: {
        transactionId,
        upiUrl,
        amount,
        description,
        instructions: 'Open this link in a UPI app to complete payment'
      }
    });

  } catch (error) {
    console.error('UPI payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate UPI payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Card Payment
router.post('/card/pay', verifyFirebaseToken, async (req, res) => {
  try {
    const { cardNumber, expiryDate, cvv, amount, description, category } = req.body;

    if (!cardNumber || !expiryDate || !cvv || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Card details, amount, and description are required'
      });
    }

    const { uid } = req.user;

    // Create transaction
    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      userId: uid,
      type: 'debit',
      amount,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'card',
      description,
      category: category || 'other',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('transactions').doc(transactionId).set(transaction);

    // For demo purposes, simulate successful payment
    // In production, integrate with Stripe or other payment processor
    setTimeout(async () => {
      await db.collection('transactions').doc(transactionId).update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }, 2000);

    res.json({
      success: true,
      message: 'Card payment initiated',
      data: {
        transactionId,
        amount,
        description,
        status: 'processing',
        estimatedCompletion: '2-5 seconds'
      }
    });

  } catch (error) {
    console.error('Card payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process card payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get payment methods
router.get('/payment-methods', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Get saved payment methods from user profile
    const userDoc = await db.collection('users').doc(uid).get();
    
    const paymentMethods = [];
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      if (userData.savedCards) {
        paymentMethods.push(...userData.savedCards.map(card => ({
          id: card.id,
          type: 'card',
          last4: card.last4,
          brand: card.brand,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear
        })));
      }
      
      if (userData.upiId) {
        paymentMethods.push({
          id: 'upi_primary',
          type: 'upi',
          upiId: userData.upiId,
          isPrimary: true
        });
      }
    }

    // Add wallet as a payment method
    paymentMethods.unshift({
      id: 'wallet',
      type: 'wallet',
      name: 'Wallet Balance',
      balance: 0 // Will be updated with actual balance
    });

    res.json({
      success: true,
      data: {
        paymentMethods
      }
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;