export const DIAS_SEMANA = [
  { valor: 0, curto: "Dom", label: "Domingo" },
  { valor: 1, curto: "Seg", label: "Segunda-feira" },
  { valor: 2, curto: "Ter", label: "Terça-feira" },
  { valor: 3, curto: "Qua", label: "Quarta-feira" },
  { valor: 4, curto: "Qui", label: "Quinta-feira" },
  { valor: 5, curto: "Sex", label: "Sexta-feira" },
  { valor: 6, curto: "Sáb", label: "Sábado" },
] as const

/** Início da grade do calendário (hora do dia, 0–23). */
export const HORA_INICIO_GRADE = 7
/** Fim da grade do calendário (hora do dia, 0–23). */
export const HORA_FIM_GRADE = 21
/** Altura, em pixels, de um bloco de 60 minutos na grade do calendário. */
export const ALTURA_HORA_PX = 64

export function formatarHora(hhmmss: string): string {
  return hhmmss.slice(0, 5)
}

export function inicioDaSemana(data: Date): Date {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function adicionarDias(data: Date, dias: number): Date {
  const d = new Date(data)
  d.setDate(d.getDate() + dias)
  return d
}

export function mesmodia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatarDiaMes(data: Date): string {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

export function formatarDiaSemanaCurto(data: Date): string {
  return DIAS_SEMANA[data.getDay()].curto
}

export function formatarMesAno(data: Date): string {
  const texto = data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function formatarHoraMinuto(data: Date): string {
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

/** Minutos desde a meia-noite de um horário local "HH:MM:SS" ou "HH:MM". */
export function horaParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

export function minutosDoDia(data: Date): number {
  return data.getHours() * 60 + data.getMinutes()
}

export function dataComHoraMinuto(base: Date, minutosDoDiaValor: number): Date {
  const d = new Date(base)
  d.setHours(0, minutosDoDiaValor, 0, 0)
  return d
}

/** Formata a distância entre uma data passada e agora em texto relativo, em português. */
export function formatarTempoRelativo(data: Date): string {
  const diffMs = Date.now() - data.getTime()
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDias <= 0) return "Hoje"
  if (diffDias === 1) return "Ontem"
  if (diffDias < 30) return `Há ${diffDias} dias`
  if (diffDias < 365) {
    const meses = Math.floor(diffDias / 30)
    return `Há ${meses} ${meses === 1 ? "mês" : "meses"}`
  }
  const anos = Math.floor(diffDias / 365)
  return `Há ${anos} ${anos === 1 ? "ano" : "anos"}`
}

export function inicioDoDia(data: Date): Date {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  return d
}

export function fimDoDia(data: Date): Date {
  const d = new Date(data)
  d.setHours(23, 59, 59, 999)
  return d
}

export function inicioDoMes(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), 1)
}

export function fimDoMes(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59, 999)
}

/** "YYYY-MM-DD", para inputs `type="date"`. */
export function paraCampoData(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`
}

/** "YYYY-MM", para inputs `type="month"`. */
export function paraCampoMes(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}`
}

export function formatarDataCompleta(data: Date): string {
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/** Traduz mensagens de erro do Postgres/triggers para um texto amigável. */
export function traduzErroAgendamento(erro: unknown): string {
  const mensagem = erro instanceof Error ? erro.message : String(erro)

  if (mensagem.includes("Conflito de horário")) {
    return mensagem
  }
  if (mensagem.includes("Horário fora da escala")) {
    return "Esse horário está fora da escala de disponibilidade do profissional."
  }
  if (mensagem.toLowerCase().includes("duplicate key")) {
    return "Já existe um registro com esses dados."
  }
  if (mensagem.toLowerCase().includes("violates foreign key")) {
    return "Não foi possível concluir: existem registros vinculados a este item."
  }
  return mensagem || "Não foi possível concluir a ação. Tente novamente."
}
