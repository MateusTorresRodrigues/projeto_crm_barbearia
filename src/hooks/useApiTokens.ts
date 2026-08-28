import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { ApiToken } from "@/lib/types"

/** Gera um token aleatório com bastante entropia (não é hasheado no banco — ver nota em `api_tokens`). */
function gerarToken(): string {
  const aleatorio = () => crypto.randomUUID().replace(/-/g, "")
  return `bhk_${aleatorio()}${aleatorio()}`
}

export function useApiTokens() {
  const [tokens, setTokens] = React.useState<ApiToken[]>([])
  const [loading, setLoading] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const carregar = React.useCallback(async () => {
    setLoading(true)
    setErro(null)

    const { data, error } = await supabase
      .from("api_tokens")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    setTokens(data ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(nome: string) {
    const token = gerarToken()
    const { data, error } = await supabase
      .from("api_tokens")
      .insert({ nome, token, ativo: true })
      .select("*")
      .single()
    if (error) throw error
    await carregar()
    return data as ApiToken
  }

  async function alternarAtivo(item: ApiToken) {
    const { error } = await supabase.from("api_tokens").update({ ativo: !item.ativo }).eq("id", item.id)
    if (error) throw error
    await carregar()
  }

  async function excluir(id: string) {
    const { error } = await supabase.from("api_tokens").delete().eq("id", id)
    if (error) throw error
    await carregar()
  }

  return { tokens, loading, erro, recarregar: carregar, criar, alternarAtivo, excluir }
}
