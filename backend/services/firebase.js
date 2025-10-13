const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');

// Firebase Admin SDK configuration
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

// Initialize Firebase Admin
let adminApp;
let db;
let storage;
let auth;

const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    } else {
      adminApp = admin.app();
    }

    db = admin.firestore();
    storage = admin.storage();
    auth = admin.auth();

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
  }
};

// Firestore collections
const COLLECTIONS = {
  USERS: 'users',
  TRANSPORT: 'transport',
  ACCOMMODATIONS: 'accommodations',
  RESTAURANTS: 'restaurants',
  CULTURAL_SITES: 'cultural_sites',
  SUSTAINABILITY: 'sustainability',
  COMMUNITY: 'community',
  TRIP_PLANS: 'trip_plans',
  EMERGENCIES: 'emergencies',
  SHOPPING: 'shopping',
  WALLET: 'wallet',
  NOTIFICATIONS: 'notifications',
  REVIEWS: 'reviews',
  BOOKINGS: 'bookings'
};

// Database helper functions
const getCollection = (collectionName) => {
  return db.collection(collectionName);
};

const addDocument = async (collectionName, data, docId = null) => {
  try {
    const collection = getCollection(collectionName);
    const docRef = docId ? collection.doc(docId) : collection.doc();
    
    const docData = {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

const getDocument = async (collectionName, docId) => {
  try {
    const doc = await getCollection(collectionName).doc(docId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = getCollection(collectionName).doc(docId);
    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.update(updateData);
    return { id: docId, ...updateData };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

const deleteDocument = async (collectionName, docId) => {
  try {
    await getCollection(collectionName).doc(docId).delete();
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

const queryDocuments = async (collectionName, conditions = [], orderBy = null, limit = null) => {
  try {
    let query = getCollection(collectionName);

    // Apply conditions
    conditions.forEach(condition => {
      query = query.where(condition.field, condition.operator, condition.value);
    });

    // Apply ordering
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    return documents;
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    throw error;
  }
};

// Storage helper functions
const uploadFile = async (bucketName, fileName, fileBuffer, metadata = {}) => {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.save(fileBuffer, {
      metadata: {
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly accessible
    await file.makePublic();

    return {
      name: fileName,
      publicUrl: `https://storage.googleapis.com/${bucketName}/${fileName}`,
      metadata: await file.getMetadata()
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

const deleteFile = async (bucketName, fileName) => {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    await file.delete();
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Authentication helper functions
const verifyToken = async (token) => {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
};

const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  adminApp,
  db,
  storage,
  auth,
  COLLECTIONS,
  getCollection,
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  uploadFile,
  deleteFile,
  verifyToken,
  createCustomToken
};







