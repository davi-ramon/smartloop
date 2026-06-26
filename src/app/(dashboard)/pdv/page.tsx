"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode,
  User, Package, Pencil, Loader2, CheckCircle2, X, PencilRuler,
  Upload, Download, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/firebase/auth-context"
import { watchProducts, deleteProduct, bulkCreateProducts, type Product } from "@/lib/data/products"
import { watchCustomers, type Customer } from "@/lib/data/customers"
import { createSale } from "@/lib/data/sales"
import {
  parseProductsFile, exportProductsCSV, downloadTemplate,
} from "@/lib/data/product-io"
import { logger } from "@/lib/logger"
import { ProductDrawer } from "@/components/pdv/product-drawer"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { SideDrawer } from "@/components/shared/side-drawer"

interface CartItem { id: string; name: string; price: number; qty: number }

const fmt = (n: number) => `R$ ${(n ?? 0).toFixed(2).replace(".", ",")}`

const PAYMENTS = [
  { id: "Dinheiro", icon: Banknote },
  { id: "Cartão", icon: CreditCard },
  { id: "PIX", icon: QrCode },
]

export default function PDVPage() {
  const { profile, tenant } = useAuth()
  const tenantId = profile?.tenantId

  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [payment, setPayment] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)
  const [done, setDone] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    const u1 = watchProducts(tenantId, (list) => { setProducts(list); setLoading(false) }, () => setLoading(false))
    const u2 = watchCustomers(tenantId, setCustomers, () => setCustomers([]))
    return () => { u1(); u2() }
  }, [tenantId])

  // Métodos de pagamento aceitos (das configurações), com fallback para todos.
  const acceptedPayments = useMemo(() => {
    const accepted = tenant?.paymentMethods
    if (!accepted?.length) return PAYMENTS
    const matched = PAYMENTS.filter((p) =>
      accepted.some((a) => a.toLowerCase().includes(p.id.toLowerCase()))
    )
    return matched.length ? matched : PAYMENTS
  }, [tenant?.paymentMethods])

  // Busca global: nome, descrição, categoria, valor, id.
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return products
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q) ||
      String(p.price).includes(q) ||
      p.id.toLowerCase().includes(q)
    )
  }, [products, search])

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    (c.whatsapp ?? "").includes(pickerSearch)
  )

  function onProductClick(p: Product) {
    if (editMode) { setEditing(p); setDrawerOpen(true); return }
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id)
      if (ex) return prev.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }]
    })
  }
  function changeQty(id: string, d: number) {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i))
  }
  function removeItem(id: string) { setCart((prev) => prev.filter((i) => i.id !== id)) }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  async function confirmDelete() {
    if (!tenantId || !confirmDel) return
    setDeleting(true)
    try { await deleteProduct(tenantId, confirmDel.id); setConfirmDel(null) }
    catch { /* logado */ }
    finally { setDeleting(false) }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = ""
    if (!file || !tenantId) return
    setImporting(true); setImportMsg(null)
    try {
      const { products: parsed, ignored } = await parseProductsFile(file)
      if (parsed.length === 0) {
        setImportMsg("Nenhum produto válido encontrado. Confira o modelo (nome e valor são obrigatórios).")
        return
      }
      const created = await bulkCreateProducts(tenantId, parsed)
      setImportMsg(`${created} produto(s) importado(s)${ignored ? ` · ${ignored} ignorado(s)` : ""}.`)
      setTimeout(() => setImportMsg(null), 6000)
    } catch (err) {
      logger.error("pdv", "falha na importação", err)
      setImportMsg(err instanceof Error ? err.message : "Falha ao importar o arquivo.")
    } finally {
      setImporting(false)
    }
  }

  async function finalizeSale() {
    if (!tenantId || cart.length === 0 || !payment) return
    setFinalizing(true)
    try {
      await createSale(tenantId, {
        items: cart.map((i) => ({ productId: i.id, name: i.name, price: i.price, quantity: i.qty })),
        total: subtotal,
        paymentMethod: payment,
        customerId: customer?.id,
        customerName: customer?.name,
      })
      setCart([]); setCustomer(null); setPayment(null); setDone(true)
      setTimeout(() => setDone(false), 3500)
    } catch {
      logger.error("pdv", "falha ao finalizar venda")
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title="PDV — Ponto de Venda"
        action={editMode ? { label: "Novo produto", onClick: () => { setEditing(null); setDrawerOpen(true) } } : undefined}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Painel de produtos */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-[--border]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[--border] p-4">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
              <Input placeholder="Buscar por nome, categoria, valor ou código..." className="border-transparent bg-[--muted] pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {editMode && (
              <>
                <input ref={importRef} type="file" accept=".csv,.json,application/json,text/csv" className="hidden" onChange={handleImport} />
                <button onClick={() => importRef.current?.click()} disabled={importing} className="flex h-9 items-center gap-1.5 rounded-lg border border-[--border] px-3 text-xs font-medium text-[--muted-foreground] transition-colors hover:bg-[--muted] hover:text-[--foreground] disabled:opacity-50">
                  {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}Importar
                </button>
                <button onClick={() => exportProductsCSV(products)} disabled={products.length === 0} className="flex h-9 items-center gap-1.5 rounded-lg border border-[--border] px-3 text-xs font-medium text-[--muted-foreground] transition-colors hover:bg-[--muted] hover:text-[--foreground] disabled:opacity-40" title={products.length === 0 ? "Cadastre ou importe produtos primeiro" : "Exportar CSV"}>
                  <Download className="h-3.5 w-3.5" />Exportar
                </button>
                <button onClick={() => downloadTemplate()} className="flex h-9 items-center gap-1.5 rounded-lg border border-[--border] px-3 text-xs font-medium text-[--muted-foreground] transition-colors hover:bg-[--muted] hover:text-[--foreground]" title="Baixar modelo de CSV">
                  <FileText className="h-3.5 w-3.5" />Modelo
                </button>
              </>
            )}

            <button
              onClick={() => setEditMode((v) => !v)}
              className={cn("flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors", editMode ? "bg-[--primary] text-white" : "border border-[--border] text-[--muted-foreground] hover:bg-[--muted] hover:text-[--foreground]")}
            >
              <PencilRuler className="h-3.5 w-3.5" />
              {editMode ? "Concluir edição" : "Gerenciar produtos"}
            </button>
          </div>

          {importMsg && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-[--primary]/30 bg-[--primary]/8 px-3 py-2.5 text-sm text-[--foreground]">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[--primary]" />{importMsg}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-[--muted-foreground]">
                <Loader2 className="h-6 w-6 animate-spin" /><p className="text-sm">Carregando produtos...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--muted]"><Package className="h-7 w-7 text-[--muted-foreground]" /></div>
                <div>
                  <p className="font-semibold text-[--foreground]">{search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}</p>
                  <p className="mt-1 text-sm text-[--muted-foreground]">{search ? "Tente outro termo." : "Cadastre os produtos vendidos no balcão."}</p>
                </div>
                {!search && <Button onClick={() => { setEditMode(true); setEditing(null); setDrawerOpen(true) }}><Plus className="h-4 w-4" />Cadastrar produto</Button>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((p) => (
                  <div key={p.id} className="group relative">
                    <button
                      onClick={() => onProductClick(p)}
                      className="flex w-full flex-col items-start overflow-hidden rounded-xl border border-[--border] bg-[--card] p-4 text-left transition-all hover:border-[--primary] hover:bg-[--primary]/5"
                    >
                      {!editMode && (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[--primary] text-white shadow-sm transition-transform group-hover:scale-110">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[--muted]">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-[--muted-foreground]" />}
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm font-medium leading-tight text-[--foreground]">{p.name}</p>
                      {p.description && <p className="mt-0.5 line-clamp-1 text-[11px] text-[--muted-foreground]">{p.description}</p>}
                      <p className="mt-1 text-sm font-bold text-[--primary]">{fmt(p.price)}</p>
                      <span className="mt-1 text-[10px] text-[--muted-foreground]">{p.category}</span>
                    </button>

                    {editMode && (
                      <div className="absolute right-2 top-2 flex gap-1">
                        <button onClick={() => { setEditing(p); setDrawerOpen(true) }} aria-label="Editar" className="flex h-7 w-7 items-center justify-center rounded-md bg-[--background] text-[--muted-foreground] shadow hover:text-[--primary]"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setConfirmDel(p)} aria-label="Excluir" className="flex h-7 w-7 items-center justify-center rounded-md bg-[--background] text-[--muted-foreground] shadow hover:text-[--destructive]"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carrinho */}
        <div className="flex w-80 shrink-0 flex-col bg-[--card]">
          <div className="flex items-center gap-2 border-b border-[--border] px-4 py-4">
            <ShoppingCart className="h-4 w-4 text-[--primary]" />
            <h2 className="text-sm font-semibold text-[--foreground]">Carrinho</h2>
            {cart.length > 0 && <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[--primary] text-[10px] font-bold text-white">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {done && (
              <div className="flex items-center gap-2 rounded-lg bg-[#10b981]/10 px-3 py-2.5 text-xs font-medium text-[#10b981]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />Venda registrada com sucesso!
              </div>
            )}
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <ShoppingCart className="h-10 w-10 text-[--muted-foreground]/40" />
                <p className="text-sm text-[--muted-foreground]">Nenhum item no carrinho</p>
              </div>
            ) : cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-[--border] p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[--foreground]">{item.name}</p>
                  <p className="text-xs font-semibold text-[--primary]">{fmt(item.price)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => changeQty(item.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-[--border] text-[--muted-foreground] hover:text-[--foreground]"><Minus className="h-3 w-3" /></button>
                  <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-[--border] text-[--muted-foreground] hover:text-[--foreground]"><Plus className="h-3 w-3" /></button>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-[--muted-foreground] hover:text-[#ef4444]"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>

          <div className="shrink-0 space-y-3 border-t border-[--border] p-4">
            {/* Cliente */}
            {customer ? (
              <div className="flex items-center gap-2 rounded-lg border border-[--primary]/30 bg-[--primary]/5 px-3 py-2.5">
                <User className="h-4 w-4 text-[--primary]" />
                <span className="flex-1 truncate text-sm text-[--foreground]">{customer.name}</span>
                <button onClick={() => setCustomer(null)} className="text-[--muted-foreground] hover:text-[--foreground]"><X className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => setPickerOpen(true)} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[--border] px-3 py-2.5 text-sm text-[--muted-foreground] transition-colors hover:border-[--primary] hover:text-[--primary]">
                <User className="h-4 w-4" />Vincular cliente (opcional)
              </button>
            )}

            <div className="flex items-center justify-between text-base font-bold text-[--foreground]">
              <span>Total</span><span className="text-[--primary]">{fmt(subtotal)}</span>
            </div>

            {/* Pagamento */}
            <div className="grid grid-cols-3 gap-2">
              {acceptedPayments.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPayment(id)}
                  disabled={cart.length === 0}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border py-3 text-xs transition-all disabled:opacity-40",
                    payment === id ? "border-[--primary] bg-[--primary]/10 text-[--primary]" : "border-[--border] text-[--muted-foreground] hover:border-[--primary] hover:text-[--primary]"
                  )}
                >
                  <Icon className="h-4 w-4" />{id}
                </button>
              ))}
            </div>

            <Button className="w-full" loading={finalizing} disabled={cart.length === 0 || !payment || finalizing} onClick={finalizeSale}>
              {payment ? `Finalizar venda · ${fmt(subtotal)}` : "Selecione o pagamento"}
            </Button>
          </div>
        </div>
      </div>

      {/* Drawer de produto */}
      <ProductDrawer product={editing} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={confirmDel !== null}
        title="Excluir produto?"
        description={confirmDel ? `${confirmDel.name} será removido do PDV.` : ""}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDel(null)}
      />

      {/* Seletor de cliente */}
      <SideDrawer open={pickerOpen} onClose={() => setPickerOpen(false)} title="Vincular cliente">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
          <Input placeholder="Buscar cliente..." className="border-transparent bg-[--muted] pl-8" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          {filteredCustomers.map((c) => (
            <button key={c.id} onClick={() => { setCustomer(c); setPickerOpen(false) }} className="flex w-full items-center gap-3 rounded-lg border border-[--border] px-3 py-2.5 text-left transition-colors hover:border-[--primary] hover:bg-[--muted]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[--primary] to-[#1d4ed8] text-xs font-bold text-white">{c.name.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[--foreground]">{c.name}</p>
                {c.whatsapp && <p className="text-xs text-[--muted-foreground]">{c.whatsapp}</p>}
              </div>
            </button>
          ))}
          {filteredCustomers.length === 0 && (
            <p className="py-6 text-center text-xs text-[--muted-foreground]">{customers.length === 0 ? "Nenhum cliente cadastrado." : "Nenhum cliente encontrado."}</p>
          )}
        </div>
      </SideDrawer>
    </div>
  )
}
