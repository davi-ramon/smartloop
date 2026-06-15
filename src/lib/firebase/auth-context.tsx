"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from "firebase/auth"
import { auth } from "./config"
import { logger } from "@/lib/logger"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u)
        setLoading(false)
        logger.info(
          "auth",
          u ? "sessão ativa" : "sem sessão",
          u ? { uid: u.uid, email: u.email } : undefined
        )
      },
      (err) => {
        logger.error("auth", "erro no observer de autenticação", err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  async function login(email: string, password: string) {
    logger.info("auth", "login e-mail/senha iniciado", { email })
    await signInWithEmailAndPassword(auth, email, password)
    logger.success("auth", "login e-mail/senha ok", { email })
  }

  async function loginWithGoogle() {
    logger.info("auth", "login com Google iniciado")
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    logger.success("auth", "login com Google ok")
  }

  async function signup(name: string, email: string, password: string) {
    logger.info("auth", "cadastro iniciado", { email })
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (name) {
      await updateProfile(cred.user, { displayName: name })
    }
    logger.success("auth", "cadastro concluído", { uid: cred.user.uid, email })
  }

  async function logout() {
    logger.info("auth", "logout iniciado")
    await signOut(auth)
    logger.success("auth", "logout concluído")
  }

  async function resetPassword(email: string) {
    logger.info("auth", "envio de reset de senha", { email })
    await sendPasswordResetEmail(auth, email)
    logger.success("auth", "e-mail de reset enviado", { email })
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, signup, logout, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  }
  return ctx
}
