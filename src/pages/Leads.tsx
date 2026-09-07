import { Search } from "lucide-react"
import * as React from "react"

import { KanbanColuna } from "@/components/leads/KanbanColuna"
import { LeadDetalhesDialog } from "@/components/leads/LeadDetalhesDialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/contexts/ToastContext"
import { useLeadsRealtime } from "@/hooks/useLeadsRealtime"
import { useProfissionais } from "@/hooks/useProfissionais"
import { traduzErroAgendamento } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import { COLUNAS_STATUS_CRM } from "@/lib/statusCrm"
import type { CrmBarbearia, StatusCrm } from "@/lib/types"

export default function Leads() {
  const { leads, loading, atualizarLocal } = useLeadsRealtime()
  const { profissionais } = useProfissionais()
  const toast = useToast()

  const [busca, setBusca] = React.useState("")
  const [idBarbeiroFiltro, setIdBarbeiroFiltro] = React.useState<string | null>(null)
  const [origemFiltro, setOrigemFiltro] = React.useState<string | null>(null)

  const [detalhesAberto, setDetalhesAberto] = React.useState(false)
  const [leadSelecionadoId, setLeadSelecionadoId] = React.useState<string | null>(null)
  // Deriva da lista ao vivo (não de uma cópia) para refletir mudanças do Realtime enquanto o modal está aberto.
  const leadSelecionado = leads.find((l) => l.id === leadSelecionadoId) ?? null

  const arrastandoRef = React.useRef<string | null>(null)
  const [emArraste, setEmArraste] = React.useState(false)

  const origens = React.useMemo(
    () => [...new Set(leads.map((l) => l.origem).filter((o): o is string => !!o))].sort(),
    [leads]
  )

  const termo = busca.trim().toLowerCase()
  const leadsFiltrados = leads.filter((l) => {
    if (termo && !(l.nome?.toLowerCase().includes(termo) || l.whatsapp.includes(termo))) return false
    if (idBarbeiroFiltro && l.barbeiro_preferido !== idBarbeiroFiltro) return false
    if (origemFiltro && l.origem !== origemFiltro) return false
    return true
  })

  function abrirDetalhes(lead: CrmBarbearia) {
    setLeadSelecionadoId(lead.id)
    setDetalhesAberto(true)
  }

  function handleDragStartCard(e: React.DragEvent<HTMLDivElement>, leadId: string) {
    arrastandoRef.current = leadId
    setEmArraste(true)
    e.dataTransfer.effectAllowed = "move"
  }

  async function moverLead(leadId: string, novoStatus: StatusCrm) {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === novoStatus) return

    const statusAnterior = lead.status
    atualizarLocal(leadId, { status: novoStatus })

    const { error } = await supabase.from("crm_barbearia").update({ status: novoStatus }).eq("id", leadId)

    if (error) {
      atualizarLocal(leadId, { status: statusAnterior })
      toast({ titulo: "Não foi possível mover o card", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({
      acao: "atualizar_status",
      tabela: "crm_barbearia",
      idRegistro: leadId,
      dadosAnteriores: { status: statusAnterior },
      dadosNovos: { status: novoStatus },
    })
  }

  async function handleDropStatus(novoStatus: StatusCrm) {
    setEmArraste(false)
    const leadId = arrastandoRef.current
    arrastandoRef.current = null
    if (!leadId) return
    await moverLead(leadId, novoStatus)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative w-64 max-w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp..."
            className="pl-9"
          />
        </div>
        <select
          value={idBarbeiroFiltro ?? ""}
          onChange={(e) => setIdBarbeiroFiltro(e.target.value || null)}
          className="flex h-9 rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
        >
          <option value="">Todos os barbeiros</option>
          {profissionais.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <select
          value={origemFiltro ?? ""}
          onChange={(e) => setOrigemFiltro(e.target.value || null)}
          className="flex h-9 rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
        >
          <option value="">Todas as origens</option>
          {origens.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Carregando leads...
        </div>
      ) : (
        <div className="flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {COLUNAS_STATUS_CRM.map((coluna) => (
            <KanbanColuna
              key={coluna.valor}
              status={coluna.valor}
              label={coluna.label}
              leads={leadsFiltrados.filter((l) => l.status === coluna.valor)}
              emArraste={emArraste}
              onClickLead={abrirDetalhes}
              onDragStartCard={handleDragStartCard}
              onDropStatus={handleDropStatus}
              onMoverLead={moverLead}
            />
          ))}
        </div>
      )}

      <LeadDetalhesDialog
        open={detalhesAberto}
        onOpenChange={setDetalhesAberto}
        lead={leadSelecionado}
        profissionais={profissionais}
      />
    </div>
  )
}
