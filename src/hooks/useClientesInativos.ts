import * as React from "react"

import type { ClienteListado } from "@/hooks/useClientes"
import { supabase } from "@/lib/supabase"

export type ClienteInativo = {
  cliente: ClienteListado
  ultimaVisita: Date
  diasInativo: number
}

/** Clientes cuja última visita (agendamento compareceu ou comanda fechada) passou de `diasInatividade`. */
export function useClientesInativos(diasInatividade: number) {
  const [itens, setItens] = React.useState<ClienteInativo[]>([])
  const [loading, setLoading] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const carregar = React.useCallback(async () => {
    setLoading(true)
    setErro(null)

    const [{ data: clientes, error: erroClientes }, { data: compareceu, error: erroAg }, { data: fechadas, error: erroCom }] =
      await Promise.all([
        supabase.from("crm_barbearia").select("*, barbeiro_preferido_dados:profissionais(*)").eq("tipo", "cliente"),
        supabase.from("agendamentos").select("id_cliente, data_hora_inicio").eq("status", "compareceu"),
        supabase.from("comandas").select("id_cliente, updated_at").eq("status", "fechada"),
      ])

    const erroQualquer = erroClientes || erroAg || erroCom
    if (erroQualquer) {
      setErro(erroQualquer.message)
      setLoading(false)
      return
    }

    const ultimaVisitaPorCliente = new Map<string, number>()
    const considerar = (idCliente: string, dataIso: string) => {
      const t = new Date(dataIso).getTime()
      const atual = ultimaVisitaPorCliente.get(idCliente)
      if (!atual || t > atual) ultimaVisitaPorCliente.set(idCliente, t)
    }
    for (const a of compareceu ?? []) considerar(a.id_cliente, a.data_hora_inicio)
    for (const c of fechadas ?? []) considerar(c.id_cliente, c.updated_at)

    const agora = Date.now()
    const umDiaMs = 1000 * 60 * 60 * 24

    const resultado: ClienteInativo[] = []
    for (const c of (clientes ?? []) as unknown as ClienteListado[]) {
      const ultimaMs = ultimaVisitaPorCliente.get(c.id)
      if (!ultimaMs) continue
      const diasInativo = Math.floor((agora - ultimaMs) / umDiaMs)
      if (diasInativo > diasInatividade) {
        resultado.push({ cliente: c, ultimaVisita: new Date(ultimaMs), diasInativo })
      }
    }
    resultado.sort((a, b) => b.diasInativo - a.diasInativo)

    setItens(resultado)
    setLoading(false)
  }, [diasInatividade])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  return { itens, loading, erro, recarregar: carregar }
}
