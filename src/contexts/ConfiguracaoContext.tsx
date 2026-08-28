import * as React from "react"

import { supabase } from "@/lib/supabase"

export type Configuracao = {
  id: string
  nome_negocio: string
  logo_url: string | null
  fuso_horario: string
  dias_inatividade: number
  horario_abertura: string
  horario_fechamento: string
}

const NOME_SISTEMA_PADRAO = "Sistema de Gestão para Barbearia"

type ConfiguracaoContextValue = {
  configuracao: Configuracao | null
  loading: boolean
  nomeNegocio: string
  logoUrl: string | null
  recarregar: () => Promise<void>
}

const ConfiguracaoContext = React.createContext<ConfiguracaoContextValue | undefined>(
  undefined
)

export function ConfiguracaoProvider({ children }: { children: React.ReactNode }) {
  const [configuracao, setConfiguracao] = React.useState<Configuracao | null>(null)
  const [loading, setLoading] = React.useState(true)

  const carregar = React.useCallback(async () => {
    const { data } = await supabase
      .from("configuracoes")
      .select("id, nome_negocio, logo_url, fuso_horario, dias_inatividade, horario_abertura, horario_fechamento")
      .limit(1)
      .maybeSingle()

    setConfiguracao(data)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    carregar()

    // Mantém a sidebar, o header e o login sincronizados em tempo real
    // sempre que a página de Configurações salvar alterações.
    const canal = supabase
      .channel("configuracoes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "configuracoes" },
        () => {
          carregar()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [carregar])

  const value = React.useMemo<ConfiguracaoContextValue>(
    () => ({
      configuracao,
      loading,
      nomeNegocio: configuracao?.nome_negocio || NOME_SISTEMA_PADRAO,
      logoUrl: configuracao?.logo_url ?? null,
      recarregar: carregar,
    }),
    [configuracao, loading, carregar]
  )

  return (
    <ConfiguracaoContext.Provider value={value}>{children}</ConfiguracaoContext.Provider>
  )
}

export function useConfiguracao() {
  const context = React.useContext(ConfiguracaoContext)
  if (!context) {
    throw new Error("useConfiguracao deve ser usado dentro de um ConfiguracaoProvider")
  }
  return context
}
