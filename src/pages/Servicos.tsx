import { Pencil, Plus, Scissors, Search, Trash2 } from "lucide-react"
import * as React from "react"

import { ServicoFormDialog } from "@/components/servicos/ServicoFormDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useConfirm } from "@/contexts/ConfirmDialogContext"
import { useToast } from "@/contexts/ToastContext"
import { useServicos } from "@/hooks/useServicos"
import { traduzErroAgendamento } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import type { Servico } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function Servicos() {
  const { servicos, loading, recarregar } = useServicos(false)
  const confirmar = useConfirm()
  const toast = useToast()

  const [busca, setBusca] = React.useState("")
  const [dialogAberto, setDialogAberto] = React.useState(false)
  const [servicoEditando, setServicoEditando] = React.useState<Servico | null>(null)

  const filtrados = servicos.filter((s) =>
    s.nome.toLowerCase().includes(busca.trim().toLowerCase())
  )

  function abrirNovo() {
    setServicoEditando(null)
    setDialogAberto(true)
  }

  function abrirEdicao(s: Servico) {
    setServicoEditando(s)
    setDialogAberto(true)
  }

  async function excluir(s: Servico) {
    const confirmado = await confirmar({
      titulo: `Excluir "${s.nome}"?`,
      descricao: "Essa ação não pode ser desfeita.",
      textoConfirmar: "Excluir serviço",
    })
    if (!confirmado) return

    const { error } = await supabase.from("servicos").delete().eq("id", s.id)

    if (error) {
      toast({ titulo: "Não foi possível excluir", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({ acao: "excluir", tabela: "servicos", idRegistro: s.id, dadosAnteriores: s })
    toast({ titulo: "Serviço excluído", variante: "sucesso" })
    recarregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="pl-9"
          />
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="size-4" />
          Novo serviço
        </Button>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Carregando serviços...
        </div>
      )}

      {!loading && filtrados.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
          <Scissors className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              {servicos.length === 0 ? "Nenhum serviço cadastrado" : "Nenhum serviço encontrado"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {servicos.length === 0
                ? "Cadastre o primeiro serviço do catálogo da barbearia."
                : "Tente ajustar o termo da busca."}
            </p>
          </div>
          {servicos.length === 0 && (
            <Button onClick={abrirNovo}>
              <Plus className="size-4" />
              Novo serviço
            </Button>
          )}
        </div>
      )}

      {!loading && filtrados.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Duração</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s) => (
                <tr key={s.id} className={cn("border-b border-border/60 last:border-b-0", !s.ativo && "opacity-60")}>
                  <td className="px-4 py-3 font-medium text-foreground">{s.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.duracao_minutos} min</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        s.ativo ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {s.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEdicao(s)} aria-label="Editar serviço">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => excluir(s)}
                        aria-label="Excluir serviço"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ServicoFormDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        servico={servicoEditando}
        onSalvo={recarregar}
      />
    </div>
  )
}
