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
import { watchTenant, type Tenant } from "@/lib/data/tenant"
import { logger } from "@/lib/logger"

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  tenant: Tenant | null
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
  const [tenant, setTenant] = useState<Tenant | null>(null)
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
            // o loading só termina após o tenant carregar (effect abaixo)
          } catch (err) {
            logger.error("auth", "falha ao carregar/criar perfil", err)
            setProfile(null)
            setLoading(false)
          }
        } else {
          logger.info("auth", "sem sessão")
          setProfile(null)
          setTenant(null)
          setLoading(false)
        }
      },
      (err) => {
        logger.error("auth", "erro no observer de autenticação", err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  // Carrega o tenant (loja) em tempo real assim que o perfil estiver pronto.
  useEffect(() => {
    if (!profile?.tenantId) return
    const unsub = watchTenant(
      profile.tenantId,
      (t) => { setTenant(t); setLoading(false) },
      () => { setLoading(false) }
    )
    return () => unsub()
  }, [profile?.tenantId])

  // Timeout de sessão: encerra após o limite (padrão 3h; 0 = indefinido).
  useEffect(() => {
    if (!user || !tenant) return
    const hours = tenant.sessionTimeoutHours ?? 3
    if (!hours || hours <= 0) return // indefinido

    let loginAt = Number((() => { try { return localStorage.getItem("smartloop_login_at") } catch { return null } })() || 0)
    if (!loginAt) {
      loginAt = Date.now()
      try { localStorage.setItem("smartloop_login_at", String(loginAt)) } catch { /* ignora */ }
    }
    const expiry = loginAt + hours * 3600_000

    function check() {
      if (Date.now() >= expiry) {
        logger.info("auth", "sessão expirada pelo limite de tempo — encerrando", { hours })
        try { localStorage.removeItem("smartloop_login_at") } catch { /* ignora */ }
        signOut(auth)
      }
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [user, tenant])

  function markLoginTime() {
    try { localStorage.setItem("smartloop_login_at", String(Date.now())) } catch { /* ignora */ }
  }

  async function login(email: string, password: string) {
    logger.info("auth", "login e-mail/senha iniciado", { email })
    await signInWithEmailAndPassword(auth, email, password)
    markLoginTime()
    logger.success("auth", "login e-mail/senha ok", { email })
  }

  async function loginWithGoogle() {
    logger.info("auth", "login com Google iniciado")
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    markLoginTime()
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
    markLoginTime()
    logger.success("auth", "cadastro concluído", { uid: cred.user.uid, tenantId: p.tenantId })
  }

  async function logout() {
    logger.info("auth", "logout iniciado")
    try { localStorage.removeItem("smartloop_login_at") } catch { /* ignora */ }
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
      value={{ user, profile, tenant, loading, login, loginWithGoogle, signup, logout, resetPassword }}
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
