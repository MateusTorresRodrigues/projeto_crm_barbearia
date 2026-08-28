// Edge Function `agente` — porta de entrada única para o agente de IA (n8n/Evolution
// API) gerenciar leads/clientes (`crm_barbearia`) e criar agendamentos.
//
// Autenticação: header `Authorization: Bearer <token>`, validado contra a tabela
// `api_tokens` (gerados pela aba "API" de Configurações). Não usa o JWT do Supabase
// Auth — por isso essa função é implantada com `verify_jwt = false`.
//
// Requisição: POST { action: string, payload?: object }
// Resposta:   { ok: true, data } | { ok: false, erro: string }

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  })
}

/** Erro conhecido, com um status HTTP e uma mensagem seguros para repassar ao agente. */
class ErroApi extends Error {
  status: number
  constructor(mensagem: string, status: number) {
    super(mensagem)
    this.status = status
  }
}

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

// O runtime da Edge Function roda em UTC, mas o negócio (e o banco, ver CLAUDE.md) opera em
// America/Sao_Paulo. O Brasil não observa horário de verão desde 2019, então o offset é fixo
// — por isso datas/horas sem timezone explícito são sempre interpretadas como -03:00 aqui,
// nunca com `new Date(...).getHours()`/`setHours()` (que dependeriam do fuso do servidor).
const OFFSET_FUSO_HORARIO = "-03:00"

/** Interpreta "YYYY-MM-DDTHH:MM[:SS]" sem timezone como horário de São Paulo; respeita um offset explícito, se houver. */
function instanteLocal(dataHoraTexto: string): Date {
  const temOffset = /Z$|[+-]\d{2}:\d{2}$/.test(dataHoraTexto)
  return new Date(temOffset ? dataHoraTexto : `${dataHoraTexto}${OFFSET_FUSO_HORARIO}`)
}

function minutosParaHHMM(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function hhmmParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/** Traduz mensagens dos triggers do banco para algo que o agente consiga entender e repassar ao cliente. */
function traduzirErroBanco(mensagem: string): string {
  if (mensagem.includes("Conflito de horário")) return mensagem
  if (mensagem.includes("Horário fora da escala")) {
    return "Esse horário está fora da escala de disponibilidade do profissional."
  }
  return mensagem || "Não foi possível concluir a ação."
}

/** Mesma função de `src/lib/logs.ts`, duplicada aqui porque a Edge Function roda em Deno,
 *  fora do bundle do front-end. Sempre grava com `id_usuario: null` — é assim que a tela
 *  de Logs reconhece uma ação como "Agente de IA" nas tabelas que o agente pode alterar. */
async function registrarLogAgente(params: {
  acao: string
  tabela: string
  idRegistro?: string
  dadosAnteriores?: unknown
  dadosNovos?: unknown
}) {
  try {
    await supabaseAdmin.from("logs_sistema").insert({
      id_usuario: null,
      acao: params.acao,
      tabela: params.tabela,
      id_registro: params.idRegistro ?? null,
      dados_anteriores: params.dadosAnteriores ?? null,
      dados_novos: params.dadosNovos ?? null,
    })
  } catch {
    // Log é auxiliar — nunca deve derrubar a ação principal do agente.
  }
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

const CAMPOS_LEAD_PERMITIDOS = [
  "nome",
  "status",
  "origem",
  "observacoes",
  "barbeiro_preferido",
  "frequencia_visita",
  "motivo_contato",
  "resumo_conversa",
  "ultima_mensagem",
  "follow_up_1",
  "follow_up_2",
] as const

const STATUS_VALIDOS = ["novo", "conversando", "agendado", "cancelou", "compareceu", "follow_up_1", "follow_up_2"]

/** Busca um lead/cliente pelo whatsapp. Retorna `null` se não existir (não é erro). */
async function buscarLead(payload: Record<string, unknown>) {
  const whatsapp = payload.whatsapp as string | undefined
  if (!whatsapp) throw new ErroApi("Informe o whatsapp.", 400)

  const { data, error } = await supabaseAdmin
    .from("crm_barbearia")
    .select("*")
    .eq("whatsapp", whatsapp)
    .maybeSingle()
  if (error) throw new ErroApi(error.message, 500)
  return data
}

/** Cria o lead se ainda não existir (por whatsapp) ou atualiza os campos informados. */
async function upsertLead(payload: Record<string, unknown>) {
  const whatsapp = payload.whatsapp as string | undefined
  if (!whatsapp) throw new ErroApi("Informe o whatsapp.", 400)

  if (payload.status !== undefined && !STATUS_VALIDOS.includes(payload.status as string)) {
    throw new ErroApi(`Status inválido. Use um de: ${STATUS_VALIDOS.join(", ")}.`, 400)
  }

  const campos: Record<string, unknown> = {}
  for (const chave of CAMPOS_LEAD_PERMITIDOS) {
    if (payload[chave] !== undefined) campos[chave] = payload[chave]
  }

  const { data: existente, error: erroBusca } = await supabaseAdmin
    .from("crm_barbearia")
    .select("*")
    .eq("whatsapp", whatsapp)
    .maybeSingle()
  if (erroBusca) throw new ErroApi(erroBusca.message, 500)

  if (existente) {
    if (Object.keys(campos).length === 0) return existente
    const { data, error } = await supabaseAdmin
      .from("crm_barbearia")
      .update(campos)
      .eq("id", existente.id)
      .select("*")
      .single()
    if (error) throw new ErroApi(error.message, 500)

    await registrarLogAgente({
      acao: "atualizar",
      tabela: "crm_barbearia",
      idRegistro: existente.id,
      dadosAnteriores: existente,
      dadosNovos: campos,
    })
    return data
  }

  const { data, error } = await supabaseAdmin
    .from("crm_barbearia")
    .insert({ whatsapp, tipo: "lead", status: "novo", ...campos })
    .select("*")
    .single()
  if (error) throw new ErroApi(error.message, 500)

  await registrarLogAgente({ acao: "criar", tabela: "crm_barbearia", idRegistro: data.id, dadosNovos: data })
  return data
}

async function listarServicos() {
  const { data, error } = await supabaseAdmin.from("servicos").select("*").eq("ativo", true).order("nome")
  if (error) throw new ErroApi(error.message, 500)
  return data
}

async function listarProfissionais() {
  const { data, error } = await supabaseAdmin
    .from("profissionais")
    .select("*, agenda:agendas(id)")
    .eq("ativo", true)
    .order("nome")
  if (error) throw new ErroApi(error.message, 500)
  return data
}

/** Horários livres ("HH:MM") de um profissional num dia, cruzando escala × agendamentos existentes. */
async function disponibilidade(payload: Record<string, unknown>) {
  const idProfissional = payload.id_profissional as string | undefined
  const data = payload.data as string | undefined
  if (!idProfissional || !data) {
    throw new ErroApi("Informe id_profissional e data (YYYY-MM-DD).", 400)
  }
  const duracao = typeof payload.duracao_minutos === "number" && payload.duracao_minutos > 0
    ? payload.duracao_minutos
    : 30

  // Meio-dia evita qualquer ambiguidade de fuso ao descobrir o dia da semana.
  const diaSemana = instanteLocal(`${data}T12:00:00`).getUTCDay()

  const [{ data: escalas, error: erroEscalas }, { data: agenda, error: erroAgenda }] = await Promise.all([
    supabaseAdmin.from("escalas").select("*").eq("id_profissional", idProfissional).eq("dia_semana", diaSemana),
    supabaseAdmin.from("agendas").select("id").eq("id_profissional", idProfissional).maybeSingle(),
  ])
  if (erroEscalas) throw new ErroApi(erroEscalas.message, 500)
  if (erroAgenda) throw new ErroApi(erroAgenda.message, 500)
  if (!agenda) throw new ErroApi("Profissional sem agenda cadastrada.", 404)
  if (!escalas || escalas.length === 0) return []

  const inicioDia = instanteLocal(`${data}T00:00:00`)
  const fimDia = instanteLocal(`${data}T23:59:59`)

  const { data: agendamentos, error: erroAgendamentos } = await supabaseAdmin
    .from("agendamentos")
    .select("data_hora_inicio, data_hora_fim")
    .eq("id_agenda", agenda.id)
    .neq("status", "cancelou")
    .gte("data_hora_inicio", inicioDia.toISOString())
    .lte("data_hora_inicio", fimDia.toISOString())
  if (erroAgendamentos) throw new ErroApi(erroAgendamentos.message, 500)

  const ocupados = (agendamentos ?? []).map((a) => ({
    inicio: new Date(a.data_hora_inicio).getTime(),
    fim: new Date(a.data_hora_fim).getTime(),
  }))

  const horarios: string[] = []
  for (const escala of escalas) {
    const inicioMin = hhmmParaMinutos(String(escala.hora_inicio).slice(0, 5))
    const fimMin = hhmmParaMinutos(String(escala.hora_fim).slice(0, 5))

    for (let minuto = inicioMin; minuto + duracao <= fimMin; minuto += duracao) {
      const inicioSlot = instanteLocal(`${data}T${minutosParaHHMM(minuto)}:00`).getTime()
      const fimSlot = inicioSlot + duracao * 60_000
      const conflita = ocupados.some((o) => inicioSlot < o.fim && fimSlot > o.inicio)
      if (!conflita) horarios.push(minutosParaHHMM(minuto))
    }
  }

  return horarios.sort()
}

/** Cria (ou reaproveita) o lead pelo whatsapp e insere o agendamento — conflitos e escala são validados pelo trigger do banco. */
async function criarAgendamento(payload: Record<string, unknown>) {
  const whatsapp = payload.whatsapp as string | undefined
  const idServico = payload.id_servico as string | undefined
  const idProfissional = payload.id_profissional as string | undefined
  const dataHoraInicio = payload.data_hora_inicio as string | undefined

  if (!whatsapp || !idServico || !idProfissional || !dataHoraInicio) {
    throw new ErroApi("Informe whatsapp, id_servico, id_profissional e data_hora_inicio.", 400)
  }

  const { data: servico, error: erroServico } = await supabaseAdmin
    .from("servicos")
    .select("*")
    .eq("id", idServico)
    .maybeSingle()
  if (erroServico) throw new ErroApi(erroServico.message, 500)
  if (!servico) throw new ErroApi("Serviço não encontrado.", 404)

  const { data: agenda, error: erroAgenda } = await supabaseAdmin
    .from("agendas")
    .select("id")
    .eq("id_profissional", idProfissional)
    .maybeSingle()
  if (erroAgenda) throw new ErroApi(erroAgenda.message, 500)
  if (!agenda) throw new ErroApi("Profissional sem agenda cadastrada.", 404)

  const cliente = (await upsertLead({ whatsapp, nome: payload.nome })) as { id: string }

  const inicio = instanteLocal(dataHoraInicio)
  if (Number.isNaN(inicio.getTime())) throw new ErroApi("data_hora_inicio inválida.", 400)
  const fim = new Date(inicio.getTime() + servico.duracao_minutos * 60_000)

  const novoAgendamento = {
    id_agenda: agenda.id,
    id_cliente: cliente.id,
    id_servico: idServico,
    data_hora_inicio: inicio.toISOString(),
    data_hora_fim: fim.toISOString(),
    status: "agendado",
  }

  const { data: agendamento, error } = await supabaseAdmin
    .from("agendamentos")
    .insert(novoAgendamento)
    .select("*")
    .single()
  if (error) throw new ErroApi(traduzirErroBanco(error.message), 409)

  await registrarLogAgente({
    acao: "criar",
    tabela: "agendamentos",
    idRegistro: agendamento.id,
    dadosNovos: novoAgendamento,
  })

  return agendamento
}

const ACOES: Record<string, (payload: Record<string, unknown>) => Promise<unknown>> = {
  buscar_lead: buscarLead,
  upsert_lead: upsertLead,
  listar_servicos: listarServicos,
  listar_profissionais: listarProfissionais,
  disponibilidade,
  criar_agendamento: criarAgendamento,
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== "POST") return jsonResponse({ ok: false, erro: "Use POST." }, 405)

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim()
  if (!token) return jsonResponse({ ok: false, erro: "Token ausente. Envie Authorization: Bearer <token>." }, 401)

  const { data: tokenRow, error: erroToken } = await supabaseAdmin
    .from("api_tokens")
    .select("id, ativo")
    .eq("token", token)
    .maybeSingle()

  if (erroToken || !tokenRow || !tokenRow.ativo) {
    return jsonResponse({ ok: false, erro: "Token inválido ou inativo." }, 401)
  }

  // Best-effort — não bloqueia a resposta.
  supabaseAdmin.from("api_tokens").update({ ultimo_uso_em: new Date().toISOString() }).eq("id", tokenRow.id).then(
    () => {},
    () => {}
  )

  let body: { action?: string; payload?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ ok: false, erro: "Corpo da requisição inválido (era esperado JSON)." }, 400)
  }

  const acao = body.action
  if (!acao || !(acao in ACOES)) {
    return jsonResponse({ ok: false, erro: `Ação desconhecida. Use uma de: ${Object.keys(ACOES).join(", ")}.` }, 400)
  }

  try {
    const resultado = await ACOES[acao](body.payload ?? {})
    return jsonResponse({ ok: true, data: resultado })
  } catch (erro) {
    if (erro instanceof ErroApi) {
      return jsonResponse({ ok: false, erro: erro.message }, erro.status)
    }
    console.error(erro)
    return jsonResponse({ ok: false, erro: "Erro interno." }, 500)
  }
})
