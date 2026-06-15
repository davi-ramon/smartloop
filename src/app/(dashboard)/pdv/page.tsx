"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard,
  Banknote, QrCode, User, Package,
} from "lucide-react"
import { AnimatedCard } from "@/components/shared/animated-card"

const PRODUCTS = [
  { id: "1", name: "Película iPhone 14",       price: 35,  category: "Películas" },
  { id: "2", name: "Capa iPhone 14 Silicone",  price: 25,  category: "Capas"     },
  { id: "3", name: "Carregador USB-C 20W",     price: 59,  category: "Outros"    },
  { id: "4", name: "Película Samsung S23",      price: 40,  category: "Películas" },
  { id: "5", name: "Cabo USB-C 1m",            price: 19,  category: "Outros"    },
  { id: "6", name: "Mão de obra — tela",       price: 50,  category: "Serviços"  },
  { id: "7", name: "Mão de obra — bateria",    price: 30,  category: "Serviços"  },
  { id: "8", name: "Película câmera iPhone",   price: 20,  category: "Películas" },
]

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
}

export default function PDVPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")

  const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  function addToCart(product: typeof PRODUCTS[0]) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  function changeQty(id: string, delta: number) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
  }

  function removeItem(id: string) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`

  return (
    <div className="flex flex-col flex-1">
      <Header title="PDV — Ponto de Venda" />
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Products panel */}
        <div className="flex flex-1 flex-col border-r border-[--border] overflow-hidden">
          <div className="border-b border-[--border] p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--muted-foreground]" />
              <Input placeholder="Buscar produto ou serviço..." className="pl-8 bg-[--muted] border-transparent" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map(product => (
                <AnimatedCard key={product.id} scale={1.06}>
                  <button
                    onClick={() => addToCart(product)}
                    aria-label={`Adicionar ${product.name} ao carrinho`}
                    className="group relative flex w-full flex-col items-start rounded-xl border border-[--border] bg-[--card] p-4 text-left transition-all hover:border-[--primary] hover:bg-[--primary]/5"
                  >
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[--primary] text-white shadow-sm transition-transform group-hover:scale-110">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--muted] transition-colors group-hover:bg-[--primary]/10">
                      <Package className="h-4 w-4 text-[--muted-foreground] group-hover:text-[--primary]" />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-medium leading-tight text-[--foreground]">{product.name}</p>
                    <p className="mt-1 text-sm font-bold text-[--primary]">{fmt(product.price)}</p>
                    <span className="mt-1 text-[10px] text-[--muted-foreground]">{product.category}</span>
                  </button>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </div>

        {/* Cart panel */}
        <div className="flex w-80 shrink-0 flex-col bg-[--card]">
          <div className="flex items-center gap-2 border-b border-[--border] px-4 py-4">
            <ShoppingCart className="h-4 w-4 text-[--primary]" />
            <h2 className="font-semibold text-sm text-[--foreground]">Carrinho</h2>
            {cart.length > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[--primary] text-[10px] font-bold text-white">
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <ShoppingCart className="h-10 w-10 text-[--muted-foreground]/40" />
                <p className="text-sm text-[--muted-foreground]">Nenhum item no carrinho</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 rounded-lg border border-[--border] p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[--foreground] truncate">{item.name}</p>
                    <p className="text-xs text-[--primary] font-semibold">{fmt(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => changeQty(item.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-[--border] text-[--muted-foreground] hover:text-[--foreground] hover:border-[--foreground]">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-[--border] text-[--muted-foreground] hover:text-[--foreground] hover:border-[--foreground]">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-[--muted-foreground] hover:text-[#ef4444] transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Customer & Total */}
          <div className="shrink-0 space-y-3 border-t border-[--border] p-4">
            <button className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[--border] px-3 py-2.5 text-sm text-[--muted-foreground] hover:border-[--primary] hover:text-[--primary] transition-colors">
              <User className="h-4 w-4" />
              Vincular cliente (opcional)
            </button>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-[--muted-foreground]">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-[--muted-foreground]">
                <span>Desconto</span><span>— R$ 0,00</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[--foreground] border-t border-[--border] pt-2">
                <span>Total</span><span className="text-[--primary]">{fmt(subtotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Banknote, label: "Dinheiro" },
                { icon: CreditCard, label: "Cartão" },
                { icon: QrCode, label: "PIX" },
              ].map(({ icon: Icon, label }) => (
                <button key={label} disabled={cart.length === 0} className="flex flex-col items-center gap-1 rounded-lg border border-[--border] py-3 text-xs text-[--muted-foreground] hover:border-[--primary] hover:text-[--primary] hover:bg-[--primary]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <Button className="w-full" disabled={cart.length === 0}>
              Finalizar venda
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
