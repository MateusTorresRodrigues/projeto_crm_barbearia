import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { Servico } from "@/lib/types"

export function useServicos(somenteAtivos = true) {
  const [servicos, setServicos] = React.useState<Servico[]>([])
  const [loading, setLoading] = React.useState(true)

  const carregar = React.useCallback(async () => {
    setLoading(true)
    let query = supabase.from("servicos").select("*").order("nome", { ascending: true })
    if (somenteAtivos) {
      query = query.eq("ativo", true)
    }
    const { data } = await query
    setServicos(data ?? [])
    setLoading(false)
  }, [somenteAtivos])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  return { servicos, loading, recarregar: carregar }
}
