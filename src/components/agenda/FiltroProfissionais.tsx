import type { ProfissionalCompleto } from "@/hooks/useProfissionais"
import { cn } from "@/lib/utils"

export function FiltroProfissionais({
  profissionais,
  selecionados,
  onChange,
}: {
  profissionais: ProfissionalCompleto[]
  selecionados: Set<string>
  onChange: (novo: Set<string>) => void
}) {
  function alternar(id: string) {
    const novo = new Set(selecionados)
    if (novo.has(id)) {
      novo.delete(id)
    } else {
      novo.add(id)
    }
    onChange(novo)
  }

  const todosSelecionados = selecionados.size === profissionais.length

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() =>
          onChange(todosSelecionados ? new Set() : new Set(profissionais.map((p) => p.id)))
        }
        className={cn(
          "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary",
          todosSelecionados && "border-primary text-primary"
        )}
      >
        {todosSelecionados ? "Limpar seleção" : "Selecionar todos"}
      </button>

      {profissionais.map((p) => {
        const ativo = selecionados.has(p.id)
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => alternar(p.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              ativo
                ? "border-transparent text-foreground"
                : "border-border text-muted-foreground hover:bg-secondary"
            )}
            style={ativo ? { backgroundColor: `${p.agenda?.cor ?? "#666"}33`, borderColor: p.agenda?.cor ?? "#666" } : undefined}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: p.agenda?.cor ?? "#666" }}
            />
            {p.nome}
            {!p.ativo && <span className="text-[10px] text-muted-foreground">(inativo)</span>}
          </button>
        )
      })}
    </div>
  )
}
