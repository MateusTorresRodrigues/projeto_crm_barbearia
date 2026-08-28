import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import * as React from "react"

import { supabase } from "@/lib/supabase"
import type { CrmBarbearia } from "@/lib/types"

/**
 * Carrega todos os registros de `crm_barbearia` e mantém a lista sincronizada
 * em tempo real via Supabase Realtime — usado pelo Kanban de Leads para que
 * os cards se movam sozinhos quando o status for atualizado pelo agente de
 * IA (n8n/Evolution API) ou por outro usuário.
 */
export function useLeadsRealtime() {
  const [leads, setLeads] = React.useState<CrmBarbearia[]>([])
  const [loading, setLoading] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const carregar = React.useCallback(async () => {
    setLoading(true)
    setErro(null)

    const { data, error } = await supabase
      .from("crm_barbearia")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    setLeads(data ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => {
    carregar()
  }, [carregar])

  React.useEffect(() => {
    const canal = supabase
      .channel("crm_barbearia-kanban")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crm_barbearia" },
        (payload: RealtimePostgresChangesPayload<CrmBarbearia>) => {
          setLeads((atual) => {
            if (payload.eventType === "INSERT") {
              if (atual.some((l) => l.id === payload.new.id)) return atual
              return [payload.new, ...atual]
            }
            if (payload.eventType === "UPDATE") {
              return atual.map((l) => (l.id === payload.new.id ? payload.new : l))
            }
            if (payload.eventType === "DELETE") {
              return atual.filter((l) => l.id !== payload.old.id)
            }
            return atual
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  /** Atualização otimista local — a confirmação/reconciliação final vem do Realtime. */
  const atualizarLocal = React.useCallback((id: string, patch: Partial<CrmBarbearia>) => {
    setLeads((atual) => atual.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [])

  return { leads, loading, erro, recarregar: carregar, atualizarLocal }
}
