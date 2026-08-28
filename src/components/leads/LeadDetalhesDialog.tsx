import { MessageCircle, Phone, Tag, User } from "lucide-react"

import { HistoricoAtendimentos } from "@/components/clientes/HistoricoAtendimentos"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useHistoricoCliente } from "@/hooks/useHistoricoCliente"
import type { ProfissionalCompleto } from "@/hooks/useProfissionais"
import { COLUNAS_STATUS_CRM, COR_STATUS_CRM } from "@/lib/statusCrm"
import type { CrmBarbearia } from "@/lib/types"
import { cn } from "@/lib/utils"
import { linkWhatsApp } from "@/lib/whatsapp"

export function LeadDetalhesDialog({
  open,
  onOpenChange,
  lead,
  profissionais,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: CrmBarbearia | null
  profissionais: ProfissionalCompleto[]
}) {
  const { itens, loading } = useHistoricoCliente(lead?.tipo === "cliente" ? lead.id : null)

  if (!lead) return null

  const barbeiro = profissionais.find((p) => p.id === lead.barbeiro_preferido)
  const labelStatus = COLUNAS_STATUS_CRM.find((c) => c.valor === lead.status)?.label ?? lead.status

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{lead.nome || lead.whatsapp}</DialogTitle>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", COR_STATUS_CRM[lead.status])}>
              {labelStatus}
            </span>
          </div>
          <DialogDescription>
            {lead.tipo === "cliente" ? "Já é cliente" : "Ainda é lead"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-foreground">
            <Phone className="size-4 text-muted-foreground" /> {lead.whatsapp}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <User className="size-4 text-muted-foreground" />
            {barbeiro?.nome ?? "Sem barbeiro preferido"}
          </div>
          {lead.origem && (
            <div className="flex items-center gap-2 text-foreground">
              <Tag className="size-4 text-muted-foreground" /> {lead.origem}
            </div>
          )}
        </div>

        <Button asChild variant="outline" size="sm" className="w-fit">
          <a href={linkWhatsApp(lead.whatsapp)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" /> Abrir no WhatsApp
          </a>
        </Button>

        {(lead.motivo_contato || lead.resumo_conversa) && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              {lead.motivo_contato && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Motivo do contato
                  </p>
                  <p className="text-foreground">{lead.motivo_contato}</p>
                </div>
              )}
              {lead.resumo_conversa && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Resumo da conversa
                  </p>
                  <p className="text-foreground">{lead.resumo_conversa}</p>
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        <div>
          <h3 className="mb-2 font-display text-sm font-semibold text-foreground">
            Histórico de agendamentos
          </h3>
          {lead.tipo === "cliente" ? (
            <HistoricoAtendimentos itens={itens} loading={loading} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Este lead ainda não é cliente — o histórico aparece aqui assim que ele comparecer a um atendimento.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
