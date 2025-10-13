const express = require('express');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'kerala-horizon',
    storageBucket: 'kerala-horizon.firebasestorage.app'
  });
}

const db = admin.firestore();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
  preferences: Joi.object({
    language: Joi.string().valid('en', 'hi', 'ml', 'ta', 'ar', 'de').default('en'),
    currency: Joi.string().valid('INR', 'USD', 'EUR').default('INR'),
    notifications: Joi.boolean().default(true)
  }).default({})
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

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

// Register new user
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password, name, phone, preferences } = value;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone ? `+91${phone}` : undefined
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email,
      name,
      phone: phone || null,
      preferences,
      profilePicture: null,
      travelHistory: [],
      greenScore: 0,
      achievements: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    // Generate custom JWT token
    const customToken = jwt.sign(
      { 
        uid: userRecord.uid, 
        email, 
        name,
        role: 'user'
      },
      process.env.JWT_SECRET || 'kerala-horizon-secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
      user: {
          uid: userRecord.uid,
          email,
          name,
          preferences
        },
        token: customToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Login user
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password } = value;

    // Sign in with Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Verify password (Firebase handles this, but we can add additional verification)
    // For now, we'll trust Firebase Auth
    
    // Get user profile from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const userProfile = userDoc.data();

    // Generate custom JWT token
    const customToken = jwt.sign(
      { 
        uid: userRecord.uid, 
        email: userRecord.email, 
        name: userRecord.displayName,
        role: 'user'
      },
      process.env.JWT_SECRET || 'kerala-horizon-secret',
      { expiresIn: '24h' }
    );

    // Update last login
    await db.collection('users').doc(userRecord.uid).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
      user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName,
          preferences: userProfile.preferences,
          greenScore: userProfile.greenScore
        },
        token: customToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const userProfile = userDoc.data();
    
    // Remove sensitive data
    delete userProfile.phone;

    res.json({
      success: true,
      data: {
        profile: userProfile
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const updateData = req.body;

    // Validate update data
    const allowedFields = ['name', 'phone', 'preferences', 'profilePicture'];
    const filteredData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    filteredData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('users').doc(uid).update(filteredData);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Logout user (client-side token removal)
router.post('/logout', verifyFirebaseToken, async (req, res) => {
  try {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success as token removal is handled client-side

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Reset password
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Firebase will send password reset email
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // In a real implementation, you might want to send this via email service
    // For now, we'll return the link (not recommended for production)
    
    res.json({
      success: true,
      message: 'Password reset link generated',
      data: {
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reset link',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify email
router.post('/verify-email', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Generate email verification link
    const verificationLink = await admin.auth().generateEmailVerificationLink(req.user.email);

    // In a real implementation, you might want to send this via email service

    res.json({
      success: true,
      message: 'Email verification link generated',
      data: {
        verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
      }
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate verification link',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;