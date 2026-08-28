import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { ComandaListada, StatusComanda } from "@/lib/types"

export type FiltroComandas = {
  status: StatusComanda | "todas"
  idProfissional: string | null
  dataInicio: Date | null
  dataFim: Date | null
}

export function useComandas(filtro: FiltroComandas) {
  const [comandas, setComandas] = React.useState<ComandaListada[]>([])
  const [loading, setLoading] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const { status, idProfissional, dataInicio, dataFim } = filtro
  const dataInicioMs = dataInicio?.getTime() ?? null
  const dataFimMs = dataFim?.getTime() ?? null

  const carregar = React.useCallback(async () => {
    setLoading(true)
    setErro(null)

    let query = supabase
      .from("comandas")
      .select("*, cliente:crm_barbearia(id, whatsapp, nome, tipo, status), profissional:profissionais(*)")
      .order("created_at", { ascending: false })

    if (status !== "todas") {
      query = query.eq("status", status)
    }
    if (idProfissional) {
      query = query.eq("id_profissional", idProfissional)
    }
    if (dataInicioMs !== null) {
      query = query.gte("created_at", new Date(dataInicioMs).toISOString())
    }
    if (dataFimMs !== null) {
      query = query.lte("created_at", new Date(dataFimMs).toISOString())
    }

    const { data, error } = await query

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    setComandas((data ?? []) as unknown as ComandaListada[])
    setLoading(false)
  }, [status, idProfissional, dataInicioMs, dataFimMs])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  return { comandas, loading, erro, recarregar: carregar }
}
