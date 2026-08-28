import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { CrmBarbearia, Profissional } from "@/lib/types"

export type ClienteListado = CrmBarbearia & {
  barbeiro_preferido_dados: Profissional | null
}

export function useClientes({
  busca,
  idBarbeiroPreferido,
}: {
  busca: string
  idBarbeiroPreferido: string | null
}) {
  const [clientes, setClientes] = React.useState<ClienteListado[]>([])
  const [loading, setLoading] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const carregar = React.useCallback(async () => {
    setLoading(true)
    setErro(null)

    let query = supabase
      .from("crm_barbearia")
      .select("*, barbeiro_preferido_dados:profissionais(*)")
      .eq("tipo", "cliente")
      .order("nome", { ascending: true })

    const termo = busca.trim()
    if (termo) {
      query = query.or(`nome.ilike.%${termo}%,whatsapp.ilike.%${termo}%`)
    }
    if (idBarbeiroPreferido) {
      query = query.eq("barbeiro_preferido", idBarbeiroPreferido)
    }

    const { data, error } = await query

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    setClientes((data ?? []) as unknown as ClienteListado[])
    setLoading(false)
  }, [busca, idBarbeiroPreferido])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  return { clientes, loading, erro, recarregar: carregar }
}
