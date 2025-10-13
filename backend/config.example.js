// Environment Configuration for Kerala Horizon Backend
// Copy this file to .env and update with your actual values

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Firebase Configuration
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'kerala-horizon',
  FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'kerala-horizon.appspot.com',
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || '',

  // API Keys
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || '',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',

  // Payment Gateways
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',

  // External APIs
  KSRTC_API_URL: process.env.KSRTC_API_URL || 'https://api.ksrtc.in',
  IRCTC_API_URL: process.env.IRCTC_API_URL || 'https://api.irctc.co.in',
  UPI_API_URL: process.env.UPI_API_URL || 'https://api.upi.in',

  // Database
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/kerala-horizon',

  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key',
  API_KEY: process.env.API_KEY || 'your-api-key',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-encryption-key',

  // Email Service
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',

  // SMS Service
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',

  // AI Services
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // File Storage
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};







