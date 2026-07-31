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

import type {
  BodyMetricDataPoint,
  DietException,
  DietRule,
  FoodGroup,
  NewBodyMetricDataPoint,
  NewDietException,
  NewDietRule,
  NewFoodGroup,
} from "@/types"
import type { User } from "firebase/auth"
import type { ReactNode } from "react"
import FullScreenLoading from "@/components/FullScreenLoading"

const firebaseConfig = {
  apiKey: "AIzaSyCyYXcQs1e2hnLKYwInQ_78EIJJcFSN25Y",
  authDomain: import.meta.env.VITE_AUTH_DOMAIN ?? "fatlog.web.app",
  databaseURL: "https://fatlog-app.firebaseio.com",
  projectId: "fatlog-app",
  storageBucket: "fatlog-app.appspot.com",
  messagingSenderId: "893039177685",
  appId: "1:893039177685:web:6663b406d4ca051cc7175c",
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

// Diet records are stored per user alongside checkins. Unlike checkins, which
// use ISO timestamps, diet records store local date-only strings so they are
// persisted exactly as the user recorded them (see lib/localDate.ts).

type FirebaseFoodGroup = {
  emoji: string
  name: string
  order?: number
  archived?: boolean
}
const parseFoodGroup = (id: string, record: FirebaseFoodGroup): FoodGroup => ({
  id,
  emoji: record.emoji,
  name: record.name,
  order: record.order ?? 0,
  archived: record.archived ?? false,
})

type FirebaseDietRule = {
  foodGroupId: string
  startDate: string
  endDate?: string
  note?: string
}
const parseDietRule = (id: string, record: FirebaseDietRule): DietRule => ({
  id,
  foodGroupId: record.foodGroupId,
  startDate: record.startDate,
  ...(record.endDate ? { endDate: record.endDate } : {}),
  ...(record.note ? { note: record.note } : {}),
})

type FirebaseDietException = {
  foodGroupId: string
  date: string
  note?: string
}
const parseDietException = (
  id: string,
  record: FirebaseDietException,
): DietException => ({
  id,
  foodGroupId: record.foodGroupId,
  date: record.date,
  ...(record.note ? { note: record.note } : {}),
})

type AuthState = "INITIALIZING" | "LOADING" | "LOGGED_OUT" | "LOGGED_IN"
type CheckinsState = "INITIALIZING" | "LOADED"
type DietState = "INITIALIZING" | "LOADED"

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

export type DietContext = {
  foodGroups: FoodGroup[]
  rules: DietRule[]
  exceptions: DietException[]
  state: DietState
}

export type FirebaseContext = {
  auth: AuthContext
  checkins: CheckinsContext
  diet: DietContext
}
const FirebaseContext = createContext<FirebaseContext | null>(null)

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const provider = new GoogleAuthProvider()

  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useLocalStorage<AuthState>(
    "authState",
    "INITIALIZING",
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

  const [dietState, setDietState] = useState<DietState>("INITIALIZING")
  const [foodGroups, setFoodGroups] = useLocalStorage<FoodGroup[]>(
    "foodGroupData",
    [],
  )
  const [dietRules, setDietRules] = useLocalStorage<DietRule[]>(
    "dietRuleData",
    [],
  )
  const [dietExceptions, setDietExceptions] = useLocalStorage<DietException[]>(
    "dietExceptionData",
    [],
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
      } else {
        setAuthState("LOGGED_OUT")
        setUser(null)
      }
    })
    return unsubscribeAuth
  }, [setAuthState])

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

  // Subscribe to all three diet subtrees. Diet mode only reaches "LOADED" once
  // the food groups subtree has responded, since food groups are the columns
  // every rule and exception hangs off; rules and exceptions can safely stream
  // in afterwards.
  useEffect(() => {
    if (!user) return
    const unsubscribeFoodGroups = onValue(
      ref(db, `/foodGroups/${user.uid}`),
      snapshot => {
        setDietState("LOADED")
        const val = snapshot.val() as Record<string, FirebaseFoodGroup> | null
        setFoodGroups(
          val
            ? Object.entries(val).map(([id, value]) =>
                parseFoodGroup(id, value),
              )
            : [],
        )
      },
    )
    const unsubscribeRules = onValue(
      ref(db, `/dietRules/${user.uid}`),
      snapshot => {
        const val = snapshot.val() as Record<string, FirebaseDietRule> | null
        setDietRules(
          val
            ? Object.entries(val).map(([id, value]) => parseDietRule(id, value))
            : [],
        )
      },
    )
    const unsubscribeExceptions = onValue(
      ref(db, `/dietExceptions/${user.uid}`),
      snapshot => {
        const val = snapshot.val() as Record<
          string,
          FirebaseDietException
        > | null
        setDietExceptions(
          val
            ? Object.entries(val).map(([id, value]) =>
                parseDietException(id, value),
              )
            : [],
        )
      },
    )
    return () => {
      unsubscribeFoodGroups()
      unsubscribeRules()
      unsubscribeExceptions()
    }
  }, [setFoodGroups, setDietRules, setDietExceptions, user])

  return (
    <FirebaseContext.Provider
      value={{
        auth: { login, logout, user, state: authState },
        checkins: { data: checkins, state: checkinsState },
        diet: {
          foodGroups,
          rules: dietRules,
          exceptions: dietExceptions,
          state: dietState,
        },
      }}
    >
      {authState === "LOADING" ? (
        <FullScreenLoading>Logging you in...</FullScreenLoading>
      ) : (
        children
      )}
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

    updateCheckin: (checkinKey: string, checkin: NewBodyMetricDataPoint) => {
      if (!user) return false
      return set(ref(db, `/checkins/${user.uid}/${checkinKey}`), {
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

// Firebase Realtime Database rejects `undefined` values, so optional fields
// (endDate, note) must be omitted entirely rather than written as undefined.
const stripUndefined = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  )

/**
 * Read/write access to a user's diet data: food groups, diet rules and diet
 * exceptions. Mirrors the shape and conventions of useCheckins.
 */
export const useDiet = () => {
  const context = useContext(FirebaseContext)
  if (!context)
    throw new Error("useDiet must be used within a FirebaseProvider")

  const {
    auth: { user },
    diet: { foodGroups, rules, exceptions, state },
  } = context

  return {
    foodGroups,
    rules,
    exceptions,
    state,

    addFoodGroup: (foodGroup: NewFoodGroup) => {
      if (!user) return false
      const newRef = push(ref(db, `/foodGroups/${user.uid}`))
      return set(newRef, stripUndefined({ ...foodGroup }))
    },
    updateFoodGroup: (id: string, foodGroup: NewFoodGroup) => {
      if (!user) return false
      return set(
        ref(db, `/foodGroups/${user.uid}/${id}`),
        stripUndefined({ ...foodGroup }),
      )
    },
    deleteFoodGroup: (id: string) => {
      return remove(ref(db, `/foodGroups/${user?.uid}/${id}`))
    },

    addRule: (rule: NewDietRule) => {
      if (!user) return false
      const newRef = push(ref(db, `/dietRules/${user.uid}`))
      return set(newRef, stripUndefined({ ...rule }))
    },
    updateRule: (id: string, rule: NewDietRule) => {
      if (!user) return false
      return set(
        ref(db, `/dietRules/${user.uid}/${id}`),
        stripUndefined({ ...rule }),
      )
    },
    deleteRule: (id: string) => {
      return remove(ref(db, `/dietRules/${user?.uid}/${id}`))
    },

    addException: (exception: NewDietException) => {
      if (!user) return false
      const newRef = push(ref(db, `/dietExceptions/${user.uid}`))
      return set(newRef, stripUndefined({ ...exception }))
    },
    updateException: (id: string, exception: NewDietException) => {
      if (!user) return false
      return set(
        ref(db, `/dietExceptions/${user.uid}/${id}`),
        stripUndefined({ ...exception }),
      )
    },
    deleteException: (id: string) => {
      return remove(ref(db, `/dietExceptions/${user?.uid}/${id}`))
    },
  }
}
