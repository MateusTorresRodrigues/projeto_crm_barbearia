import { HORA_FIM_GRADE, HORA_INICIO_GRADE, horaParaMinutos } from "@/lib/horarios"
import type { Escala } from "@/lib/types"

export type Intervalo = { inicioMin: number; fimMin: number }

function mesclarIntervalos(intervalos: Intervalo[]): Intervalo[] {
  if (intervalos.length === 0) return []
  const ordenados = [...intervalos].sort((a, b) => a.inicioMin - b.inicioMin)
  const resultado: Intervalo[] = [{ ...ordenados[0] }]

  for (const atual of ordenados.slice(1)) {
    const ultimo = resultado[resultado.length - 1]
    if (atual.inicioMin <= ultimo.fimMin) {
      ultimo.fimMin = Math.max(ultimo.fimMin, atual.fimMin)
    } else {
      resultado.push({ ...atual })
    }
  }

  return resultado
}

/**
 * Retorna a união dos intervalos de disponibilidade (escala) de um conjunto
 * de profissionais para um dia da semana, recortada à faixa visível da
 * grade do calendário. Usada para "esmaecer" os horários fora da escala.
 */
export function bandasDisponiveis(escalas: Escala[], diaSemana: number): Intervalo[] {
  const limiteInicio = HORA_INICIO_GRADE * 60
  const limiteFim = HORA_FIM_GRADE * 60

  const intervalos = escalas
    .filter((e) => e.dia_semana === diaSemana)
    .map((e) => ({
      inicioMin: Math.max(horaParaMinutos(e.hora_inicio), limiteInicio),
      fimMin: Math.min(horaParaMinutos(e.hora_fim), limiteFim),
    }))
    .filter((i) => i.fimMin > i.inicioMin)

  return mesclarIntervalos(intervalos)
}

/** Complemento das bandas disponíveis dentro da faixa visível da grade — usado para esmaecer os horários fora da escala. */
export function bandasIndisponiveis(disponiveis: Intervalo[]): Intervalo[] {
  const limiteInicio = HORA_INICIO_GRADE * 60
  const limiteFim = HORA_FIM_GRADE * 60

  if (disponiveis.length === 0) {
    return [{ inicioMin: limiteInicio, fimMin: limiteFim }]
  }

  const ordenados = [...disponiveis].sort((a, b) => a.inicioMin - b.inicioMin)
  const resultado: Intervalo[] = []

  let cursor = limiteInicio
  for (const banda of ordenados) {
    if (banda.inicioMin > cursor) {
      resultado.push({ inicioMin: cursor, fimMin: banda.inicioMin })
    }
    cursor = Math.max(cursor, banda.fimMin)
  }
  if (cursor < limiteFim) {
    resultado.push({ inicioMin: cursor, fimMin: limiteFim })
  }

  return resultado
}
