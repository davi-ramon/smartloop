"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useAuth } from "./auth-context"
import { logger } from "@/lib/logger"
import { watchServiceOrders, type ServiceOrder } from "@/lib/data/service-orders"
import { watchCustomers, type Customer } from "@/lib/data/customers"
import { watchSales, type Sale } from "@/lib/data/sales"
import { watchTransactions, type Transaction } from "@/lib/data/finance"
import { watchParts, type Part } from "@/lib/data/parts"
import { watchProducts, type Product } from "@/lib/data/products"
import { watchTechnicians, type Technician } from "@/lib/data/technicians"
import { watchSuppliers, type Supplier } from "@/lib/data/suppliers"
import { watchQuotes, type Quote } from "@/lib/data/quotes"

/**
 * Camada única de dados em tempo real do workspace (loja).
 * Um só conjunto de listeners para TODO o dashboard — consumido pela Home
 * (KPIs/gráficos), pela busca global e pelo painel de notificações, sem
 * duplicar assinaturas em cada página.
 */
export interface WorkspaceData {
  orders: ServiceOrder[]
  customers: Customer[]
  sales: Sale[]
  transactions: Transaction[]
  parts: Part[]
  products: Product[]
  technicians: Technician[]
  suppliers: Supplier[]
  quotes: Quote[]
  loading: boolean
  /** Coleções que falharam ao assinar (para exibir estado de erro pontual). */
  errors: string[]
  ready: boolean
}

const EMPTY: WorkspaceData = {
  orders: [], customers: [], sales: [], transactions: [], parts: [],
  products: [], technicians: [], suppliers: [], quotes: [],
  loading: true, errors: [], ready: false,
}

const WorkspaceContext = createContext<WorkspaceData>(EMPTY)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const tenantId = profile?.tenantId

  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [ready, setReady] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (!tenantId) return
    logger.info("workspace", "assinando dados em tempo real do workspace", { tenantId })

    const flagError = (col: string) => (err: Error) => {
      logger.error("workspace", `falha ao assinar ${col}`, err)
      setErrors((prev) => (prev.includes(col) ? prev : [...prev, col]))
    }

    const unsubs = [
      watchServiceOrders(tenantId, (v) => { setOrders(v); setReady(true) }, flagError("OS")),
      watchCustomers(tenantId, setCustomers, flagError("clientes")),
      watchSales(tenantId, setSales, flagError("vendas")),
      watchTransactions(tenantId, setTransactions, flagError("financeiro")),
      watchParts(tenantId, setParts, flagError("peças")),
      watchProducts(tenantId, setProducts, flagError("produtos")),
      watchTechnicians(tenantId, setTechnicians, flagError("técnicos")),
      watchSuppliers(tenantId, setSuppliers, flagError("fornecedores")),
      watchQuotes(tenantId, setQuotes, flagError("orçamentos")),
    ]

    return () => {
      logger.info("workspace", "encerrando listeners do workspace", { tenantId })
      unsubs.forEach((u) => u())
    }
  }, [tenantId])

  const value = useMemo<WorkspaceData>(() => ({
    orders, customers, sales, transactions, parts, products, technicians, suppliers, quotes,
    loading: !ready, errors, ready,
  }), [orders, customers, sales, transactions, parts, products, technicians, suppliers, quotes, ready, errors])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

/** Dados do workspace em tempo real. Seguro fora do provider (retorna vazio). */
export function useWorkspace(): WorkspaceData {
  return useContext(WorkspaceContext)
}
