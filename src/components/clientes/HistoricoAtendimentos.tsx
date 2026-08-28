import type { ItemHistorico } from "@/hooks/useHistoricoCliente"
import { formatarDataCompleta } from "@/lib/horarios"
import { cn } from "@/lib/utils"

const ROTULO_STATUS: Record<ItemHistorico["status"], string> = {
  agendado: "Agendado",
  compareceu: "Compareceu",
  cancelou: "Cancelado",
  faltou: "Faltou",
  comanda_avulsa: "Atendimento",
}

const COR_STATUS: Record<ItemHistorico["status"], string> = {
  agendado: "bg-primary/15 text-primary",
  compareceu: "bg-green-500/15 text-green-500",
  cancelou: "bg-destructive/15 text-destructive",
  faltou: "bg-orange-500/15 text-orange-500",
  comanda_avulsa: "bg-green-500/15 text-green-500",
}

/** Lista do histórico de atendimentos de um cliente — usada no detalhe de Clientes e no card de Leads. */
export function HistoricoAtendimentos({ itens, loading }: { itens: ItemHistorico[]; loading: boolean }) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando histórico...</p>
  }

  if (itens.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum atendimento registrado ainda.</p>
  }

  return (
    <ul className="space-y-2">
      {itens.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <p className="text-foreground">
              {formatarDataCompleta(new Date(item.data))} · {item.barbeiroNome}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {item.servicos.length > 0 ? item.servicos.join(", ") : "Sem serviços registrados"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {item.valor !== null && (
              <span className="text-foreground">
                {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            )}
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", COR_STATUS[item.status])}>
              {ROTULO_STATUS[item.status]}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
