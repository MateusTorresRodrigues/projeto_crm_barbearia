import { Lock, Plus, RotateCcw, Trash2, Unlock } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useConfirm } from "@/contexts/ConfirmDialogContext"
import { useToast } from "@/contexts/ToastContext"
import { useComandaDetalhada } from "@/hooks/useComandaDetalhada"
import { useServicos } from "@/hooks/useServicos"
import { traduzErroAgendamento } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ComandaDetalhesDialog({
  open,
  onOpenChange,
  comandaId,
  onAtualizado,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  comandaId: string | null
  onAtualizado: () => void
}) {
  const toast = useToast()
  const confirmar = useConfirm()
  const { comanda, loading, recarregar } = useComandaDetalhada(comandaId)
  const { servicos } = useServicos(true)

  const [idServicoNovo, setIdServicoNovo] = React.useState("")
  const [precoNovo, setPrecoNovo] = React.useState("0")
  const [processando, setProcessando] = React.useState(false)

  React.useEffect(() => {
    if (servicos.length > 0 && !idServicoNovo) {
      setIdServicoNovo(servicos[0].id)
      setPrecoNovo(String(servicos[0].preco))
    }
  }, [servicos, idServicoNovo])

  const travada = comanda?.status === "fechada"

  function selecionarServicoNovo(id: string) {
    setIdServicoNovo(id)
    const s = servicos.find((sv) => sv.id === id)
    if (s) setPrecoNovo(String(s.preco))
  }

  async function adicionarServico() {
    if (!comanda || !idServicoNovo) return
    const preco = Number(precoNovo)
    if (Number.isNaN(preco) || preco < 0) {
      toast({ titulo: "Informe um preço válido", variante: "erro" })
      return
    }

    setProcessando(true)
    const { error } = await supabase
      .from("comanda_servicos")
      .insert({ id_comanda: comanda.id, id_servico: idServicoNovo, preco_cobrado: preco })
    setProcessando(false)

    if (error) {
      toast({ titulo: "Não foi possível adicionar o serviço", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({
      acao: "adicionar_servico",
      tabela: "comanda_servicos",
      idRegistro: comanda.id,
      dadosNovos: { id_servico: idServicoNovo, preco_cobrado: preco },
    })
    recarregar()
    onAtualizado()
  }

  async function editarPreco(comandaServicoId: string, precoAnterior: number, novoValor: string) {
    const preco = Number(novoValor)
    if (Number.isNaN(preco) || preco < 0 || preco === precoAnterior) return

    const { error } = await supabase
      .from("comanda_servicos")
      .update({ preco_cobrado: preco })
      .eq("id", comandaServicoId)

    if (error) {
      toast({ titulo: "Não foi possível atualizar o preço", descricao: traduzErroAgendamento(error), variante: "erro" })
      recarregar()
      return
    }

    await registrarLog({
      acao: "atualizar_preco_servico",
      tabela: "comanda_servicos",
      idRegistro: comandaServicoId,
      dadosAnteriores: { preco_cobrado: precoAnterior },
      dadosNovos: { preco_cobrado: preco },
    })
    recarregar()
    onAtualizado()
  }

  async function removerServico(comandaServicoId: string) {
    const { error } = await supabase.from("comanda_servicos").delete().eq("id", comandaServicoId)

    if (error) {
      toast({ titulo: "Não foi possível remover o serviço", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({ acao: "remover_servico", tabela: "comanda_servicos", idRegistro: comandaServicoId })
    recarregar()
    onAtualizado()
  }

  async function alternarStatus() {
    if (!comanda) return
    const novoStatus = comanda.status === "aberta" ? "fechada" : "aberta"

    const { error } = await supabase.from("comandas").update({ status: novoStatus }).eq("id", comanda.id)

    if (error) {
      toast({ titulo: "Não foi possível atualizar a comanda", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({
      acao: novoStatus === "fechada" ? "fechar" : "reabrir",
      tabela: "comandas",
      idRegistro: comanda.id,
      dadosAnteriores: { status: comanda.status },
      dadosNovos: { status: novoStatus },
    })
    toast({ titulo: novoStatus === "fechada" ? "Comanda fechada" : "Comanda reaberta", variante: "sucesso" })
    recarregar()
    onAtualizado()
  }

  async function excluirComanda() {
    if (!comanda) return
    const confirmado = await confirmar({
      titulo: "Excluir comanda?",
      descricao: "Essa ação remove a comanda e os serviços lançados nela. Não pode ser desfeita.",
      textoConfirmar: "Excluir comanda",
    })
    if (!confirmado) return

    const { error } = await supabase.from("comandas").delete().eq("id", comanda.id)

    if (error) {
      toast({ titulo: "Não foi possível excluir", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({ acao: "excluir", tabela: "comandas", idRegistro: comanda.id, dadosAnteriores: comanda })
    toast({ titulo: "Comanda excluída", variante: "sucesso" })
    onOpenChange(false)
    onAtualizado()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        {loading || !comanda ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando comanda...</p>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <DialogTitle>{comanda.cliente?.nome || comanda.cliente?.whatsapp || "Comanda"}</DialogTitle>
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    travada ? "bg-secondary text-muted-foreground" : "bg-primary/15 text-primary"
                  )}
                >
                  {travada ? <Lock className="size-3" /> : <Unlock className="size-3" />}
                  {travada ? "Fechada" : "Aberta"}
                </span>
              </div>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">
              Profissional: <span className="text-foreground">{comanda.profissional?.nome ?? "—"}</span>
            </p>

            <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/30 p-3 text-sm">
              <div>
                <p className="text-muted-foreground">Valor total</p>
                <p className="font-display text-lg font-semibold text-foreground">
                  {formatarMoeda(comanda.valor_total)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Comissão</p>
                <p className="font-display text-lg font-semibold text-primary">
                  {formatarMoeda(comanda.valor_comissao)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              {comanda.comanda_servicos.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum serviço lançado ainda.</p>
              )}
              {comanda.comanda_servicos.map((cs) => (
                <div key={cs.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <span className="flex-1 truncate text-sm text-foreground">{cs.servico?.nome ?? "Serviço"}</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    R$
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={cs.preco_cobrado}
                      disabled={travada}
                      onBlur={(e) => editarPreco(cs.id, cs.preco_cobrado, e.target.value)}
                      className="h-8 w-24"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={travada}
                    onClick={() => removerServico(cs.id)}
                    aria-label="Remover serviço"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            {!travada && (
              <div className="flex items-end gap-2 rounded-md border border-dashed border-border p-3">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">Serviço</label>
                  <select
                    value={idServicoNovo}
                    onChange={(e) => selecionarServicoNovo(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-secondary/60 px-2 text-sm text-foreground"
                  >
                    {servicos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-xs text-muted-foreground">Preço</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={precoNovo}
                    onChange={(e) => setPrecoNovo(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button type="button" size="sm" onClick={adicionarServico} disabled={processando || !idServicoNovo}>
                  <Plus className="size-4" /> Adicionar
                </Button>
              </div>
            )}

            <DialogFooter className="sm:justify-between">
              <Button variant="destructive" size="sm" onClick={excluirComanda}>
                <Trash2 className="size-4" /> Excluir comanda
              </Button>
              <Button size="sm" variant={travada ? "outline" : "default"} onClick={alternarStatus}>
                {travada ? (
                  <>
                    <RotateCcw className="size-4" /> Reabrir comanda
                  </>
                ) : (
                  <>
                    <Lock className="size-4" /> Fechar comanda
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
