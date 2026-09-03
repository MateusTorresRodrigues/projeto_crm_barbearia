export type Profissional = {
  id: string
  nome: string
  telefone: string | null
  comissao_percentual: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export type Agenda = {
  id: string
  id_profissional: string
  cor: string
  created_at: string
  updated_at: string
}

export type Escala = {
  id: string
  id_profissional: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  created_at: string
  updated_at: string
}

export type Servico = {
  id: string
  nome: string
  duracao_minutos: number
  preco: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export type StatusAgendamento = "agendado" | "cancelou" | "compareceu" | "faltou"

export type Agendamento = {
  id: string
  id_agenda: string
  id_cliente: string
  id_servico: string
  data_hora_inicio: string
  data_hora_fim: string
  status: StatusAgendamento
  created_at: string
  updated_at: string
}

export type StatusCrm =
  | "novo"
  | "conversando"
  | "agendado"
  | "cancelou"
  | "compareceu"
  | "follow_up_1"
  | "follow_up_2"

export type ClienteCRM = {
  id: string
  whatsapp: string
  nome: string | null
  tipo: "lead" | "cliente"
  status: string
}

/** Linha completa da tabela principal do CRM (`crm_barbearia`). */
export type CrmBarbearia = {
  id: string
  whatsapp: string
  nome: string | null
  tipo: "lead" | "cliente"
  status: StatusCrm
  origem: string | null
  observacoes: string | null
  barbeiro_preferido: string | null
  frequencia_visita: number | null
  motivo_contato: string | null
  resumo_conversa: string | null
  inicio_atendimento: string | null
  ultima_mensagem: string | null
  minutos_ultima_mensagem: number | null
  data_agendamento: string | null
  id_agendamento: string | null
  follow_up_1: string | null
  follow_up_2: string | null
  created_at: string
  updated_at: string
}

export type StatusComanda = "aberta" | "fechada"

export type Comanda = {
  id: string
  id_agendamento: string | null
  id_cliente: string
  id_profissional: string
  valor_total: number
  valor_comissao: number
  status: StatusComanda
  created_at: string
  updated_at: string
}

export type ComandaServico = {
  id: string
  id_comanda: string
  id_servico: string
  preco_cobrado: number
  created_at: string
}

/** Profissional com a agenda (cor) já unida — o formato usado nas telas. */
export type ProfissionalComAgenda = Profissional & {
  agenda: Agenda | null
}

/** Agendamento com os dados relacionados já unidos, para renderização direta no calendário. */
export type AgendamentoDetalhado = Agendamento & {
  cliente: ClienteCRM | null
  servico: Servico | null
  agenda: (Agenda & { profissional: Profissional | null }) | null
}

/** Comanda com cliente e profissional já unidos — usada na listagem e nos filtros. */
export type ComandaListada = Comanda & {
  cliente: ClienteCRM | null
  profissional: Profissional | null
}

export type ComandaServicoDetalhado = ComandaServico & { servico: Servico | null }

/** Comanda completa, com os itens (`comanda_servicos`) já unidos — usada na tela de detalhes. */
export type ComandaDetalhada = ComandaListada & {
  comanda_servicos: ComandaServicoDetalhado[]
}

/** Usuário da equipe com acesso ao sistema (cadastrado manualmente via Supabase). */
export type Usuario = {
  id: string
  nome: string
  email: string
  created_at: string
  updated_at: string
}

/** Linha de `logs_sistema` — registro de uma ação realizada na tela. */
export type LogSistema = {
  id: string
  id_usuario: string | null
  acao: string
  tabela: string | null
  id_registro: string | null
  dados_anteriores: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  created_at: string
}

/** Log com o usuário responsável já unido — usado na tela de Logs. */
export type LogSistemaDetalhado = LogSistema & { usuario: Usuario | null }
