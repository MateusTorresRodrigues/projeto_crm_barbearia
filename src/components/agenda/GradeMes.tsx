import type { ProfissionalCompleto } from "@/hooks/useProfissionais"
import {
  DIAS_SEMANA,
  adicionarDias,
  formatarHoraMinuto,
  inicioDaSemana,
  mesmodia,
} from "@/lib/horarios"
import type { AgendamentoDetalhado } from "@/lib/types"
import { cn } from "@/lib/utils"

const MAX_VISIVEIS = 3

export function GradeMes({
  mesReferencia,
  profissionaisVisiveis,
  agendamentos,
  onSelecionarDia,
  onClickAgendamento,
}: {
  mesReferencia: Date
  profissionaisVisiveis: ProfissionalCompleto[]
  agendamentos: AgendamentoDetalhado[]
  onSelecionarDia: (dia: Date) => void
  onClickAgendamento: (ag: AgendamentoDetalhado) => void
}) {
  const hoje = new Date()
  const mesAtual = mesReferencia.getMonth()
  const inicioGrade = inicioDaSemana(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1))
  const dias = Array.from({ length: 42 }, (_, i) => adicionarDias(inicioGrade, i))

  function agendamentosDoDia(dia: Date) {
    return agendamentos
      .filter((a) => mesmodia(new Date(a.data_hora_inicio), dia))
      .sort((a, b) => a.data_hora_inicio.localeCompare(b.data_hora_inicio))
  }

  function corDoAgendamento(a: AgendamentoDetalhado) {
    return (
      profissionaisVisiveis.find((p) => p.agenda?.id === a.id_agenda)?.agenda?.cor ??
      a.agenda?.cor ??
      "#888"
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {DIAS_SEMANA.map((d) => (
          <div key={d.valor} className="border-r border-border p-2 text-center text-xs font-medium text-muted-foreground last:border-r-0">
            {d.curto}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {dias.map((dia) => {
          const doMesAtual = dia.getMonth() === mesAtual
          const ehHoje = mesmodia(dia, hoje)
          const eventos = agendamentosDoDia(dia)
          const visiveis = eventos.slice(0, MAX_VISIVEIS)
          const restante = eventos.length - visiveis.length

          return (
            <button
              key={dia.toISOString()}
              type="button"
              onClick={() => onSelecionarDia(dia)}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-b border-r border-border p-1.5 text-left transition-colors hover:bg-secondary/60",
                !doMesAtual && "bg-background/40 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  ehHoje && "bg-primary text-primary-foreground",
                  !ehHoje && doMesAtual && "text-foreground"
                )}
              >
                {dia.getDate()}
              </span>

              <div className="space-y-0.5">
                {visiveis.map((ag) => (
                  <div
                    key={ag.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onClickAgendamento(ag)
                    }}
                    className={cn(
                      "truncate rounded px-1 py-0.5 text-[11px] text-foreground",
                      ag.status === "cancelou" && "opacity-50 line-through"
                    )}
                    style={{ backgroundColor: `${corDoAgendamento(ag)}33` }}
                  >
                    {formatarHoraMinuto(new Date(ag.data_hora_inicio))} {ag.cliente?.nome || ""}
                  </div>
                ))}
                {restante > 0 && (
                  <p className="px-1 text-[11px] text-muted-foreground">+{restante} mais</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
