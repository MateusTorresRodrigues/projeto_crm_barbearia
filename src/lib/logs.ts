import { supabase } from "@/lib/supabase"

/**
 * Registra uma ação em `logs_sistema`. É "best-effort": nunca lança erro e
 * nunca bloqueia a ação principal — se o usuário autenticado ainda não tiver
 * uma linha correspondente em `usuarios` (FK de logs_sistema.id_usuario), o
 * log simplesmente falha silenciosamente em vez de quebrar a tela.
 */
export async function registrarLog(params: {
  acao: string
  tabela?: string
  idRegistro?: string
  dadosAnteriores?: unknown
  dadosNovos?: unknown
}) {
  try {
    const { data } = await supabase.auth.getUser()
    await supabase.from("logs_sistema").insert({
      id_usuario: data.user?.id ?? null,
      acao: params.acao,
      tabela: params.tabela ?? null,
      id_registro: params.idRegistro ?? null,
      dados_anteriores: params.dadosAnteriores ?? null,
      dados_novos: params.dadosNovos ?? null,
    })
  } catch {
    // Log é auxiliar — nunca deve impedir a ação principal do usuário.
  }
}
