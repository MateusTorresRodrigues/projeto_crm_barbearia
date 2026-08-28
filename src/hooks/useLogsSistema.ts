import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { LogSistemaDetalhado } from "@/lib/types"

const TAMANHO_PAGINA = 50

/** Carrega `logs_sistema` paginado (mais recentes primeiro), com o usuário já unido e filtros opcionais. */
export function useLogsSistema({
  tabela,
  idUsuario,
  dataInicio,
  dataFim,
}: {
  tabela: string | null
  idUsuario: string | null
  dataInicio: Date | null
  dataFim: Date | null
}) {
  const [logs, setLogs] = React.useState<LogSistemaDetalhado[]>([])
  const [loading, setLoading] = React.useState(true)
  const [carregandoMais, setCarregandoMais] = React.useState(false)
  const [temMais, setTemMais] = React.useState(false)
  const [erro, setErro] = React.useState<string | null>(null)

  const dataInicioMs = dataInicio?.getTime() ?? null
  const dataFimMs = dataFim?.getTime() ?? null

  const montarQuery = React.useCallback(
    (inicio: number, fim: number) => {
      let query = supabase
        .from("logs_sistema")
        .select("*, usuario:usuarios(*)")
        .order("created_at", { ascending: false })
        .range(inicio, fim)

      if (tabela) query = query.eq("tabela", tabela)
      if (idUsuario) query = query.eq("id_usuario", idUsuario)
      if (dataInicioMs) query = query.gte("created_at", new Date(dataInicioMs).toISOString())
      if (dataFimMs) query = query.lte("created_at", new Date(dataFimMs).toISOString())

      return query
    },
    [tabela, idUsuario, dataInicioMs, dataFimMs]
  )

  const carregar = React.useCallback(async () => {
    setLoading(true)
    setErro(null)

    const { data, error } = await montarQuery(0, TAMANHO_PAGINA - 1)

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    const resultado = (data ?? []) as unknown as LogSistemaDetalhado[]
    setLogs(resultado)
    setTemMais(resultado.length === TAMANHO_PAGINA)
    setLoading(false)
  }, [montarQuery])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  const carregarMais = React.useCallback(async () => {
    setCarregandoMais(true)
    const { data, error } = await montarQuery(logs.length, logs.length + TAMANHO_PAGINA - 1)
    setCarregandoMais(false)

    if (error) {
      setErro(error.message)
      return
    }

    const novos = (data ?? []) as unknown as LogSistemaDetalhado[]
    setLogs((atual) => [...atual, ...novos])
    setTemMais(novos.length === TAMANHO_PAGINA)
  }, [montarQuery, logs.length])

  return { logs, loading, carregandoMais, temMais, erro, carregarMais, recarregar: carregar }
}
