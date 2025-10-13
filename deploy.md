# Kerala Horizon - Deployment Guide

## 🚀 Firebase Deployment Instructions

### Prerequisites
1. Node.js 16+ installed
2. Firebase CLI installed: `npm install -g firebase-tools`
3. Firebase project created at https://console.firebase.google.com

### Step 1: Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select the following services:
# - Hosting: Configure files for Firebase Hosting
# - Firestore: Configure security rules and indexes files
# - Functions: Configure a Cloud Functions directory (optional)

# When prompted:
# - Use existing project: Select your Firebase project
# - Public directory: build
# - Single-page app: Yes
# - Overwrite index.html: No
```

### Step 2: Configure Firebase Services

#### Enable Authentication
1. Go to Firebase Console > Authentication
2. Click "Get Started"
3. Go to "Sign-in method" tab
4. Enable:
   - Email/Password
   - Google

#### Enable Firestore
1. Go to Firebase Console > Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (rules will be applied from firestore.rules)
4. Select a location (choose closest to your users)

#### Enable Storage (Optional)
1. Go to Firebase Console > Storage
2. Click "Get Started"
3. Choose "Start in test mode"

### Step 3: Update Firebase Configuration
Update `src/firebase.js` with your project's configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

### Step 4: Build and Deploy
```bash
# Build the application
npm run build

# Deploy to Firebase Hosting
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### Step 5: Verify Deployment
1. Visit your Firebase Hosting URL
2. Test authentication (sign up/sign in)
3. Test all features and modules
4. Verify Firestore data is being saved

## 🔧 Environment Variables (Optional)

Create a `.env` file for sensitive configuration:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 📱 PWA Features

The app includes:
- Service Worker for offline functionality
- Web App Manifest for installability
- Responsive design for mobile devices
- Push notification support (ready for implementation)

## 🔒 Security

- Firestore rules configured for user data protection
- Authentication required for user-specific features
- HTTPS enforced by Firebase Hosting
- CORS configured for API calls

## 📊 Analytics

Firebase Analytics is integrated and will track:
- User engagement
- Feature usage
- Performance metrics
- Custom events

## 🚨 Monitoring

Set up monitoring for:
- Firebase Performance Monitoring
- Firebase Crashlytics
- Firebase Remote Config for feature flags

## 🔄 CI/CD (Optional)

For automated deployment, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    - name: Install dependencies
      run: npm install
    - name: Build
      run: npm run build
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: your-project-id
```

## 🎯 Post-Deployment Checklist

- [ ] Authentication working
- [ ] All modules functional
- [ ] Real-time data loading
- [ ] Mobile responsiveness
- [ ] Offline functionality
- [ ] Performance optimized
- [ ] Analytics tracking
- [ ] Error monitoring
- [ ] Security rules applied
- [ ] SSL certificate active

## 📞 Support

For deployment issues:
1. Check Firebase Console for errors
2. Review browser console for client-side errors
3. Check Firebase Functions logs (if using)
4. Verify Firestore rules and indexes
5. Test in incognito mode for cache issues

## 🔄 Updates

To update the deployed app:
```bash
npm run build
firebase deploy
```

The app will be updated immediately with zero downtime.

