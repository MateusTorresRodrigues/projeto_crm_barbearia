import { DIAS_SEMANA } from "@/lib/horarios"
import { cn } from "@/lib/utils"

export type LinhaEscala = {
  diaSemana: number
  trabalha: boolean
  horaInicio: string
  horaFim: string
}

export function escalasIniciais(): LinhaEscala[] {
  return DIAS_SEMANA.map((d) => ({
    diaSemana: d.valor,
    trabalha: false,
    horaInicio: "09:00",
    horaFim: "18:00",
  }))
}

export function EscalaEditor({
  value,
  onChange,
}: {
  value: LinhaEscala[]
  onChange: (novo: LinhaEscala[]) => void
}) {
  function atualizarDia(diaSemana: number, patch: Partial<LinhaEscala>) {
    onChange(value.map((l) => (l.diaSemana === diaSemana ? { ...l, ...patch } : l)))
  }

  return (
    <div className="space-y-2">
      {DIAS_SEMANA.map((dia) => {
        const linha = value.find((l) => l.diaSemana === dia.valor)!
        const invalido = linha.trabalha && linha.horaFim <= linha.horaInicio

        return (
          <div
            key={dia.valor}
            className={cn(
              "flex flex-col gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3",
              !linha.trabalha && "opacity-60"
            )}
          >
            <label className="flex items-center gap-2 text-sm font-medium text-foreground sm:w-32 sm:shrink-0">
              <input
                type="checkbox"
                checked={linha.trabalha}
                onChange={(e) => atualizarDia(dia.valor, { trabalha: e.target.checked })}
                className="size-4 shrink-0 rounded border-border bg-input accent-primary"
              />
              {dia.label}
            </label>

            <div className="flex items-center gap-2 text-sm">
              <input
                type="time"
                value={linha.horaInicio}
                disabled={!linha.trabalha}
                onChange={(e) => atualizarDia(dia.valor, { horaInicio: e.target.value })}
                className="min-w-0 flex-1 rounded-md border border-input bg-secondary/60 px-2 py-1 text-sm text-foreground disabled:opacity-50 sm:flex-none"
              />
              <span className="shrink-0 text-muted-foreground">até</span>
              <input
                type="time"
                value={linha.horaFim}
                disabled={!linha.trabalha}
                onChange={(e) => atualizarDia(dia.valor, { horaFim: e.target.value })}
                className="min-w-0 flex-1 rounded-md border border-input bg-secondary/60 px-2 py-1 text-sm text-foreground disabled:opacity-50 sm:flex-none"
              />
            </div>

            {invalido && (
              <span className="text-xs text-destructive">Horário final deve ser após o inicial</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
