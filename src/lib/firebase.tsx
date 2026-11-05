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
  equalTo,
  get,
  getDatabase,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  set,
  update,
} from "firebase/database"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import useLocalStorage from "./useLocalStorage"
import { parseBowelMovement, toBowelMovementRecord } from "./bowelMovements"
import {
  parseEnabledTrackers,
  profileSetupUpdate,
  resolveActiveProfileId,
} from "./profiles"

import { TRACKER_IDS } from "./trackers"
import type { StoredBowelMovement } from "./bowelMovements"
import type {
  BodyMetricDataPoint,
  BowelMovement,
  DietException,
  DietRule,
  FoodGroup,
  NewBodyMetricDataPoint,
  NewBowelMovement,
  NewDietException,
  NewDietRule,
  NewFoodGroup,
} from "@/types"
import type { Profile, StoredTrackers } from "./profiles"
import type { TrackerId } from "./trackers"
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

// Diet records are stored per profile alongside checkins. Unlike checkins, which
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

type FirebaseProfile = {
  owner: string
  name: string
  emoji?: string
  trackers?: StoredTrackers
  archived?: boolean
}
const parseProfile = (id: string, record: FirebaseProfile): Profile => ({
  id,
  name: record.name,
  ...(record.emoji ? { emoji: record.emoji } : {}),
  enabledTrackers: parseEnabledTrackers(record.trackers),
  archived: record.archived ?? false,
})

type AuthState = "INITIALIZING" | "LOADING" | "LOGGED_OUT" | "LOGGED_IN"
type ProfilesState = "INITIALIZING" | "LOADED"
type LoadState = "INITIALIZING" | "LOADED"
type DietState = LoadState

export type AuthContext = {
  login: () => void
  logout: () => Promise<void>
  user: User | null
  state: AuthState
}

export type ProfileChanges = {
  name: string
  emoji?: string
  enabledTrackers: TrackerId[]
}

export type ProfilesContext = {
  state: ProfilesState
  /** The account's profiles, archived ones included. */
  profiles: Profile[]
  /** The profile being viewed and recorded against; null until known. */
  activeProfile: Profile | null
  setActiveProfileId: (id: string) => void
  addProfile: (profile: { name: string; emoji?: string }) => string | null
  updateProfile: (id: string, changes: ProfileChanges) => void
  setProfileArchived: (id: string, archived: boolean) => void
}

export type CheckinsContext = {
  data: BodyMetricDataPoint[]
  state: LoadState
}

export type BowelMovementsContext = {
  data: BowelMovement[]
  state: LoadState
}

export type DietContext = {
  foodGroups: FoodGroup[]
  rules: DietRule[]
  exceptions: DietException[]
  state: DietState
}

type AccountContext = {
  auth: AuthContext
  profiles: ProfilesContext
}
const AccountContext = createContext<AccountContext | null>(null)

type ProfileDataContext = {
  /** The profile these observations belong to; null until it is known. */
  profileId: string | null
  checkins: CheckinsContext
  bowelMovements: BowelMovementsContext
  diet: DietContext & {
    setFoodGroups: (fn: (prev: FoodGroup[]) => FoodGroup[]) => void
    setDietRules: (fn: (prev: DietRule[]) => DietRule[]) => void
    setDietExceptions: (fn: (prev: DietException[]) => DietException[]) => void
  }
}
const ProfileDataContext = createContext<ProfileDataContext | null>(null)

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const provider = new GoogleAuthProvider()

  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useLocalStorage<AuthState>(
    "authState",
    "INITIALIZING",
  )

  const [storedProfiles, setStoredProfiles] = useState<Profile[] | null>(null)
  const [rememberedId, setRememberedId] = useLocalStorage<string | null>(
    "activeProfileId",
    null,
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
        setStoredProfiles(null)
      }
    })
    return unsubscribeAuth
  }, [setAuthState])

  // An account can only list profiles it owns, so the query must say so (the
  // database rules require exactly this query).
  const uid = user?.uid
  useEffect(() => {
    if (!uid) return
    return onValue(
      query(ref(db, "/profiles"), orderByChild("owner"), equalTo(uid)),
      snapshot => {
        const val = snapshot.val() as Record<string, FirebaseProfile> | null
        setStoredProfiles(
          val
            ? Object.entries(val).map(([id, value]) => parseProfile(id, value))
            : [],
        )
      },
    )
  }, [uid])

  // The account holder's own profile (ID = uid, see ADR 0001) is created
  // lazily the first time they load the app. Existing data already lives under
  // their uid, so starters are only added if they have no food groups at all.
  const displayName = user?.displayName
  const settingUpOwnProfile = useRef<string | null>(null)
  useEffect(() => {
    if (!uid || !storedProfiles) return
    if (storedProfiles.some(profile => profile.id === uid)) return
    if (settingUpOwnProfile.current === uid) return
    settingUpOwnProfile.current = uid
    get(ref(db, `/foodGroups/${uid}`))
      .then(snapshot =>
        update(
          ref(db),
          profileSetupUpdate({
            profileId: uid,
            owner: uid,
            name: displayName || "Me",
            includeStarters: !snapshot.exists(),
          }),
        ),
      )
      .catch(error => {
        settingUpOwnProfile.current = null
        console.warn("Could not set up the account's own profile", error)
      })
  }, [uid, storedProfiles, displayName])

  // Until the own profile's record exists it still has to be usable, so it is
  // synthesized from the Google account.
  const profiles = useMemo(() => {
    if (!uid || !storedProfiles) return []
    return storedProfiles.some(profile => profile.id === uid)
      ? storedProfiles
      : [
          {
            id: uid,
            name: displayName || "Me",
            enabledTrackers: parseEnabledTrackers(undefined),
            archived: false,
          },
          ...storedProfiles,
        ]
  }, [uid, displayName, storedProfiles])

  const activeProfileId =
    uid && storedProfiles
      ? resolveActiveProfileId(uid, rememberedId, profiles)
      : null
  const activeProfile =
    profiles.find(profile => profile.id === activeProfileId) ?? null

  const addProfile = useCallback(
    ({ name, emoji }: { name: string; emoji?: string }) => {
      if (!uid) return null
      const id = push(ref(db, "/profiles")).key
      if (!id) return null
      update(
        ref(db),
        profileSetupUpdate({
          profileId: id,
          owner: uid,
          name,
          emoji,
          includeStarters: true,
        }),
      ).catch(error => console.warn("Could not add the profile", error))
      return id
    },
    [uid],
  )

  const updateProfile = useCallback(
    (id: string, { name, emoji, enabledTrackers }: ProfileChanges) => {
      if (!uid) return
      // Per-field paths leave `archived` untouched. Re-stating the owner (as
      // the account itself, the only value the rules accept) keeps a record
      // valid even if the own profile hasn't been created yet.
      update(ref(db), {
        [`profiles/${id}/name`]: name,
        [`profiles/${id}/emoji`]: emoji || null,
        [`profiles/${id}/trackers`]: Object.fromEntries(
          TRACKER_IDS.map(trackerId => [
            trackerId,
            enabledTrackers.includes(trackerId),
          ]),
        ),
        [`profiles/${id}/owner`]: uid,
      }).catch(error => console.warn("Could not update the profile", error))
    },
    [uid],
  )

  const setProfileArchived = useCallback(
    (id: string, archived: boolean) => {
      // The account's own profile can't be removed.
      if (id === uid) return
      set(ref(db, `/profiles/${id}/archived`), archived).catch(error =>
        console.warn("Could not archive the profile", error),
      )
    },
    [uid],
  )

  const accountContext: AccountContext = {
    auth: { login, logout, user, state: authState },
    profiles: {
      state: storedProfiles ? "LOADED" : "INITIALIZING",
      profiles,
      activeProfile,
      setActiveProfileId: setRememberedId,
      addProfile,
      updateProfile,
      setProfileArchived,
    },
  }

  return (
    <AccountContext.Provider value={accountContext}>
      {authState === "LOADING" ? (
        <FullScreenLoading>Logging you in...</FullScreenLoading>
      ) : (
        // Keyed by profile so switching starts from that profile's own cached
        // data, never the previous profile's.
        <ProfileDataProvider
          key={activeProfileId ?? "none"}
          profileId={activeProfileId}
        >
          {children}
        </ProfileDataProvider>
      )}
    </AccountContext.Provider>
  )
}

/**
 * Subscribes to one profile's collection at `/<collection>/<profileId>`,
 * parsing each record and caching the result in localStorage (under
 * `<cacheName>:<profileId>`) so the screen has data before the first response.
 * `parse` must be a stable (module-level) function. `reviveCached` rebuilds
 * values that don't survive a JSON round trip, such as Dates.
 */
const useProfileCollection = <TStored, T>({
  collection,
  profileId,
  cacheName,
  parse,
  reviveCached,
}: {
  collection: string
  profileId: string | null
  cacheName: string
  parse: (id: string, record: TStored) => T
  reviveCached?: (item: unknown) => T[]
}) => {
  const [state, setState] = useState<LoadState>("INITIALIZING")
  const [data, setData] = useLocalStorage<T[]>(
    `${cacheName}:${profileId ?? "none"}`,
    [],
    reviveCached,
  )

  useEffect(() => {
    if (!profileId) return
    return onValue(ref(db, `/${collection}/${profileId}`), snapshot => {
      setState("LOADED")
      const val = snapshot.val() as Record<string, TStored> | null
      setData(
        val ? Object.entries(val).map(([id, value]) => parse(id, value)) : [],
      )
    })
  }, [collection, profileId, parse, setData])

  return { data, setData, state }
}

/** Subscribes to one profile's observations. Remount (via key) to switch. */
const ProfileDataProvider = ({
  profileId,
  children,
}: {
  profileId: string | null
  children: ReactNode
}) => {
  const cacheKey = (name: string) => `${name}:${profileId ?? "none"}`

  const checkins = useProfileCollection<FirebaseCheckin, BodyMetricDataPoint>({
    collection: "checkins",
    profileId,
    cacheName: "checkinData",
    parse: parseCheckin,
    reviveCached: x =>
      (x as Record<string, string>[]).map(
        v =>
          ({
            ...v,
            createdAt: new Date(v.createdAt),
          }) as BodyMetricDataPoint,
      ),
  })

  const bowelMovements = useProfileCollection<
    StoredBowelMovement,
    BowelMovement
  >({
    collection: "bowelMovements",
    profileId,
    cacheName: "bowelMovementData",
    parse: parseBowelMovement,
  })

  const [dietState, setDietState] = useState<DietState>("INITIALIZING")
  const [foodGroups, setFoodGroups] = useLocalStorage<FoodGroup[]>(
    cacheKey("foodGroupData"),
    [],
  )
  const [dietRules, setDietRules] = useLocalStorage<DietRule[]>(
    cacheKey("dietRuleData"),
    [],
  )
  const [dietExceptions, setDietExceptions] = useLocalStorage<DietException[]>(
    cacheKey("dietExceptionData"),
    [],
  )

  // Subscribe to all three diet subtrees. Diet mode only reaches "LOADED" once
  // the food groups subtree has responded, since food groups are the columns
  // every rule and exception hangs off; rules and exceptions can safely stream
  // in afterwards.
  useEffect(() => {
    if (!profileId) return
    const unsubscribeFoodGroups = onValue(
      ref(db, `/foodGroups/${profileId}`),
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
      ref(db, `/dietRules/${profileId}`),
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
      ref(db, `/dietExceptions/${profileId}`),
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
  }, [setFoodGroups, setDietRules, setDietExceptions, profileId])

  return (
    <ProfileDataContext.Provider
      value={{
        profileId,
        checkins: { data: checkins.data, state: checkins.state },
        bowelMovements: {
          data: bowelMovements.data,
          state: bowelMovements.state,
        },
        diet: {
          foodGroups,
          rules: dietRules,
          exceptions: dietExceptions,
          state: dietState,
          setFoodGroups,
          setDietRules,
          setDietExceptions,
        },
      }}
    >
      {children}
    </ProfileDataContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AccountContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context.auth
}

export const useProfiles = () => {
  const context = useContext(AccountContext)
  if (!context)
    throw new Error("useProfiles must be used within a FirebaseProvider")
  return context.profiles
}

export const useCheckins = () => {
  const context = useContext(ProfileDataContext)
  if (!context)
    throw new Error("useCheckins must be used within a FirebaseProvider")

  const {
    profileId,
    checkins: { data, state },
  } = context

  return {
    checkins: data,
    state,

    addCheckin: (checkin: NewBodyMetricDataPoint) => {
      if (!profileId) return false
      const newCheckinRef = push(ref(db, `/checkins/${profileId}`))
      return set(newCheckinRef, {
        createdAt: checkin.createdAt.toISOString(),
        weight: checkin.weight,
        fat: checkin.fat,
        waist: checkin.waist,
      })
    },

    updateCheckin: (checkinKey: string, checkin: NewBodyMetricDataPoint) => {
      if (!profileId) return false
      return set(ref(db, `/checkins/${profileId}/${checkinKey}`), {
        createdAt: checkin.createdAt.toISOString(),
        weight: checkin.weight,
        fat: checkin.fat,
        waist: checkin.waist,
      })
    },

    deleteCheckin: (checkinKey: string) => {
      return remove(ref(db, `/checkins/${profileId}/${checkinKey}`))
    },
  }
}

/**
 * Read/write access to the active profile's bowel movements. Like checkins,
 * the realtime subscription updates the list straight away, so writes aren't
 * applied optimistically.
 */
export const useBowelMovements = () => {
  const context = useContext(ProfileDataContext)
  if (!context)
    throw new Error("useBowelMovements must be used within a FirebaseProvider")

  const {
    profileId,
    bowelMovements: { data, state },
  } = context

  return {
    bowelMovements: data,
    state,

    addBowelMovement: (bowelMovement: NewBowelMovement) => {
      if (!profileId) return false
      const newRef = push(ref(db, `/bowelMovements/${profileId}`))
      return set(newRef, toBowelMovementRecord(bowelMovement))
    },

    updateBowelMovement: (id: string, bowelMovement: NewBowelMovement) => {
      if (!profileId) return false
      return set(
        ref(db, `/bowelMovements/${profileId}/${id}`),
        toBowelMovementRecord(bowelMovement),
      )
    },

    deleteBowelMovement: (id: string) => {
      if (!profileId) return false
      return remove(ref(db, `/bowelMovements/${profileId}/${id}`))
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
 * Read/write access to the active profile's diet data: food groups, diet rules and diet
 * exceptions. Mirrors the shape and conventions of useCheckins.
 */
export const useDiet = () => {
  const context = useContext(ProfileDataContext)
  if (!context)
    throw new Error("useDiet must be used within a FirebaseProvider")

  const {
    profileId,
    diet: {
      foodGroups,
      rules,
      exceptions,
      state,
      setFoodGroups,
      setDietRules,
      setDietExceptions,
    },
  } = context

  return {
    foodGroups,
    rules,
    exceptions,
    state,

    addFoodGroup: (foodGroup: NewFoodGroup) => {
      if (!profileId) return false
      const newRef = push(ref(db, `/foodGroups/${profileId}`))
      const id = newRef.key
      const record = stripUndefined({ ...foodGroup })
      // Optimistic: inject immediately so the UI updates regardless of server latency/auth
      setFoodGroups(prev => [...prev, { id, ...foodGroup }])
      return set(newRef, record)
    },
    updateFoodGroup: (id: string, foodGroup: NewFoodGroup) => {
      if (!profileId) return false
      const record = stripUndefined({ ...foodGroup })
      // Optimistic: update immediately so the UI updates regardless of server latency/auth
      setFoodGroups(prev =>
        prev.map(g => (g.id === id ? { ...g, ...foodGroup } : g)),
      )
      return set(ref(db, `/foodGroups/${profileId}/${id}`), record)
    },
    deleteFoodGroup: (id: string) => {
      if (!profileId) return false
      // Optimistic: remove immediately so the UI updates regardless of server latency/auth
      setFoodGroups(prev => prev.filter(g => g.id !== id))
      return remove(ref(db, `/foodGroups/${profileId}/${id}`))
    },

    addRule: (rule: NewDietRule) => {
      if (!profileId) return false
      const newRef = push(ref(db, `/dietRules/${profileId}`))
      const id = newRef.key
      const record = stripUndefined({ ...rule })
      // Optimistic: inject immediately so the UI updates regardless of server latency/auth
      setDietRules(prev => [...prev, { id, ...(record as NewDietRule) }])
      return set(newRef, record)
    },

    updateRule: (id: string, rule: NewDietRule) => {
      if (!profileId) return false
      const record = stripUndefined({ ...rule })
      // Optimistic: update immediately so the UI updates regardless of server latency/auth
      setDietRules(prev =>
        prev.map(r => (r.id === id ? { ...r, ...record } : r)),
      )
      return set(ref(db, `/dietRules/${profileId}/${id}`), record)
    },
    deleteRule: (id: string) => {
      if (!profileId) return false
      return remove(ref(db, `/dietRules/${profileId}/${id}`))
    },

    addException: (exception: NewDietException) => {
      if (!profileId) return false
      const newRef = push(ref(db, `/dietExceptions/${profileId}`))
      const id = newRef.key
      const record = stripUndefined({ ...exception })
      // Optimistic: inject immediately so the UI updates regardless of server latency/auth
      setDietExceptions(prev => [
        ...prev,
        { id, ...(record as NewDietException) },
      ])
      return set(newRef, record)
    },
    updateException: (id: string, exception: NewDietException) => {
      if (!profileId) return false
      const record = stripUndefined({ ...exception })
      // Optimistic: update immediately so the UI updates regardless of server latency/auth
      setDietExceptions(prev =>
        prev.map(e => (e.id === id ? { ...e, ...record } : e)),
      )
      return set(ref(db, `/dietExceptions/${profileId}/${id}`), record)
    },
    deleteException: (id: string) => {
      if (!profileId) return false
      return remove(ref(db, `/dietExceptions/${profileId}/${id}`))
    },
  }
}
