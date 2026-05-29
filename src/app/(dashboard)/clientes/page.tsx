import { Header } from "@/components/layout/header"
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function ClientesPage() {
  return (
    <div className="flex flex-col">
      <Header title="Clientes" action={{ label: "Novo Cliente", href: "/clientes/novo" }} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="rounded-full bg-[--secondary] p-6">
          <Users className="h-12 w-12 text-[--muted-foreground]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Nenhum cliente cadastrado</h2>
          <p className="mt-1 text-sm text-[--muted-foreground]">
            Os clientes aparecem aqui quando você abre uma OS ou os cadastra manualmente.
          </p>
        </div>
      </div>
    </div>
  )
}
