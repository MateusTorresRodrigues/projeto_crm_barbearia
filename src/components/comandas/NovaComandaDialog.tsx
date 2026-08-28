import { X } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { useToast } from "@/contexts/ToastContext"
import type { ProfissionalCompleto } from "@/hooks/useProfissionais"
import { fimDoDia, inicioDoDia, traduzErroAgendamento, formatarHoraMinuto } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import type { ClienteCRM } from "@/lib/types"

type AgendamentoDisponivel = {
  id: string
  data_hora_inicio: string
  id_cliente: string
  cliente: ClienteCRM | null
  id_profissional: string
  profissionalNome: string
}

export function NovaComandaDialog({
  open,
  onOpenChange,
  profissionais,
  onCriada,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profissionais: ProfissionalCompleto[]
  onCriada: (comandaId: string) => void
}) {
  const toast = useToast()
  const [agendamentosHoje, setAgendamentosHoje] = React.useState<AgendamentoDisponivel[]>([])
  const [carregandoAgendamentos, setCarregandoAgendamentos] = React.useState(true)
  const [idAgendamento, setIdAgendamento] = React.useState("")
  const [cliente, setCliente] = React.useState<ClienteCRM | null>(null)
  const [idProfissional, setIdProfissional] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  React.useEffect(() => {
    if (!open) return

    setIdAgendamento("")
    setCliente(null)
    setIdProfissional(profissionais.find((p) => p.ativo)?.id ?? "")

    async function carregarAgendamentosDeHoje() {
      setCarregandoAgendamentos(true)
      const hoje = new Date()
      const { data } = await supabase
        .from("agendamentos")
        .select(
          "id, data_hora_inicio, id_cliente, cliente:crm_barbearia(id, whatsapp, nome, tipo, status), agenda:agendas(id_profissional, profissional:profissionais(nome)), comandas(id)"
        )
        .gte("data_hora_inicio", inicioDoDia(hoje).toISOString())
        .lte("data_hora_inicio", fimDoDia(hoje).toISOString())
        .in("status", ["agendado", "compareceu"])
        .order("data_hora_inicio", { ascending: true })

      type Linha = {
        id: string
        data_hora_inicio: string
        id_cliente: string
        cliente: ClienteCRM | null
        agenda: { id_profissional: string; profissional: { nome: string } | null } | null
        comandas: { id: string }[]
      }

      const disponiveis = ((data ?? []) as unknown as Linha[])
        .filter((a) => (a.comandas ?? []).length === 0 && a.agenda)
        .map((a) => ({
          id: a.id,
          data_hora_inicio: a.data_hora_inicio,
          id_cliente: a.id_cliente,
          cliente: a.cliente,
          id_profissional: a.agenda!.id_profissional,
          profissionalNome: a.agenda!.profissional?.nome ?? "—",
        }))

      setAgendamentosHoje(disponiveis)
      setCarregandoAgendamentos(false)
    }

    carregarAgendamentosDeHoje()
  }, [open, profissionais])

  function vincularAgendamento(id: string) {
    setIdAgendamento(id)
    const ag = agendamentosHoje.find((a) => a.id === id)
    if (ag) {
      setCliente(ag.cliente)
      setIdProfissional(ag.id_profissional)
    }
  }

  function desvincularAgendamento() {
    setIdAgendamento("")
    setCliente(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!cliente) {
      toast({ titulo: "Selecione ou cadastre um cliente", variante: "erro" })
      return
    }
    if (!idProfissional) {
      toast({ titulo: "Selecione um profissional", variante: "erro" })
      return
    }

    setSalvando(true)
    const payload = {
      id_agendamento: idAgendamento || null,
      id_cliente: cliente.id,
      id_profissional: idProfissional,
    }
    const { data, error } = await supabase.from("comandas").insert(payload).select("id").single()
    setSalvando(false)

    if (error) {
      toast({ titulo: "Não foi possível abrir a comanda", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({ acao: "criar", tabela: "comandas", idRegistro: data.id, dadosNovos: payload })
    toast({ titulo: "Comanda aberta", variante: "sucesso" })
    onCriada(data.id)
    onOpenChange(false)
  }

  const agendamentoVinculado = agendamentosHoje.find((a) => a.id === idAgendamento)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova comanda</DialogTitle>
          <DialogDescription>
            Vincule um agendamento de hoje para preencher cliente e profissional automaticamente, ou escolha manualmente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agendamento">Agendamento vinculado (opcional)</Label>
            {agendamentoVinculado ? (
              <div className="flex items-center justify-between rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm">
                <span className="text-foreground">
                  {formatarHoraMinuto(new Date(agendamentoVinculado.data_hora_inicio))} ·{" "}
                  {agendamentoVinculado.cliente?.nome || agendamentoVinculado.cliente?.whatsapp} ·{" "}
                  {agendamentoVinculado.profissionalNome}
                </span>
                <Button type="button" variant="ghost" size="icon" onClick={desvincularAgendamento} aria-label="Desvincular">
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <select
                id="agendamento"
                value={idAgendamento}
                onChange={(e) => vincularAgendamento(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
                disabled={carregandoAgendamentos}
              >
                <option value="">
                  {carregandoAgendamentos
                    ? "Carregando agendamentos de hoje..."
                    : agendamentosHoje.length === 0
                      ? "Nenhum agendamento de hoje sem comanda"
                      : "Nenhum — lançar manualmente"}
                </option>
                {agendamentosHoje.map((a) => (
                  <option key={a.id} value={a.id}>
                    {formatarHoraMinuto(new Date(a.data_hora_inicio))} · {a.cliente?.nome || a.cliente?.whatsapp} ·{" "}
                    {a.profissionalNome}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cliente *</Label>
            <ClienteCombobox value={cliente} onChange={setCliente} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profissional">Profissional *</Label>
            <select
              id="profissional"
              value={idProfissional}
              onChange={(e) => setIdProfissional(e.target.value)}
              disabled={!!agendamentoVinculado}
              className="flex h-9 w-full rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground disabled:opacity-60"
            >
              <option value="">Selecione...</option>
              {profissionais
                .filter((p) => p.ativo)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Abrindo..." : "Abrir comanda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
