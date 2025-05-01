import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
} from "firebase/auth"
import { createContext, useContext, useEffect, useState } from "react"
import { auth } from "./firebase"
import type { ReactNode } from "react"
import type { User } from "firebase/auth"

type AuthState = "LOGGED_OUT" | "LOGGED_IN" | "LOADING"

export interface AuthContext {
  login: () => void
  logout: () => Promise<void>
  user: User | null
  state: AuthState
}
const AuthContext = createContext<AuthContext | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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
      {state === "LOADING" ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
