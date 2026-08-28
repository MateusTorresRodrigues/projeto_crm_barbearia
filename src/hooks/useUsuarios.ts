import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { Usuario } from "@/lib/types"

/** Usuários da equipe com acesso ao sistema — usado no filtro por usuário da tela de Logs. */
export function useUsuarios() {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    supabase
      .from("usuarios")
      .select("*")
      .order("nome", { ascending: true })
      .then(({ data }) => {
        setUsuarios(data ?? [])
        setLoading(false)
      })
  }, [])

  return { usuarios, loading }
}
