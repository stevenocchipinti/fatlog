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

import useLocalStorage from "./useLocalStorage"

import type { BodyMetricDataPoint, NewBodyMetricDataPoint } from "@/types"
import type { User } from "firebase/auth"
import type { ReactNode } from "react"

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

type FirebaseCheckin = Record<string, string | number>
const parseCheckin = (id: string, record: FirebaseCheckin) => {
  return {
    id,
    createdAt: new Date(record.createdAt),
    weight: +record.weight,
    fat: +record.fat,
    waist: +record.waist,
  } as BodyMetricDataPoint
}

type AuthState =
  | "INITIALIZING"
  | "CACHED"
  | "LOADING"
  | "LOGGED_OUT"
  | "LOGGED_IN"
type CheckinsState = "INITIALIZING" | "LOADED"

export type AuthContext = {
  login: () => void
  logout: () => Promise<void>
  user: User | null
  state: AuthState
}

export type CheckinsContext = {
  data: BodyMetricDataPoint[]
  state: CheckinsState
}

export type FirebaseContext = {
  auth: AuthContext
  checkins: CheckinsContext
}
const FirebaseContext = createContext<FirebaseContext | null>(null)

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const provider = new GoogleAuthProvider()

  const [cachedUid, setCachedUid, clearCachedUid] = useLocalStorage<
    string | null
  >("user", null)
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>(
    cachedUid ? "CACHED" : "INITIALIZING",
  )

  const [checkinsState, setCheckinsState] =
    useState<CheckinsState>("INITIALIZING")
  const [checkins, setCheckins] = useLocalStorage<BodyMetricDataPoint[]>(
    "checkinData",
    [],
    x =>
      (x as Record<string, string>[]).map(
        v =>
          ({
            ...v,
            createdAt: new Date(v.createdAt),
          }) as BodyMetricDataPoint,
      ),
  )

  const login = () => {
    setAuthState("LOADING")
    signInWithRedirect(auth, provider).catch(() => {
      setAuthState("LOGGED_OUT")
    })
  }

  const logout = () => signOut(auth)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, fb_user => {
      if (fb_user) {
        setAuthState("LOGGED_IN")
        setUser(fb_user)
        setCachedUid(fb_user.uid)
      } else {
        setAuthState("LOGGED_OUT")
        setUser(null)
        clearCachedUid()
      }
    })
    return unsubscribeAuth
  }, [clearCachedUid, setCachedUid])

  useEffect(() => {
    if (!user) return
    return onValue(ref(db, `/checkins/${user.uid}`), snapshot => {
      setCheckinsState("LOADED")
      const val = snapshot.val() as Record<string, FirebaseCheckin> | null

      setCheckins(
        val
          ? Object.entries(val).map(([id, value]) => parseCheckin(id, value))
          : [],
      )
    })
  }, [setCheckins, user])

  return (
    <FirebaseContext.Provider
      value={{
        auth: { login, logout, user, state: authState },
        checkins: { data: checkins, state: checkinsState },
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
    checkins: { data, state },
  } = context

  return {
    checkins: data,
    state,

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
