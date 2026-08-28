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
import type { ClienteListado } from "@/hooks/useClientes"
import type { ProfissionalCompleto } from "@/hooks/useProfissionais"
import { traduzErroAgendamento } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"

export function ClienteFormDialog({
  open,
  onOpenChange,
  cliente,
  profissionais,
  onSalvo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = cadastro manual de um novo cliente */
  cliente: ClienteListado | null
  profissionais: ProfissionalCompleto[]
  onSalvo: () => void
}) {
  const toast = useToast()
  const editando = cliente !== null

  const [whatsapp, setWhatsapp] = React.useState("")
  const [nome, setNome] = React.useState("")
  const [barbeiroPreferido, setBarbeiroPreferido] = React.useState("")
  const [frequenciaVisita, setFrequenciaVisita] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    if (cliente) {
      setWhatsapp(cliente.whatsapp)
      setNome(cliente.nome ?? "")
      setBarbeiroPreferido(cliente.barbeiro_preferido ?? "")
      setFrequenciaVisita(cliente.frequencia_visita ? String(cliente.frequencia_visita) : "")
    } else {
      setWhatsapp("")
      setNome("")
      setBarbeiroPreferido("")
      setFrequenciaVisita("")
    }
  }, [open, cliente])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!whatsapp.trim()) {
      toast({ titulo: "Informe o WhatsApp do cliente", variante: "erro" })
      return
    }

    setSalvando(true)
    const payload = {
      whatsapp: whatsapp.trim(),
      nome: nome.trim() || null,
      barbeiro_preferido: barbeiroPreferido || null,
      frequencia_visita: frequenciaVisita ? Number(frequenciaVisita) : null,
      ...(editando ? {} : { tipo: "cliente" as const }),
    }

    const query = editando
      ? supabase.from("crm_barbearia").update(payload).eq("id", cliente!.id).select("id").single()
      : supabase.from("crm_barbearia").insert(payload).select("id").single()

    const { data, error } = await query
    setSalvando(false)

    if (error) {
      toast({
        titulo: "Não foi possível salvar",
        descricao: error.message.toLowerCase().includes("duplicate")
          ? "Já existe um cliente com esse WhatsApp."
          : traduzErroAgendamento(error),
        variante: "erro",
      })
      return
    }

    await registrarLog({
      acao: editando ? "atualizar" : "criar",
      tabela: "crm_barbearia",
      idRegistro: data.id,
      dadosNovos: payload,
    })

    toast({ titulo: editando ? "Cliente atualizado" : "Cliente cadastrado", variante: "sucesso" })
    onSalvo()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>Dados cadastrais do cliente.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="5511999998888"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barbeiro">Barbeiro preferido</Label>
            <select
              id="barbeiro"
              value={barbeiroPreferido}
              onChange={(e) => setBarbeiroPreferido(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
            >
              <option value="">Sem preferência</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequencia">Frequência de visita (dias)</Label>
            <Input
              id="frequencia"
              type="number"
              min={1}
              step="1"
              value={frequenciaVisita}
              onChange={(e) => setFrequenciaVisita(e.target.value)}
              placeholder="Ex.: 30"
            />
          </div>

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
