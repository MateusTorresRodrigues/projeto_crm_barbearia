import { Pencil, Phone, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ProfissionalCompleto } from "@/hooks/useProfissionais"
import { cn } from "@/lib/utils"

export function ProfissionalCard({
  profissional,
  onEditar,
  onExcluir,
}: {
  profissional: ProfissionalCompleto
  onEditar: () => void
  onExcluir: () => void
}) {
  const diasTrabalhados = profissional.escalas.length

  return (
    <Card className={cn(!profissional.ativo && "opacity-60")}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3">
          <span
            className="mt-0.5 size-3.5 shrink-0 rounded-full ring-2 ring-border"
            style={{ backgroundColor: profissional.agenda?.cor ?? "#666" }}
            title={`Cor da agenda: ${profissional.agenda?.cor ?? "—"}`}
          />
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">
              {profissional.nome}
            </h3>
            {!profissional.ativo && (
              <span className="text-xs font-medium text-destructive">Inativo</span>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEditar} aria-label="Editar profissional">
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExcluir}
            aria-label="Excluir profissional"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {profissional.telefone && (
          <p className="flex items-center gap-2">
            <Phone className="size-3.5" /> {profissional.telefone}
          </p>
        )}
        <p>
          Comissão: <span className="text-foreground">{profissional.comissao_percentual}%</span>
        </p>
        <p>
          Escala:{" "}
          <span className="text-foreground">
            {diasTrabalhados > 0 ? `${diasTrabalhados} dia(s) por semana` : "não definida"}
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
