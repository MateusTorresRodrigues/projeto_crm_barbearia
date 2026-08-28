import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { AgendamentoDetalhado } from "@/lib/types"

/**
 * Carrega os agendamentos cujo início cai no intervalo [inicio, fim), já com
 * cliente, serviço e a agenda/profissional relacionados.
 */
export function useAgendamentos(inicio: Date, fim: Date) {
  const [agendamentos, setAgendamentos] = React.useState<AgendamentoDetalhado[]>([])
  const [loading, setLoading] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const carregar = React.useCallback(async () => {
    setLoading(true)
    setErro(null)

    const { data, error } = await supabase
      .from("agendamentos")
      .select(
        "*, cliente:crm_barbearia(id, whatsapp, nome, tipo, status), servico:servicos(*), agenda:agendas(*, profissional:profissionais(*))"
      )
      .gte("data_hora_inicio", inicio.toISOString())
      .lt("data_hora_inicio", fim.toISOString())
      .order("data_hora_inicio", { ascending: true })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    setAgendamentos((data ?? []) as unknown as AgendamentoDetalhado[])
    setLoading(false)
  }, [inicio, fim])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  return { agendamentos, loading, erro, recarregar: carregar }
}
