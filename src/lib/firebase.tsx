import { initializeApp } from "firebase/app"
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
} from "firebase/auth"
import {
  connectDatabaseEmulator,
  getDatabase,
  onValue,
  push,
  ref,
  set,
} from "firebase/database"
import { createContext, useContext, useEffect, useState } from "react"

import type { User } from "firebase/auth"
import type { ReactNode } from "react"
import type { UserCheckin } from "@/types"

const firebaseConfig = {
  apiKey: "AIzaSyCyYXcQs1e2hnLKYwInQ_78EIJJcFSN25Y",
  authDomain: "bodymetrics.web.app",
  databaseURL: "https://fatlog-app.firebaseio.com",
  projectId: "fatlog-app",
  storageBucket: "fatlog-app.appspot.com",
  messagingSenderId: "893039177685",
  appId: "1:893039177685:web:b2d4cae60f09a1f5c7175c",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getDatabase(app)

if (import.meta.env.DEV) {
  import("firebase/auth").then(({ connectAuthEmulator }) => {
    connectAuthEmulator(auth, "http://localhost:9099")
    connectDatabaseEmulator(db, "localhost", 9000)
  })
}

type AuthState = "LOGGED_OUT" | "LOGGED_IN" | "LOADING"

export interface AuthContext {
  login: () => void
  logout: () => Promise<void>
  user: User | null
  state: AuthState
}
const AuthContext = createContext<AuthContext | null>(null)

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const provider = new GoogleAuthProvider()

  const [user, setUser] = useState<User | null>(null)
  const [state, setState] = useState<AuthState>("LOGGED_OUT")

  const login = () => {
    setState("LOADING")
    signInWithRedirect(auth, provider)
  }

  const logout = () => signOut(auth)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, fb_user => {
      if (fb_user) {
        setState("LOGGED_IN")
        setUser(fb_user)
      } else {
        setState("LOGGED_OUT")
        setUser(null)
      }
    })
    return unsubscribeAuth
  }, [])

  return (
    <AuthContext.Provider value={{ login, logout, user, state }}>
      {state === "LOADING" ? <div>Logging you in...</div> : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

export const useCheckins = (cb?: (v: any) => void) => {
  const { user } = useAuth()

  useEffect(() => {
    if (!user || !cb) return
    return onValue(ref(db, `/checkins/${user.uid}`), snapshot =>
      cb(snapshot.val()),
    )
  }, [user, cb])

  return {
    addCheckin: (checkin: UserCheckin) => {
      if (!user) return false
      const newCheckinRef = push(ref(db, `/checkins/${user.uid}`))
      return set(newCheckinRef, {
        createdAt: checkin.date.toISOString(),
        weight: checkin.weight,
        fat: checkin.fat,
        waist: checkin.waist,
      })
    },

    // deleteCheckin: checkinKey => {
    //   if (!backend.currentUser()) return false
    //   return backend.checkinsRef().child(checkinKey).remove()
    // },
  }
}
