// Kerala Horizon Configuration Example
// Copy this file to config.js and update the values

const config = {
  // Firebase Configuration
  firebase: {
    apiKey: "your_firebase_api_key",
    authDomain: "your_project.firebaseapp.com",
    projectId: "your_project_id",
    storageBucket: "your_project.appspot.com",
    messagingSenderId: "your_sender_id",
    appId: "your_app_id"
  },

  // Payment Configuration
  payment: {
    razorpay: {
      keyId: "your_razorpay_key_id",
      keySecret: "your_razorpay_key_secret",
      apiUrl: "https://api.razorpay.com/v1"
    }
  },

  // Google Services
  google: {
    mapsApiKey: "your_google_maps_api_key",
    placesApiKey: "your_google_places_api_key",
    analyticsId: "your_ga_id",
    tagManagerId: "your_gtm_id"
  },

  // External APIs
  apis: {
    openWeather: "your_openweather_api_key"
  },

  // Feature Flags
  features: {
    enablePayments: true,
    enableAnalytics: true,
    enablePWA: true,
    enableOfflineMode: true
  },

  // Development
  development: {
    debugMode: false,
    logLevel: "info"
  }
};

export default config;








