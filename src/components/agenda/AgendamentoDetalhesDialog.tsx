import { CalendarClock, CheckCircle2, User, XCircle } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useConfirm } from "@/contexts/ConfirmDialogContext"
import { useToast } from "@/contexts/ToastContext"
import { traduzErroAgendamento } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import type { AgendamentoDetalhado, StatusAgendamento } from "@/lib/types"
import { cn } from "@/lib/utils"

const ROTULO_STATUS: Record<StatusAgendamento, string> = {
  agendado: "Agendado",
  compareceu: "Compareceu",
  cancelou: "Cancelado",
  faltou: "Faltou",
}

const COR_STATUS: Record<StatusAgendamento, string> = {
  agendado: "text-primary",
  compareceu: "text-green-500",
  cancelou: "text-destructive",
  faltou: "text-orange-500",
}

function paraCamposData(data: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    data: `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`,
    hora: `${pad(data.getHours())}:${pad(data.getMinutes())}`,
  }
}

export function AgendamentoDetalhesDialog({
  open,
  onOpenChange,
  agendamento,
  onAtualizado,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: AgendamentoDetalhado | null
  onAtualizado: () => void
}) {
  const toast = useToast()
  const confirmar = useConfirm()

  const [dataCampo, setDataCampo] = React.useState("")
  const [horaCampo, setHoraCampo] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  React.useEffect(() => {
    if (!open || !agendamento) return
    const { data, hora } = paraCamposData(new Date(agendamento.data_hora_inicio))
    setDataCampo(data)
    setHoraCampo(hora)
  }, [open, agendamento])

  if (!agendamento) return null

  const duracaoMin = Math.round(
    (new Date(agendamento.data_hora_fim).getTime() - new Date(agendamento.data_hora_inicio).getTime()) / 60000
  )
  const cor = agendamento.agenda?.cor ?? "#666"
  const houveAlteracaoHorario =
    dataCampo &&
    horaCampo &&
    new Date(`${dataCampo}T${horaCampo}:00`).getTime() !== new Date(agendamento.data_hora_inicio).getTime()

  async function atualizarStatus(novoStatus: StatusAgendamento) {
    if (!agendamento) return

    if (novoStatus === "cancelou") {
      const confirmado = await confirmar({
        titulo: "Cancelar agendamento?",
        descricao: `O horário de ${agendamento.cliente?.nome || agendamento.cliente?.whatsapp} será cancelado.`,
        textoConfirmar: "Cancelar agendamento",
        textoCancelar: "Voltar",
      })
      if (!confirmado) return
    }

    const { error } = await supabase
      .from("agendamentos")
      .update({ status: novoStatus })
      .eq("id", agendamento.id)

    if (error) {
      toast({ titulo: "Não foi possível atualizar", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({
      acao: "atualizar_status",
      tabela: "agendamentos",
      idRegistro: agendamento.id,
      dadosAnteriores: { status: agendamento.status },
      dadosNovos: { status: novoStatus },
    })

    toast({ titulo: `Agendamento marcado como "${ROTULO_STATUS[novoStatus]}"`, variante: "sucesso" })
    onAtualizado()
    onOpenChange(false)
  }

  async function remarcar() {
    if (!agendamento) return
    const novoInicio = new Date(`${dataCampo}T${horaCampo}:00`)
    const novoFim = new Date(novoInicio.getTime() + duracaoMin * 60000)

    setSalvando(true)
    const { error } = await supabase
      .from("agendamentos")
      .update({ data_hora_inicio: novoInicio.toISOString(), data_hora_fim: novoFim.toISOString() })
      .eq("id", agendamento.id)
    setSalvando(false)

    if (error) {
      toast({ titulo: "Não foi possível remarcar", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({
      acao: "remarcar",
      tabela: "agendamentos",
      idRegistro: agendamento.id,
      dadosAnteriores: { data_hora_inicio: agendamento.data_hora_inicio },
      dadosNovos: { data_hora_inicio: novoInicio.toISOString() },
    })

    toast({ titulo: "Agendamento remarcado", variante: "sucesso" })
    onAtualizado()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: cor }} />
            <DialogTitle>{agendamento.servico?.nome ?? "Agendamento"}</DialogTitle>
          </div>
          <DialogDescription className={cn("font-medium", COR_STATUS[agendamento.status])}>
            {ROTULO_STATUS[agendamento.status]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <User className="size-4 text-muted-foreground" />
            {agendamento.cliente?.nome || agendamento.cliente?.whatsapp || "Cliente não informado"}
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <CalendarClock className="size-4 text-muted-foreground" />
            {agendamento.agenda?.profissional?.nome ?? "—"} · {duracaoMin} min
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Remarcar</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" value={dataCampo} onChange={(e) => setDataCampo(e.target.value)} />
            <Input type="time" value={horaCampo} onChange={(e) => setHoraCampo(e.target.value)} />
          </div>
          {houveAlteracaoHorario && (
            <Button size="sm" onClick={remarcar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar nova data/horário"}
            </Button>
          )}
        </div>

        <Separator />

        <DialogFooter className="sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {agendamento.status !== "compareceu" && (
              <Button size="sm" variant="outline" onClick={() => atualizarStatus("compareceu")}>
                <CheckCircle2 className="size-4" /> Compareceu
              </Button>
            )}
            {agendamento.status !== "faltou" && (
              <Button size="sm" variant="outline" onClick={() => atualizarStatus("faltou")}>
                <XCircle className="size-4" /> Faltou
              </Button>
            )}
          </div>
          {agendamento.status !== "cancelou" && (
            <Button size="sm" variant="destructive" onClick={() => atualizarStatus("cancelou")}>
              Cancelar agendamento
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
