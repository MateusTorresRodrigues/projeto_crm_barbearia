import { Plus, Search, UsersRound } from "lucide-react"
import * as React from "react"

import { ClienteDetalhesDialog } from "@/components/clientes/ClienteDetalhesDialog"
import { ClienteFormDialog } from "@/components/clientes/ClienteFormDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useConfirm } from "@/contexts/ConfirmDialogContext"
import { useToast } from "@/contexts/ToastContext"
import { type ClienteListado, useClientes } from "@/hooks/useClientes"
import { useProfissionais } from "@/hooks/useProfissionais"
import { formatarTempoRelativo, traduzErroAgendamento } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"

export default function Clientes() {
  const [busca, setBusca] = React.useState("")
  const [idBarbeiroFiltro, setIdBarbeiroFiltro] = React.useState<string | null>(null)

  const { clientes, loading, recarregar } = useClientes({ busca, idBarbeiroPreferido: idBarbeiroFiltro })
  const { profissionais } = useProfissionais()
  const confirmar = useConfirm()
  const toast = useToast()

  const [formAberto, setFormAberto] = React.useState(false)
  const [clienteEditando, setClienteEditando] = React.useState<ClienteListado | null>(null)

  const [detalhesAberto, setDetalhesAberto] = React.useState(false)
  const [clienteSelecionado, setClienteSelecionado] = React.useState<ClienteListado | null>(null)

  function abrirNovo() {
    setClienteEditando(null)
    setFormAberto(true)
  }

  function abrirDetalhes(c: ClienteListado) {
    setClienteSelecionado(c)
    setDetalhesAberto(true)
  }

  function abrirEdicaoDaLista(c: ClienteListado) {
    setClienteEditando(c)
    setFormAberto(true)
  }

  function editarDoDetalhe() {
    setDetalhesAberto(false)
    setClienteEditando(clienteSelecionado)
    setFormAberto(true)
  }

  async function excluir(c: ClienteListado) {
    const confirmado = await confirmar({
      titulo: `Excluir ${c.nome || c.whatsapp}?`,
      descricao:
        "Essa ação também remove o histórico de agendamentos e comandas vinculados a este cliente. Não pode ser desfeita.",
      textoConfirmar: "Excluir cliente",
    })
    if (!confirmado) return

    const { error } = await supabase.from("crm_barbearia").delete().eq("id", c.id)

    if (error) {
      toast({ titulo: "Não foi possível excluir", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({ acao: "excluir", tabela: "crm_barbearia", idRegistro: c.id, dadosAnteriores: c })
    toast({ titulo: "Cliente excluído", variante: "sucesso" })
    setDetalhesAberto(false)
    recarregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64 max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou WhatsApp..."
              className="pl-9"
            />
          </div>
          <select
            value={idBarbeiroFiltro ?? ""}
            onChange={(e) => setIdBarbeiroFiltro(e.target.value || null)}
            className="flex h-9 rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
          >
            <option value="">Todos os barbeiros</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="size-4" />
          Novo cliente
        </Button>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Carregando clientes...
        </div>
      )}

      {!loading && clientes.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
          <UsersRound className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <p className="font-display text-lg font-semibold text-foreground">Nenhum cliente encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {busca || idBarbeiroFiltro
                ? "Tente ajustar a busca ou o filtro."
                : "Clientes aparecem aqui automaticamente quando um lead comparece, ou você pode cadastrar um manualmente."}
            </p>
          </div>
          <Button onClick={abrirNovo}>
            <Plus className="size-4" />
            Novo cliente
          </Button>
        </div>
      )}

      {!loading && clientes.length > 0 && (
        <>
          {/* Lista em cards (mobile) */}
          <div className="space-y-3 sm:hidden">
            {clientes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => abrirDetalhes(c)}
                className="w-full rounded-lg border border-border bg-card p-4 text-left active:bg-secondary/50"
              >
                <p className="font-medium text-foreground">{c.nome || "(sem nome)"}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{c.whatsapp}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{c.barbeiro_preferido_dados?.nome ?? "—"}</span>
                  <span className="shrink-0">{formatarTempoRelativo(new Date(c.updated_at))}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Tabela (tablet/desktop) */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-card sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Barbeiro preferido</th>
                  <th className="px-4 py-3 font-medium">Última mensagem</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => abrirDetalhes(c)}
                    onDoubleClick={() => abrirEdicaoDaLista(c)}
                    className="cursor-pointer border-b border-border/60 last:border-b-0 hover:bg-secondary/50"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{c.nome || "(sem nome)"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.whatsapp}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.barbeiro_preferido_dados?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatarTempoRelativo(new Date(c.updated_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ClienteFormDialog
        open={formAberto}
        onOpenChange={setFormAberto}
        cliente={clienteEditando}
        profissionais={profissionais}
        onSalvo={recarregar}
      />

      <ClienteDetalhesDialog
        open={detalhesAberto}
        onOpenChange={setDetalhesAberto}
        cliente={clienteSelecionado}
        onEditar={editarDoDetalhe}
        onExcluir={() => clienteSelecionado && excluir(clienteSelecionado)}
      />
    </div>
  )
}
