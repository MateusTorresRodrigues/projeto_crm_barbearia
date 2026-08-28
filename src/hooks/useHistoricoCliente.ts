import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { StatusAgendamento } from "@/lib/types"

export type ItemHistorico = {
  id: string
  data: string
  barbeiroNome: string
  servicos: string[]
  valor: number | null
  status: StatusAgendamento | "comanda_avulsa"
}

type ComandaEmbutida = {
  status: string
  valor_total: number
  comanda_servicos: { servico: { nome: string } | null }[]
}

type AgendamentoLinha = {
  id: string
  data_hora_inicio: string
  status: StatusAgendamento
  servico: { nome: string } | null
  agenda: { profissional: { nome: string } | null } | null
  comandas: ComandaEmbutida[] | null
}

type ComandaAvulsaLinha = {
  id: string
  created_at: string
  valor_total: number
  profissional: { nome: string } | null
  comanda_servicos: { servico: { nome: string } | null }[]
}

/** Histórico completo de atendimentos de um cliente: agendamentos + comandas avulsas (sem agendamento) já fechadas. */
export function useHistoricoCliente(clienteId: string | null) {
  const [itens, setItens] = React.useState<ItemHistorico[]>([])
  const [loading, setLoading] = React.useState(true)

  const carregar = React.useCallback(async () => {
    if (!clienteId) {
      setItens([])
      setLoading(false)
      return
    }

    setLoading(true)

    const [{ data: agendamentos }, { data: comandasAvulsas }] = await Promise.all([
      supabase
        .from("agendamentos")
        .select(
          "id, data_hora_inicio, status, servico:servicos(nome), agenda:agendas(profissional:profissionais(nome)), comandas(status, valor_total, comanda_servicos(servico:servicos(nome)))"
        )
        .eq("id_cliente", clienteId)
        .order("data_hora_inicio", { ascending: false }),
      supabase
        .from("comandas")
        .select("id, created_at, valor_total, profissional:profissionais(nome), comanda_servicos(servico:servicos(nome))")
        .eq("id_cliente", clienteId)
        .eq("status", "fechada")
        .is("id_agendamento", null)
        .order("created_at", { ascending: false }),
    ])

    const doAgendamento = ((agendamentos ?? []) as unknown as AgendamentoLinha[]).map((a) => {
      const comandaFechada = (a.comandas ?? []).find((c) => c.status === "fechada") ?? null
      return {
        id: a.id,
        data: a.data_hora_inicio,
        barbeiroNome: a.agenda?.profissional?.nome ?? "—",
        servicos: comandaFechada
          ? comandaFechada.comanda_servicos.map((cs) => cs.servico?.nome ?? "").filter(Boolean)
          : [a.servico?.nome ?? ""].filter(Boolean),
        valor: comandaFechada ? comandaFechada.valor_total : null,
        status: a.status,
      } satisfies ItemHistorico
    })

    const doAvulsa = ((comandasAvulsas ?? []) as unknown as ComandaAvulsaLinha[]).map((c) => ({
      id: c.id,
      data: c.created_at,
      barbeiroNome: c.profissional?.nome ?? "—",
      servicos: c.comanda_servicos.map((cs) => cs.servico?.nome ?? "").filter(Boolean),
      valor: c.valor_total,
      status: "comanda_avulsa" as const,
    }))

    const unificado = [...doAgendamento, ...doAvulsa].sort((a, b) => b.data.localeCompare(a.data))

    setItens(unificado)
    setLoading(false)
  }, [clienteId])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  const ultimaVisita = React.useMemo(() => {
    const visitas = itens.filter((i) => i.status === "compareceu" || i.status === "comanda_avulsa")
    return visitas.length > 0 ? new Date(visitas[0].data) : null
  }, [itens])

  return { itens, loading, ultimaVisita, recarregar: carregar }
}
