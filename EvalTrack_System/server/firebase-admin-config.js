// Firebase Admin SDK Configuration for EvalTrack Backend
// IMPORTANT: This is for your NEW Firebase project

let admin = null;
let firebaseInitialized = false;
let auth = null;
let firestore = null;
let storage = null;
let firebaseAdmin = {};

try {
  // Try to load Firebase Admin module
  admin = require('firebase-admin');
  
  // Firebase service account configuration
  // Get this from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
  // Save it as firebase-service-account.json in this directory
  
  try {
    // Try to load service account key from environment variable (for Render deployment)
    let serviceAccount;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        // Check if it's base64 encoded (long string without spaces)
        const envValue = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        if (envValue.length > 100 && !envValue.includes(' ')) {
          // Likely base64 encoded
          const decoded = Buffer.from(envValue, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
          console.log('Firebase Admin: Loaded from FIREBASE_SERVICE_ACCOUNT env var (base64 decoded)');
        } else {
          // Plain JSON
          serviceAccount = JSON.parse(envValue);
          console.log('Firebase Admin: Loaded from FIREBASE_SERVICE_ACCOUNT environment variable');
        }
      } catch (envError) {
        console.log('Firebase Admin: Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', envError.message);
      }
    }
    
    // Fall back to file if env var not set
    if (!serviceAccount) {
      serviceAccount = require('./firebase-service-account.json');
      console.log('Firebase Admin: Loaded from firebase-service-account.json file');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
    });
    
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully (New Project)');
    
    // Get Firebase services
    auth = admin.auth();
    firestore = admin.firestore();
    storage = admin.storage();
    
  } catch (error) {
    console.log('Firebase Admin SDK not initialized:', error.message);
    console.log('To enable Firebase Admin:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Click "Generate New Private Key"');
    console.log('3. Save the JSON file as firebase-service-account.json in server directory');
  }
  
  // Firebase Admin helper functions
  firebaseAdmin = {
    isInitialized: () => firebaseInitialized,
    
    // Verify Firebase ID token from frontend
    verifyToken: async (idToken) => {
      if (!firebaseInitialized || !auth) {
        throw new Error('Firebase Admin not initialized');
      }
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken;
      } catch (error) {
        console.error('Token verification failed:', error);
        throw error;
      }
    },
    
    // Get user by UID
    getUser: async (uid) => {
      if (!firebaseInitialized || !auth) return null;
      try {
        const userRecord = await auth.getUser(uid);
        return userRecord;
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    
    // Create or update user in Firestore
    syncUserToFirestore: async (userId, userData) => {
      if (!firebaseInitialized || !firestore) return false;
      try {
        const userRef = firestore.collection('users').doc(userId);
        await userRef.set({
          ...userData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
      } catch (error) {
        console.error('Error syncing user to Firestore:', error);
        return false;
      }
    },
    
    // Get document from Firestore
    getDocument: async (collection, docId) => {
      if (!firebaseInitialized || !firestore) return null;
      try {
        const docRef = firestore.collection(collection).doc(docId);
        const docSnap = await docRef.get();
        return docSnap.exists ? docSnap.data() : null;
      } catch (error) {
        console.error('Error fetching document:', error);
        return null;
      }
    },
    
    // Query Firestore collection
    queryCollection: async (collection, conditions = [], limitCount = 100) => {
      if (!firebaseInitialized || !firestore) return [];
      try {
        let query = firestore.collection(collection);
        
        conditions.forEach(condition => {
          const { field, operator, value } = condition;
          query = query.where(field, operator, value);
        });
        
        query = query.limit(limitCount);
        const snapshot = await query.get();
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error querying collection:', error);
        return [];
      }
    },
    
    // Save data to Firestore
    saveDocument: async (collection, docId, data) => {
      if (!firebaseInitialized || !firestore) return false;
      try {
        const docRef = firestore.collection(collection).doc(docId);
        await docRef.set({
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
      } catch (error) {
        console.error('Error saving document:', error);
        return false;
      }
    },
    
    // Delete document from Firestore
    deleteDocument: async (collection, docId) => {
      if (!firebaseInitialized || !firestore) return false;
      try {
        await firestore.collection(collection).doc(docId).delete();
        return true;
      } catch (error) {
        console.error('Error deleting document:', error);
        return false;
      }
    }
  };
  
} catch (moduleError) {
  // firebase-admin module not installed
  console.log('Firebase Admin module not installed:', moduleError.message);
  console.log('Install with: npm install firebase-admin');
  
  // Create stub functions that return appropriate defaults
  firebaseAdmin = {
    isInitialized: () => false,
    verifyToken: async () => { throw new Error('Firebase Admin not installed'); },
    getUser: async () => null,
    syncUserToFirestore: async () => false,
    getDocument: async () => null,
    queryCollection: async () => [],
    saveDocument: async () => false,
    deleteDocument: async () => false
  };
}

module.exports = {
  admin,
  auth,
  firestore,
  storage,
  firebaseAdmin,
  firebaseInitialized
};
