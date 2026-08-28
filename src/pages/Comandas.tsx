import { Plus, Receipt } from "lucide-react"
import * as React from "react"

import { ComandaDetalhesDialog } from "@/components/comandas/ComandaDetalhesDialog"
import { NovaComandaDialog } from "@/components/comandas/NovaComandaDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type FiltroComandas, useComandas } from "@/hooks/useComandas"
import { useProfissionais } from "@/hooks/useProfissionais"
import { fimDoDia, formatarDataCompleta, inicioDoDia } from "@/lib/horarios"
import { cn } from "@/lib/utils"

export default function Comandas() {
  const { profissionais } = useProfissionais()

  const [status, setStatus] = React.useState<FiltroComandas["status"]>("todas")
  const [idProfissional, setIdProfissional] = React.useState<string | null>(null)
  const [dataInicioCampo, setDataInicioCampo] = React.useState("")
  const [dataFimCampo, setDataFimCampo] = React.useState("")

  const filtro: FiltroComandas = {
    status,
    idProfissional,
    dataInicio: dataInicioCampo ? inicioDoDia(new Date(`${dataInicioCampo}T00:00:00`)) : null,
    dataFim: dataFimCampo ? fimDoDia(new Date(`${dataFimCampo}T00:00:00`)) : null,
  }

  const { comandas, loading, recarregar } = useComandas(filtro)

  const [novaAberta, setNovaAberta] = React.useState(false)
  const [detalhesAberto, setDetalhesAberto] = React.useState(false)
  const [comandaSelecionadaId, setComandaSelecionadaId] = React.useState<string | null>(null)

  function abrirDetalhes(id: string) {
    setComandaSelecionadaId(id)
    setDetalhesAberto(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FiltroComandas["status"])}
              className="flex h-9 rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
            >
              <option value="todas">Todas</option>
              <option value="aberta">Abertas</option>
              <option value="fechada">Fechadas</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Profissional</label>
            <select
              value={idProfissional ?? ""}
              onChange={(e) => setIdProfissional(e.target.value || null)}
              className="flex h-9 rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
            >
              <option value="">Todos</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">De</label>
            <Input
              type="date"
              value={dataInicioCampo}
              onChange={(e) => setDataInicioCampo(e.target.value)}
              className="h-9 w-36"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Até</label>
            <Input
              type="date"
              value={dataFimCampo}
              onChange={(e) => setDataFimCampo(e.target.value)}
              className="h-9 w-36"
            />
          </div>
        </div>

        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="size-4" />
          Nova comanda
        </Button>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Carregando comandas...
        </div>
      )}

      {!loading && comandas.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
          <Receipt className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <p className="font-display text-lg font-semibold text-foreground">Nenhuma comanda encontrada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste os filtros ou abra uma nova comanda para um atendimento.
            </p>
          </div>
          <Button onClick={() => setNovaAberta(true)}>
            <Plus className="size-4" />
            Nova comanda
          </Button>
        </div>
      )}

      {!loading && comandas.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Profissional</th>
                <th className="px-4 py-3 font-medium">Valor total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {comandas.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => abrirDetalhes(c.id)}
                  className="cursor-pointer border-b border-border/60 last:border-b-0 hover:bg-secondary/50"
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatarDataCompleta(new Date(c.created_at))}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.cliente?.nome || c.cliente?.whatsapp || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.profissional?.nome ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground">
                    {c.valor_total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        c.status === "fechada"
                          ? "bg-secondary text-muted-foreground"
                          : "bg-primary/15 text-primary"
                      )}
                    >
                      {c.status === "fechada" ? "Fechada" : "Aberta"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NovaComandaDialog
        open={novaAberta}
        onOpenChange={setNovaAberta}
        profissionais={profissionais}
        onCriada={(id) => {
          recarregar()
          abrirDetalhes(id)
        }}
      />

      <ComandaDetalhesDialog
        open={detalhesAberto}
        onOpenChange={setDetalhesAberto}
        comandaId={comandaSelecionadaId}
        onAtualizado={recarregar}
      />
    </div>
  )
}
