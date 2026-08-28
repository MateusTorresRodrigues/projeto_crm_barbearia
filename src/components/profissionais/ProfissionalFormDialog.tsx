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
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/contexts/ToastContext"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import { traduzErroAgendamento } from "@/lib/horarios"
import type { ProfissionalCompleto } from "@/hooks/useProfissionais"
import {
  EscalaEditor,
  escalasIniciais,
  type LinhaEscala,
} from "@/components/profissionais/EscalaEditor"

export function ProfissionalFormDialog({
  open,
  onOpenChange,
  profissional,
  onSalvo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = cadastro de um novo profissional */
  profissional: ProfissionalCompleto | null
  onSalvo: () => void
}) {
  const toast = useToast()
  const [nome, setNome] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [comissao, setComissao] = React.useState("50")
  const [ativo, setAtivo] = React.useState(true)
  const [escalas, setEscalas] = React.useState<LinhaEscala[]>(escalasIniciais())
  const [salvando, setSalvando] = React.useState(false)

  const editando = profissional !== null

  React.useEffect(() => {
    if (!open) return

    if (profissional) {
      setNome(profissional.nome)
      setTelefone(profissional.telefone ?? "")
      setComissao(String(profissional.comissao_percentual))
      setAtivo(profissional.ativo)
      const base = escalasIniciais()
      for (const e of profissional.escalas) {
        const linha = base.find((l) => l.diaSemana === e.dia_semana)
        if (linha) {
          linha.trabalha = true
          linha.horaInicio = e.hora_inicio.slice(0, 5)
          linha.horaFim = e.hora_fim.slice(0, 5)
        }
      }
      setEscalas(base)
    } else {
      setNome("")
      setTelefone("")
      setComissao("50")
      setAtivo(true)
      setEscalas(escalasIniciais())
    }
  }, [open, profissional])

  const escalaInvalida = escalas.some((l) => l.trabalha && l.horaFim <= l.horaInicio)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      toast({ titulo: "Informe o nome do profissional", variante: "erro" })
      return
    }
    if (escalaInvalida) {
      toast({ titulo: "Corrija os horários de escala inválidos", variante: "erro" })
      return
    }

    setSalvando(true)
    try {
      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        comissao_percentual: Number(comissao) || 0,
        ativo,
      }

      let profissionalId = profissional?.id ?? null

      if (editando) {
        const { error } = await supabase
          .from("profissionais")
          .update(payload)
          .eq("id", profissional!.id)
        if (error) throw error
        profissionalId = profissional!.id
      } else {
        const { data, error } = await supabase
          .from("profissionais")
          .insert(payload)
          .select("id")
          .single()
        if (error) throw error
        profissionalId = data.id
      }

      // Simplifica a sincronização de escala: apaga tudo e recria os dias marcados.
      const { error: erroDelete } = await supabase
        .from("escalas")
        .delete()
        .eq("id_profissional", profissionalId)
      if (erroDelete) throw erroDelete

      const linhasAtivas = escalas.filter((l) => l.trabalha)
      if (linhasAtivas.length > 0) {
        const { error: erroInsert } = await supabase.from("escalas").insert(
          linhasAtivas.map((l) => ({
            id_profissional: profissionalId,
            dia_semana: l.diaSemana,
            hora_inicio: l.horaInicio,
            hora_fim: l.horaFim,
          }))
        )
        if (erroInsert) throw erroInsert
      }

      await registrarLog({
        acao: editando ? "atualizar" : "criar",
        tabela: "profissionais",
        idRegistro: profissionalId!,
        dadosNovos: { ...payload, escalas: linhasAtivas },
      })

      toast({
        titulo: editando ? "Profissional atualizado" : "Profissional cadastrado",
        variante: "sucesso",
      })
      onSalvo()
      onOpenChange(false)
    } catch (erro) {
      toast({
        titulo: "Não foi possível salvar",
        descricao: traduzErroAgendamento(erro),
        variante: "erro",
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar profissional" : "Novo profissional"}</DialogTitle>
          <DialogDescription>
            {editando
              ? "Atualize os dados e a escala de disponibilidade deste profissional."
              : "Uma agenda com cor própria é criada automaticamente para o profissional."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 91234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comissao">Comissão (%)</Label>
              <Input
                id="comissao"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={comissao}
                onChange={(e) => setComissao(e.target.value)}
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
              Profissional ativo (aparece como opção para novos agendamentos)
            </label>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Escala de disponibilidade</Label>
            <EscalaEditor value={escalas} onChange={setEscalas} />
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
