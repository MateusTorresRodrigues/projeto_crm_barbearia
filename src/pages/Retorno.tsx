import { MessageCircle, Search, UserX } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useConfiguracao } from "@/contexts/ConfiguracaoContext"
import { useClientesInativos } from "@/hooks/useClientesInativos"
import { formatarDataCompleta } from "@/lib/horarios"
import { linkWhatsApp } from "@/lib/whatsapp"

export default function Retorno() {
  const { configuracao, loading: carregandoConfig } = useConfiguracao()
  const diasInatividade = configuracao?.dias_inatividade ?? 30

  const { itens, loading: carregandoClientes } = useClientesInativos(diasInatividade)
  const [busca, setBusca] = React.useState("")

  const loading = carregandoConfig || carregandoClientes
  const termo = busca.trim().toLowerCase()
  const filtrados = itens.filter(
    (i) => !termo || i.cliente.nome?.toLowerCase().includes(termo) || i.cliente.whatsapp.includes(termo)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-64 max-w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Considerando inativo após <span className="text-foreground">{diasInatividade} dias</span> sem visitar
        </p>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Carregando clientes inativos...
        </div>
      )}

      {!loading && filtrados.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
          <UserX className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              {itens.length === 0 ? "Nenhum cliente inativo" : "Nenhum resultado para essa busca"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {itens.length === 0
                ? "Todos os clientes visitaram a barbearia recentemente."
                : "Tente ajustar o termo da busca."}
            </p>
          </div>
        </div>
      )}

      {!loading && filtrados.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Barbeiro preferido</th>
                <th className="px-4 py-3 font-medium">Última visita</th>
                <th className="px-4 py-3 font-medium">Inativo há</th>
                <th className="px-4 py-3 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((i) => (
                <tr key={i.cliente.id} className="border-b border-border/60 last:border-b-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">{i.cliente.nome || "(sem nome)"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.cliente.whatsapp}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {i.cliente.barbeiro_preferido_dados?.nome ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatarDataCompleta(i.ultimaVisita)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                      {i.diasInativo} dias
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="outline" size="sm">
                      <a href={linkWhatsApp(i.cliente.whatsapp)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="size-4" /> WhatsApp
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
