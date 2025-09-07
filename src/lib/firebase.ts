// Import the functions you need from the SDKs you need
import { initializeApp }from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "league-auctioneer-ogeov",
  "appId": "1:686158380439:web:021d3257c15fb56d7298d2",
  "storageBucket": "league-auctioneer-ogeov.firebasestorage.app",
  "apiKey": "AIzaSyDTMcQK0TIGm0z3wicyjn_93XpTR5LNXK4",
  "authDomain": "league-auctioneer-ogeov.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "686158380439"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
