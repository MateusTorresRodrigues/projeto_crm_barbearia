import * as React from "react"

import { ClienteCombobox } from "@/components/agenda/ClienteCombobox"
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
import { useToast } from "@/contexts/ToastContext"
import type { ProfissionalCompleto } from "@/hooks/useProfissionais"
import { traduzErroAgendamento } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import type { ClienteCRM, Servico } from "@/lib/types"

function paraCamposData(data: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    data: `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`,
    hora: `${pad(data.getHours())}:${pad(data.getMinutes())}`,
  }
}

export function AgendamentoFormDialog({
  open,
  onOpenChange,
  profissionais,
  servicos,
  dataHoraInicial,
  profissionalIdInicial,
  onCriado,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profissionais: ProfissionalCompleto[]
  servicos: Servico[]
  dataHoraInicial: Date | null
  profissionalIdInicial: string | null
  onCriado: () => void
}) {
  const toast = useToast()
  const profissionaisAtivos = profissionais.filter((p) => p.ativo && p.agenda)

  const [idProfissional, setIdProfissional] = React.useState("")
  const [idServico, setIdServico] = React.useState("")
  const [dataCampo, setDataCampo] = React.useState("")
  const [horaCampo, setHoraCampo] = React.useState("")
  const [cliente, setCliente] = React.useState<ClienteCRM | null>(null)
  const [salvando, setSalvando] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    const base = dataHoraInicial ?? new Date()
    const { data, hora } = paraCamposData(base)
    setDataCampo(data)
    setHoraCampo(hora)
    setIdProfissional(profissionalIdInicial ?? profissionaisAtivos[0]?.id ?? "")
    setIdServico(servicos[0]?.id ?? "")
    setCliente(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dataHoraInicial, profissionalIdInicial])

  const servico = servicos.find((s) => s.id === idServico) ?? null
  const inicio = dataCampo && horaCampo ? new Date(`${dataCampo}T${horaCampo}:00`) : null
  const fim = inicio && servico ? new Date(inicio.getTime() + servico.duracao_minutos * 60000) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const profissional = profissionaisAtivos.find((p) => p.id === idProfissional)
    if (!profissional?.agenda) {
      toast({ titulo: "Selecione um profissional", variante: "erro" })
      return
    }
    if (!cliente) {
      toast({ titulo: "Selecione ou cadastre um cliente", variante: "erro" })
      return
    }
    if (!servico || !inicio || !fim) {
      toast({ titulo: "Selecione um serviço e um horário válido", variante: "erro" })
      return
    }

    setSalvando(true)
    const { data, error } = await supabase
      .from("agendamentos")
      .insert({
        id_agenda: profissional.agenda.id,
        id_cliente: cliente.id,
        id_servico: servico.id,
        data_hora_inicio: inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
      })
      .select("id")
      .single()
    setSalvando(false)

    if (error) {
      toast({
        titulo: "Não foi possível agendar",
        descricao: traduzErroAgendamento(error),
        variante: "erro",
      })
      return
    }

    await registrarLog({
      acao: "criar",
      tabela: "agendamentos",
      idRegistro: data.id,
      dadosNovos: {
        id_agenda: profissional.agenda.id,
        id_cliente: cliente.id,
        id_servico: servico.id,
        data_hora_inicio: inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
      },
    })

    toast({ titulo: "Agendamento criado", variante: "sucesso" })
    onCriado()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>
            O horário de término é calculado automaticamente pela duração do serviço.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profissional">Profissional</Label>
            <select
              id="profissional"
              value={idProfissional}
              onChange={(e) => setIdProfissional(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
            >
              {profissionaisAtivos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <ClienteCombobox value={cliente} onChange={setCliente} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="servico">Serviço</Label>
            <select
              id="servico"
              value={idServico}
              onChange={(e) => setIdServico(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
            >
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.duracao_minutos} min · R$ {s.preco.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={dataCampo}
                onChange={(e) => setDataCampo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Início</Label>
              <Input
                id="hora"
                type="time"
                value={horaCampo}
                onChange={(e) => setHoraCampo(e.target.value)}
              />
            </div>
          </div>

          {fim && (
            <p className="text-sm text-muted-foreground">
              Término previsto: <span className="text-foreground">{fim.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Agendando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
