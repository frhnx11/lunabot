import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

interface UserProfile {
  name: string
  occupation: string
  personality: string
  interests: string[]
  lookingFor: string
  additionalInfo: string
  completedOnboarding: boolean
}

interface UserData {
  name: string
  email: string
  credits: number
  createdAt: unknown
  profile?: UserProfile
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  isNewUser: boolean
  needsOnboarding: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  saveUserName: (name: string) => Promise<void>
  saveProfile: (profile: UserProfile) => Promise<void>
  deductCredit: () => Promise<boolean>
  refreshCredits: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Check if user exists in Firestore
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData
          // Handle existing users who don't have credits field
          if (data.credits === undefined) {
            data.credits = 10 // Give existing users 10 free credits
            await updateDoc(userDocRef, { credits: 10 })
          }
          setUserData(data)
          setIsNewUser(false)
          // Check if onboarding is needed
          setNeedsOnboarding(!data.profile?.completedOnboarding)
        } else {
          // New user - needs onboarding
          setIsNewUser(true)
          setNeedsOnboarding(true)
          setUserData(null)
        }
      } else {
        setUserData(null)
        setIsNewUser(false)
        setNeedsOnboarding(false)
      }

      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const saveUserName = async (name: string) => {
    if (!user) return

    const userDocRef = doc(db, 'users', user.uid)
    const newUserData: UserData = {
      name,
      email: user.email || '',
      credits: 10, // 10 free credits for new users
      createdAt: serverTimestamp()
    }

    await setDoc(userDocRef, newUserData)
    setUserData(newUserData)
    setIsNewUser(false)
  }

  const saveProfile = async (profile: UserProfile) => {
    if (!user) return

    const userDocRef = doc(db, 'users', user.uid)

    if (isNewUser) {
      // New user - create document with profile
      const newUserData: UserData = {
        name: profile.name,
        email: user.email || '',
        credits: 10,
        createdAt: serverTimestamp(),
        profile
      }
      await setDoc(userDocRef, newUserData)
      setUserData(newUserData)
      setIsNewUser(false)
    } else {
      // Existing user - update profile
      await updateDoc(userDocRef, {
        name: profile.name,
        profile
      })
      setUserData(prev => prev ? { ...prev, name: profile.name, profile } : null)
    }

    setNeedsOnboarding(false)
  }

  const deductCredit = async (): Promise<boolean> => {
    if (!user || !userData || userData.credits <= 0) return false

    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, {
        credits: increment(-1)
      })
      // Update local state
      setUserData(prev => prev ? { ...prev, credits: prev.credits - 1 } : null)
      return true
    } catch (error) {
      console.error('Error deducting credit:', error)
      return false
    }
  }

  const refreshCredits = async () => {
    if (!user) return

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData)
      }
    } catch (error) {
      console.error('Error refreshing credits:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      isNewUser,
      needsOnboarding,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout,
      saveUserName,
      saveProfile,
      deductCredit,
      refreshCredits
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
