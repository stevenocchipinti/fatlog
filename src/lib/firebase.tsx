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
  remove,
  set,
} from "firebase/database"
import { createContext, useContext, useEffect, useState } from "react"

import type { User } from "firebase/auth"
import type { ReactNode } from "react"
import type { NewBodyMetricDataPoint, BodyMetricDataPoint } from "@/types"

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

export interface FirebaseContext {
  auth: AuthContext
  checkins: {
    data: BodyMetricDataPoint[]
  }
}
const FirebaseContext = createContext<FirebaseContext | null>(null)

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const provider = new GoogleAuthProvider()

  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>("LOGGED_OUT")
  const [checkins, setCheckins] = useState<BodyMetricDataPoint[]>([])

  const login = () => {
    setAuthState("LOADING")
    signInWithRedirect(auth, provider)
  }

  const logout = () => signOut(auth)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, fb_user => {
      if (fb_user) {
        setAuthState("LOGGED_IN")
        setUser(fb_user)
      } else {
        setAuthState("LOGGED_OUT")
        setUser(null)
      }
    })
    return unsubscribeAuth
  }, [])

  useEffect(() => {
    if (!user) return
    return onValue(ref(db, `/checkins/${user.uid}`), snapshot => {
      const val = snapshot.val() as Record<
        string,
        Record<string, string | number>
      > | null

      setCheckins(
        val
          ? Object.entries(val).map(([key, value]) => ({
              id: key,
              createdAt: new Date(value.createdAt),
              weight: +value.weight,
              fat: +value.fat,
              waist: +value.waist,
            }))
          : [],
      )
    })
  }, [user])

  return (
    <FirebaseContext.Provider
      value={{
        auth: { login, logout, user, state: authState },
        checkins: { data: checkins },
      }}
    >
      {authState === "LOADING" ? <div>Logging you in...</div> : children}
    </FirebaseContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(FirebaseContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context.auth
}

export const useCheckins = () => {
  const context = useContext(FirebaseContext)
  if (!context)
    throw new Error("useCheckins must be used within a FirebaseProvider")

  const {
    auth: { user },
    checkins: { data },
  } = context

  return {
    checkins: data,

    addCheckin: (checkin: NewBodyMetricDataPoint) => {
      if (!user) return false
      const newCheckinRef = push(ref(db, `/checkins/${user.uid}`))
      return set(newCheckinRef, {
        createdAt: checkin.createdAt.toISOString(),
        weight: checkin.weight,
        fat: checkin.fat,
        waist: checkin.waist,
      })
    },

    deleteCheckin: (checkinKey: string) => {
      return remove(ref(db, `/checkins/${user?.uid}/${checkinKey}`))
    },
  }
}
