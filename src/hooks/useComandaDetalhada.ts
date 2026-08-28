import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { ComandaDetalhada } from "@/lib/types"

export function useComandaDetalhada(comandaId: string | null) {
  const [comanda, setComanda] = React.useState<ComandaDetalhada | null>(null)
  const [loading, setLoading] = React.useState(true)

  const carregar = React.useCallback(async () => {
    if (!comandaId) {
      setComanda(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from("comandas")
      .select(
        "*, cliente:crm_barbearia(id, whatsapp, nome, tipo, status), profissional:profissionais(*), comanda_servicos(*, servico:servicos(*))"
      )
      .eq("id", comandaId)
      .single()

    setComanda((data ?? null) as unknown as ComandaDetalhada | null)
    setLoading(false)
  }, [comandaId])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  return { comanda, loading, recarregar: carregar }
}
