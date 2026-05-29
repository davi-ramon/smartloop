import { Header } from "@/components/layout/header"
import { Package } from "lucide-react"

export default function EstoquePage() {
  return (
    <div className="flex flex-col">
      <Header title="Estoque" action={{ label: "Nova Peça", href: "/estoque/nova" }} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="rounded-full bg-[--secondary] p-6">
          <Package className="h-12 w-12 text-[--muted-foreground]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Catálogo de peças vazio</h2>
          <p className="mt-1 text-sm text-[--muted-foreground]">
            Cadastre as peças que você usa nos reparos para gerar orçamentos automaticamente.
          </p>
        </div>
      </div>
    </div>
  )
}
