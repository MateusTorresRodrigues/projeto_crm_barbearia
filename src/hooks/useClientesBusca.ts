import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { ClienteCRM } from "@/lib/types"

/** Busca clientes em `crm_barbearia` por nome ou WhatsApp, com debounce. */
export function useClientesBusca(termo: string) {
  const [resultados, setResultados] = React.useState<ClienteCRM[]>([])
  const [buscando, setBuscando] = React.useState(false)

  React.useEffect(() => {
    const termoLimpo = termo.trim()
    if (termoLimpo.length < 2) {
      setResultados([])
      return
    }

    let ativo = true
    setBuscando(true)

    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("crm_barbearia")
        .select("id, whatsapp, nome, tipo, status")
        .or(`nome.ilike.%${termoLimpo}%,whatsapp.ilike.%${termoLimpo}%`)
        .order("nome", { ascending: true })
        .limit(10)

      if (ativo) {
        setResultados(data ?? [])
        setBuscando(false)
      }
    }, 300)

    return () => {
      ativo = false
      clearTimeout(timeout)
    }
  }, [termo])

  return { resultados, buscando }
}
