import { CalendarClock, Pencil, Phone, Trash2, User } from "lucide-react"

import { HistoricoAtendimentos } from "@/components/clientes/HistoricoAtendimentos"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { ClienteListado } from "@/hooks/useClientes"
import { useHistoricoCliente } from "@/hooks/useHistoricoCliente"
import { formatarTempoRelativo } from "@/lib/horarios"

export function ClienteDetalhesDialog({
  open,
  onOpenChange,
  cliente,
  onEditar,
  onExcluir,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: ClienteListado | null
  onEditar: () => void
  onExcluir: () => void
}) {
  const { itens, loading, ultimaVisita } = useHistoricoCliente(cliente?.id ?? null)

  if (!cliente) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente.nome || "(sem nome)"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-foreground">
            <Phone className="size-4 text-muted-foreground" /> {cliente.whatsapp}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <User className="size-4 text-muted-foreground" />
            {cliente.barbeiro_preferido_dados?.nome ?? "Sem barbeiro preferido"}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <CalendarClock className="size-4 text-muted-foreground" />
            {cliente.frequencia_visita
              ? `Visita a cada ${cliente.frequencia_visita} dias`
              : "Frequência não definida"}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <span className="text-muted-foreground">Última visita:</span>{" "}
            {ultimaVisita ? formatarTempoRelativo(ultimaVisita) : "Nenhuma visita registrada"}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="mb-2 font-display text-sm font-semibold text-foreground">
            Histórico de atendimentos
          </h3>
          <HistoricoAtendimentos itens={itens} loading={loading} />
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="destructive" size="sm" onClick={onExcluir}>
            <Trash2 className="size-4" /> Excluir cliente
          </Button>
          <Button size="sm" onClick={onEditar}>
            <Pencil className="size-4" /> Editar dados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
