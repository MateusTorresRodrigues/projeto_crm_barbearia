import * as React from "react"

import { BlocoAgendamento } from "@/components/agenda/BlocoAgendamento"
import type { ProfissionalCompleto } from "@/hooks/useProfissionais"
import { bandasDisponiveis, bandasIndisponiveis } from "@/lib/calendario"
import {
  ALTURA_HORA_PX,
  DIAS_SEMANA,
  HORA_FIM_GRADE,
  HORA_INICIO_GRADE,
  dataComHoraMinuto,
  formatarDiaMes,
  mesmodia,
} from "@/lib/horarios"
import type { AgendamentoDetalhado } from "@/lib/types"
import { cn } from "@/lib/utils"

const ALTURA_TOTAL = (HORA_FIM_GRADE - HORA_INICIO_GRADE) * ALTURA_HORA_PX
const HORAS = Array.from(
  { length: HORA_FIM_GRADE - HORA_INICIO_GRADE },
  (_, i) => HORA_INICIO_GRADE + i
)

/**
 * Versão de um único dia da grade da agenda. Usada como alternativa à
 * `GradeSemana` em telas pequenas, onde ver os 7 dias lado a lado exige um
 * scroll horizontal largo demais para ser confortável no celular.
 */
export function GradeDia({
  dia,
  profissionaisVisiveis,
  agendamentos,
  onClickSlot,
  onClickAgendamento,
  onReagendar,
}: {
  dia: Date
  profissionaisVisiveis: ProfissionalCompleto[]
  agendamentos: AgendamentoDetalhado[]
  onClickSlot: (data: Date) => void
  onClickAgendamento: (ag: AgendamentoDetalhado) => void
  onReagendar: (ag: AgendamentoDetalhado, novoInicio: Date) => void
}) {
  const arrastandoRef = React.useRef<{ id: string; offsetMin: number } | null>(null)
  const hoje = new Date()
  const colCount = Math.max(1, profissionaisVisiveis.length)

  const eventosDoDia = agendamentos.filter((a) => mesmodia(new Date(a.data_hora_inicio), dia))
  const escalasVisiveis = profissionaisVisiveis.flatMap((p) => p.escalas)
  const disponiveis = bandasDisponiveis(escalasVisiveis, dia.getDay())
  const indisponiveis = bandasIndisponiveis(disponiveis)
  const ehHoje = mesmodia(dia, hoje)

  function colIndexDoAgendamento(a: AgendamentoDetalhado) {
    const idx = profissionaisVisiveis.findIndex((p) => p.agenda?.id === a.id_agenda)
    return idx === -1 ? 0 : idx
  }

  function handleDragStart(e: React.DragEvent<HTMLButtonElement>, agendamentoId: string) {
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetMin = ((e.clientY - rect.top) / ALTURA_HORA_PX) * 60
    arrastandoRef.current = { id: agendamentoId, offsetMin }
    e.dataTransfer.effectAllowed = "move"
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const arrastando = arrastandoRef.current
    arrastandoRef.current = null
    if (!arrastando) return

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    let minutos = HORA_INICIO_GRADE * 60 + (y / ALTURA_HORA_PX) * 60 - arrastando.offsetMin
    minutos = Math.round(minutos / 15) * 15

    const agendamento = agendamentos.find((a) => a.id === arrastando.id)
    if (agendamento) {
      onReagendar(agendamento, dataComHoraMinuto(dia, minutos))
    }
  }

  function handleClickColuna(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    let minutos = HORA_INICIO_GRADE * 60 + (y / ALTURA_HORA_PX) * 60
    minutos = Math.round(minutos / 15) * 15
    onClickSlot(dataComHoraMinuto(dia, minutos))
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <div className="flex" style={{ minWidth: 56 + colCount * 90 }}>
        <div className="w-14 shrink-0 border-r border-border">
          <div className="h-12 border-b border-border" />
          {HORAS.map((h) => (
            <div
              key={h}
              style={{ height: ALTURA_HORA_PX }}
              className="border-b border-border/60 pr-2 text-right text-[11px] text-muted-foreground"
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="flex-1">
          <div
            className={cn(
              "flex h-12 items-center justify-center gap-2 border-b border-border text-xs",
              ehHoje && "bg-primary/10"
            )}
          >
            <span className="text-muted-foreground">{DIAS_SEMANA[dia.getDay()].label}</span>
            <span className={cn("font-display font-semibold", ehHoje ? "text-primary" : "text-foreground")}>
              {formatarDiaMes(dia)}
            </span>
          </div>

          <div
            className="relative cursor-pointer"
            style={{ height: ALTURA_TOTAL }}
            onClick={handleClickColuna}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {HORAS.map((h) => (
              <div key={h} style={{ height: ALTURA_HORA_PX }} className="border-b border-border/40" />
            ))}

            {indisponiveis.map((banda, i) => (
              <div
                key={i}
                className="pointer-events-none absolute inset-x-0 bg-background/70"
                style={{
                  top: ((banda.inicioMin - HORA_INICIO_GRADE * 60) / 60) * ALTURA_HORA_PX,
                  height: ((banda.fimMin - banda.inicioMin) / 60) * ALTURA_HORA_PX,
                }}
              />
            ))}

            {eventosDoDia.map((ag) => (
              <BlocoAgendamento
                key={ag.id}
                agendamento={ag}
                colIndex={colIndexDoAgendamento(ag)}
                colCount={colCount}
                onClick={() => onClickAgendamento(ag)}
                onDragStart={(e) => handleDragStart(e, ag.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
