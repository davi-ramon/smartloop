import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col">
      <Header title="Configurações" />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Loja</CardTitle>
            <CardDescription>
              Informações exibidas nos orçamentos e comunicações com clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da loja</Label>
                <Input id="name" placeholder="Assistência Connect" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fantasy_name">Nome fantasia</Label>
                <Input id="fantasy_name" placeholder="Connect Cell" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" placeholder="(63) 99999-9999" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Salvar alterações</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plano e Assinatura</CardTitle>
            <CardDescription>
              Gerencie seu plano e dados de cobrança.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-[--border] p-4">
              <div>
                <p className="font-medium">Plano Pro</p>
                <p className="text-sm text-[--muted-foreground]">
                  OS ilimitadas · 5 usuários · Relatórios — R$ 89,90/mês
                </p>
              </div>
              <Button variant="outline" size="sm">
                Gerenciar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
