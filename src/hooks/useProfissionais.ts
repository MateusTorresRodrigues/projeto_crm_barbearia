import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { Agenda, Escala, Profissional } from "@/lib/types"

export type ProfissionalCompleto = Profissional & {
  agenda: Agenda | null
  escalas: Escala[]
}

export function useProfissionais() {
  const [profissionais, setProfissionais] = React.useState<ProfissionalCompleto[]>([])
  const [loading, setLoading] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const carregar = React.useCallback(async () => {
    setLoading(true)
    setErro(null)

    const { data, error } = await supabase
      .from("profissionais")
      .select("*, agenda:agendas(*), escalas(*)")
      .order("nome", { ascending: true })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    const normalizado = (data ?? []).map((p) => ({
      ...p,
      agenda: Array.isArray(p.agenda) ? (p.agenda[0] ?? null) : p.agenda,
      escalas: (p.escalas ?? []) as Escala[],
    })) as ProfissionalCompleto[]

    setProfissionais(normalizado)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  return { profissionais, loading, erro, recarregar: carregar }
}
