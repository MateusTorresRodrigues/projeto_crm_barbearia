import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { ComandaDetalhada, Profissional } from "@/lib/types"

export type GrupoComissao = {
  profissional: Profissional
  comandas: ComandaDetalhada[]
  totalAtendimentos: number
  totalComissao: number
}

export function useComissao({
  dataInicio,
  dataFim,
  idProfissional,
}: {
  dataInicio: Date
  dataFim: Date
  idProfissional: string | null
}) {
  const [grupos, setGrupos] = React.useState<GrupoComissao[]>([])
  const [loading, setLoading] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const dataInicioMs = dataInicio.getTime()
  const dataFimMs = dataFim.getTime()

  const carregar = React.useCallback(async () => {
    setLoading(true)
    setErro(null)

    let query = supabase
      .from("comandas")
      .select(
        "*, cliente:crm_barbearia(id, whatsapp, nome, tipo, status), profissional:profissionais(*), comanda_servicos(*, servico:servicos(*))"
      )
      .eq("status", "fechada")
      .gte("updated_at", new Date(dataInicioMs).toISOString())
      .lte("updated_at", new Date(dataFimMs).toISOString())
      .order("updated_at", { ascending: false })

    if (idProfissional) {
      query = query.eq("id_profissional", idProfissional)
    }

    const { data, error } = await query

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    const comandas = (data ?? []) as unknown as ComandaDetalhada[]
    const porProfissional = new Map<string, GrupoComissao>()

    for (const c of comandas) {
      if (!c.profissional) continue
      const existente = porProfissional.get(c.profissional.id)
      if (existente) {
        existente.comandas.push(c)
        existente.totalAtendimentos += 1
        existente.totalComissao += c.valor_comissao
      } else {
        porProfissional.set(c.profissional.id, {
          profissional: c.profissional,
          comandas: [c],
          totalAtendimentos: 1,
          totalComissao: c.valor_comissao,
        })
      }
    }

    setGrupos([...porProfissional.values()].sort((a, b) => a.profissional.nome.localeCompare(b.profissional.nome)))
    setLoading(false)
  }, [dataInicioMs, dataFimMs, idProfissional])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  const totalGeral = grupos.reduce((soma, g) => soma + g.totalComissao, 0)
  const totalAtendimentosGeral = grupos.reduce((soma, g) => soma + g.totalAtendimentos, 0)

  return { grupos, totalGeral, totalAtendimentosGeral, loading, erro, recarregar: carregar }
}
