import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ServiceOrderStatus } from "@/types/database"

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  received: "Recebido",
  analyzing: "Em análise",
  waiting_part: "Aguardando peça",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

const STATUS_VARIANT: Record<
  ServiceOrderStatus,
  "received" | "analyzing" | "waiting_part" | "ready" | "delivered" | "cancelled"
> = {
  received: "received",
  analyzing: "analyzing",
  waiting_part: "waiting_part",
  ready: "ready",
  delivered: "delivered",
  cancelled: "cancelled",
}

// Dados de exemplo — substituir por consulta ao Supabase
const MOCK_OS = [
  {
    id: "1",
    number: 1,
    customer: "João Silva",
    device: "iPhone 14 Pro",
    imei: "35 619108 765010 8",
    problem: "Tela quebrada",
    status: "analyzing" as ServiceOrderStatus,
    received_at: "2026-05-28",
    technician: "Carlos",
  },
  {
    id: "2",
    number: 2,
    customer: "Maria Santos",
    device: "Samsung Galaxy S23",
    imei: "35 619108 765020 5",
    problem: "Não liga, entrou água",
    status: "waiting_part" as ServiceOrderStatus,
    received_at: "2026-05-27",
    technician: "André",
  },
  {
    id: "3",
    number: 3,
    customer: "Pedro Alves",
    device: "Motorola G84",
    imei: "35 619108 765030 2",
    problem: "Bateria não carrega",
    status: "ready" as ServiceOrderStatus,
    received_at: "2026-05-26",
    technician: "Carlos",
  },
]

export default function OSPage() {
  return (
    <div className="flex flex-col">
      <Header title="Ordens de Serviço" action={{ label: "Nova OS", href: "/os/nova" }} />

      {/* Kanban de status */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {(Object.keys(STATUS_LABELS) as ServiceOrderStatus[]).map((status) => {
            const osInStatus = MOCK_OS.filter((os) => os.status === status)
            return (
              <div key={status} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
                  <span className="text-xs text-[--muted-foreground]">{osInStatus.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {osInStatus.map((os) => (
                    <Card
                      key={os.id}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                    >
                      <CardContent className="p-3">
                        <p className="text-sm font-medium text-[--foreground]">
                          OS #{os.number} — {os.customer}
                        </p>
                        <p className="mt-0.5 text-xs text-[--muted-foreground]">{os.device}</p>
                        <p className="mt-1 text-xs text-[--foreground]/70 line-clamp-2">
                          {os.problem}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-[--muted-foreground]">
                            {os.received_at}
                          </span>
                          <span className="text-xs text-[--muted-foreground]">
                            {os.technician}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {osInStatus.length === 0 && (
                    <div className="rounded-md border border-dashed border-[--border] p-4 text-center">
                      <p className="text-xs text-[--muted-foreground]">Nenhuma OS</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
