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
import { ensureUserProfile, setPendingStoreName, type UserProfile } from "./firestore"
import { logger } from "@/lib/logger"

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  signup: (name: string, email: string, password: string, storeName?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        setUser(u)
        if (u) {
          logger.info("auth", "sessão ativa", { uid: u.uid, email: u.email })
          try {
            const p = await ensureUserProfile(u)
            setProfile(p)
          } catch (err) {
            logger.error("auth", "falha ao carregar/criar perfil", err)
            setProfile(null)
          }
        } else {
          logger.info("auth", "sem sessão")
          setProfile(null)
        }
        setLoading(false)
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

  async function signup(name: string, email: string, password: string, storeName?: string) {
    logger.info("auth", "cadastro iniciado", { email })
    // Registra o nome da loja antes de criar o usuário — assim, mesmo que o
    // observer de auth dispare a criação do perfil primeiro, o nome é aplicado.
    setPendingStoreName(storeName)
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (name) {
      await updateProfile(cred.user, { displayName: name })
    }
    // Cria/carrega a loja e o perfil (deduplicado — sem corrida com o observer).
    const p = await ensureUserProfile(cred.user, storeName)
    setProfile(p)
    logger.success("auth", "cadastro concluído", { uid: cred.user.uid, tenantId: p.tenantId })
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
      value={{ user, profile, loading, login, loginWithGoogle, signup, logout, resetPassword }}
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
