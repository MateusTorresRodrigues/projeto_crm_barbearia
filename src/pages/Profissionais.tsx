import { Plus, Scissors } from "lucide-react"
import * as React from "react"

import { ProfissionalCard } from "@/components/profissionais/ProfissionalCard"
import { ProfissionalFormDialog } from "@/components/profissionais/ProfissionalFormDialog"
import { Button } from "@/components/ui/button"
import { useConfirm } from "@/contexts/ConfirmDialogContext"
import { useToast } from "@/contexts/ToastContext"
import { type ProfissionalCompleto, useProfissionais } from "@/hooks/useProfissionais"
import { traduzErroAgendamento } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"

export default function Profissionais() {
  const { profissionais, loading, recarregar } = useProfissionais()
  const confirmar = useConfirm()
  const toast = useToast()

  const [dialogAberto, setDialogAberto] = React.useState(false)
  const [profissionalEditando, setProfissionalEditando] =
    React.useState<ProfissionalCompleto | null>(null)

  function abrirNovo() {
    setProfissionalEditando(null)
    setDialogAberto(true)
  }

  function abrirEdicao(p: ProfissionalCompleto) {
    setProfissionalEditando(p)
    setDialogAberto(true)
  }

  async function excluir(p: ProfissionalCompleto) {
    const confirmado = await confirmar({
      titulo: `Excluir ${p.nome}?`,
      descricao:
        "Essa ação também remove a agenda deste profissional e todos os agendamentos vinculados a ela. Não pode ser desfeita.",
      textoConfirmar: "Excluir profissional",
    })
    if (!confirmado) return

    const { error } = await supabase.from("profissionais").delete().eq("id", p.id)

    if (error) {
      toast({
        titulo: "Não foi possível excluir",
        descricao: traduzErroAgendamento(error),
        variante: "erro",
      })
      return
    }

    await registrarLog({ acao: "excluir", tabela: "profissionais", idRegistro: p.id, dadosAnteriores: p })
    toast({ titulo: "Profissional excluído", variante: "sucesso" })
    recarregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {profissionais.length} profissional(is) cadastrado(s)
        </p>
        <Button onClick={abrirNovo}>
          <Plus className="size-4" />
          Novo profissional
        </Button>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Carregando profissionais...
        </div>
      )}

      {!loading && profissionais.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
          <Scissors className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              Nenhum profissional cadastrado
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre o primeiro barbeiro para começar a montar as agendas.
            </p>
          </div>
          <Button onClick={abrirNovo}>
            <Plus className="size-4" />
            Novo profissional
          </Button>
        </div>
      )}

      {!loading && profissionais.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profissionais.map((p) => (
            <ProfissionalCard
              key={p.id}
              profissional={p}
              onEditar={() => abrirEdicao(p)}
              onExcluir={() => excluir(p)}
            />
          ))}
        </div>
      )}

      <ProfissionalFormDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        profissional={profissionalEditando}
        onSalvo={recarregar}
      />
    </div>
  )
}
