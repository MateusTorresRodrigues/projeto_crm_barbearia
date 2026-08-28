import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/contexts/ToastContext"
import { traduzErroAgendamento } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import type { Servico } from "@/lib/types"

export function ServicoFormDialog({
  open,
  onOpenChange,
  servico,
  onSalvo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = cadastro de um novo serviço */
  servico: Servico | null
  onSalvo: () => void
}) {
  const toast = useToast()
  const editando = servico !== null

  const [nome, setNome] = React.useState("")
  const [duracao, setDuracao] = React.useState("30")
  const [preco, setPreco] = React.useState("0")
  const [ativo, setAtivo] = React.useState(true)
  const [salvando, setSalvando] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    if (servico) {
      setNome(servico.nome)
      setDuracao(String(servico.duracao_minutos))
      setPreco(String(servico.preco))
      setAtivo(servico.ativo)
    } else {
      setNome("")
      setDuracao("30")
      setPreco("0")
      setAtivo(true)
    }
  }, [open, servico])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!nome.trim()) {
      toast({ titulo: "Informe o nome do serviço", variante: "erro" })
      return
    }
    const duracaoNum = Number(duracao)
    const precoNum = Number(preco)
    if (!duracaoNum || duracaoNum <= 0) {
      toast({ titulo: "Informe uma duração válida (em minutos)", variante: "erro" })
      return
    }
    if (Number.isNaN(precoNum) || precoNum < 0) {
      toast({ titulo: "Informe um preço válido", variante: "erro" })
      return
    }

    setSalvando(true)
    const payload = {
      nome: nome.trim(),
      duracao_minutos: duracaoNum,
      preco: precoNum,
      ativo,
    }

    const query = editando
      ? supabase.from("servicos").update(payload).eq("id", servico!.id).select("id").single()
      : supabase.from("servicos").insert(payload).select("id").single()

    const { data, error } = await query
    setSalvando(false)

    if (error) {
      toast({ titulo: "Não foi possível salvar", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({
      acao: editando ? "atualizar" : "criar",
      tabela: "servicos",
      idRegistro: data.id,
      dadosNovos: payload,
    })

    toast({ titulo: editando ? "Serviço atualizado" : "Serviço cadastrado", variante: "sucesso" })
    onSalvo()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          <DialogDescription>
            {editando
              ? "Serviços inativos deixam de aparecer em novos agendamentos e comandas, mas continuam no histórico."
              : "Informe os dados do serviço oferecido pela barbearia."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (min) *</Label>
              <Input
                id="duracao"
                type="number"
                min={1}
                step="1"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$) *</Label>
              <Input
                id="preco"
                type="number"
                min={0}
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                required
              />
            </div>
          </div>

          {editando && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="size-4 rounded border-border bg-input accent-primary"
              />
              Serviço ativo (aparece como opção em novos agendamentos e comandas)
            </label>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
