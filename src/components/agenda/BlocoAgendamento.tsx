import { CheckCircle2, XCircle } from "lucide-react"

import { ALTURA_HORA_PX, HORA_INICIO_GRADE, formatarHoraMinuto, minutosDoDia } from "@/lib/horarios"
import type { AgendamentoDetalhado } from "@/lib/types"
import { cn } from "@/lib/utils"

export function BlocoAgendamento({
  agendamento,
  colIndex,
  colCount,
  onClick,
  onDragStart,
}: {
  agendamento: AgendamentoDetalhado
  colIndex: number
  colCount: number
  onClick: () => void
  onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void
}) {
  const inicio = new Date(agendamento.data_hora_inicio)
  const fim = new Date(agendamento.data_hora_fim)
  const inicioMin = minutosDoDia(inicio)
  const duracaoMin = Math.max(15, (fim.getTime() - inicio.getTime()) / 60000)

  const top = ((inicioMin - HORA_INICIO_GRADE * 60) / 60) * ALTURA_HORA_PX
  const altura = Math.max(20, (duracaoMin / 60) * ALTURA_HORA_PX - 2)
  const largura = 100 / colCount
  const cor = agendamento.agenda?.cor ?? "#888"

  const cancelado = agendamento.status === "cancelou"
  const faltou = agendamento.status === "faltou"
  const compareceu = agendamento.status === "compareceu"

  return (
    <button
      type="button"
      draggable={agendamento.status === "agendado"}
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{
        top,
        height: altura,
        left: `${colIndex * largura}%`,
        width: `calc(${largura}% - 3px)`,
        backgroundColor: `${cor}${cancelado ? "1a" : "33"}`,
        borderLeftColor: compareceu ? "#22c55e" : faltou ? "#f97316" : cancelado ? "#ef4444" : cor,
      }}
      className={cn(
        "absolute z-10 overflow-hidden rounded-md border-l-4 px-1.5 py-0.5 text-left text-xs shadow-sm transition-opacity hover:opacity-90",
        cancelado && "opacity-60 line-through",
        agendamento.status === "agendado" && "cursor-grab active:cursor-grabbing"
      )}
    >
      <p className="truncate font-medium text-foreground">
        {agendamento.cliente?.nome || agendamento.cliente?.whatsapp || "Cliente"}
      </p>
      <p className="truncate text-muted-foreground">
        {formatarHoraMinuto(inicio)} · {agendamento.servico?.nome ?? ""}
      </p>
      {compareceu && <CheckCircle2 className="absolute right-1 top-1 size-3 text-green-500" />}
      {faltou && <XCircle className="absolute right-1 top-1 size-3 text-orange-500" />}
    </button>
  )
}
