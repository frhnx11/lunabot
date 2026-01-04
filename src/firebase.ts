import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCVULsbfq8feirRZao1kJMP41qtNopsx6Q",
  authDomain: "casanaai.firebaseapp.com",
  projectId: "casanaai",
  storageBucket: "casanaai.firebasestorage.app",
  messagingSenderId: "706278978066",
  appId: "1:706278978066:web:131eaf54b209b5fa399ecb",
  measurementId: "G-VVKVX9V410"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
