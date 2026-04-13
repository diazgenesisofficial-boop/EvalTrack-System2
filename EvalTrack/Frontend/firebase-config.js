// Firebase Configuration for EvalTrack
// IMPORTANT: Replace with your NEW Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your Apps

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfMBoYqOXmobanGUOBRE5u5tnrrbGuq_0",
  authDomain: "evaltrack-system-f04d3.firebaseapp.com",
  projectId: "evaltrack-system-f04d3",
  storageBucket: "evaltrack-system-f04d3.firebasestorage.app",
  messagingSenderId: "558838852861",
  appId: "1:558838852861:web:1f4e8f789adbb90b792294",
  measurementId: "G-V8XT69MX4K"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log('Firebase initialized for EvalTrack (New Project)');
