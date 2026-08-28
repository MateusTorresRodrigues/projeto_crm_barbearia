import { Percent } from "lucide-react"
import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useComissao } from "@/hooks/useComissao"
import { useProfissionais } from "@/hooks/useProfissionais"
import {
  fimDoMes,
  formatarDataCompleta,
  inicioDoMes,
  paraCampoData,
  paraCampoMes,
} from "@/lib/horarios"

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function Comissao() {
  const { profissionais } = useProfissionais()

  const hoje = new Date()
  const [mesCampo, setMesCampo] = React.useState(paraCampoMes(hoje))
  const [dataInicioCampo, setDataInicioCampo] = React.useState(paraCampoData(inicioDoMes(hoje)))
  const [dataFimCampo, setDataFimCampo] = React.useState(paraCampoData(fimDoMes(hoje)))
  const [idProfissional, setIdProfissional] = React.useState<string | null>(null)

  function selecionarMes(valor: string) {
    setMesCampo(valor)
    if (!valor) return
    const [ano, mes] = valor.split("-").map(Number)
    const base = new Date(ano, mes - 1, 1)
    setDataInicioCampo(paraCampoData(inicioDoMes(base)))
    setDataFimCampo(paraCampoData(fimDoMes(base)))
  }

  const dataInicio = new Date(`${dataInicioCampo}T00:00:00`)
  const dataFim = new Date(`${dataFimCampo}T23:59:59`)

  const { grupos, totalGeral, totalAtendimentosGeral, loading } = useComissao({
    dataInicio,
    dataFim,
    idProfissional,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Mês</label>
          <Input
            type="month"
            value={mesCampo}
            onChange={(e) => selecionarMes(e.target.value)}
            className="h-9 w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">De</label>
          <Input
            type="date"
            value={dataInicioCampo}
            onChange={(e) => {
              setMesCampo("")
              setDataInicioCampo(e.target.value)
            }}
            className="h-9 w-36"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Até</label>
          <Input
            type="date"
            value={dataFimCampo}
            onChange={(e) => {
              setMesCampo("")
              setDataFimCampo(e.target.value)
            }}
            className="h-9 w-36"
          />
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total do período</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-8">
          <div>
            <p className="text-sm text-muted-foreground">Atendimentos fechados</p>
            <p className="font-display text-2xl font-semibold text-foreground">{totalAtendimentosGeral}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Comissão total a pagar</p>
            <p className="font-display text-2xl font-semibold text-primary">{formatarMoeda(totalGeral)}</p>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          Calculando comissões...
        </div>
      )}

      {!loading && grupos.length === 0 && (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
          <Percent className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              Nenhuma comanda fechada no período
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste o período ou o filtro de profissional.
            </p>
          </div>
        </div>
      )}

      {!loading &&
        grupos.map((grupo) => (
          <Card key={grupo.profissional.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{grupo.profissional.nome}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {grupo.totalAtendimentos} atendimento(s) · comissão de {grupo.profissional.comissao_percentual}%
                </p>
              </div>
              <p className="font-display text-xl font-semibold text-primary">
                {formatarMoeda(grupo.totalComissao)}
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Data</th>
                    <th className="py-2 pr-3 font-medium">Cliente</th>
                    <th className="py-2 pr-3 font-medium">Serviço(s)</th>
                    <th className="py-2 pr-3 font-medium">Valor total</th>
                    <th className="py-2 font-medium">Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.comandas.map((c) => (
                    <tr key={c.id} className="border-b border-border/60 last:border-b-0">
                      <td className="py-2 pr-3 text-muted-foreground">
                        {formatarDataCompleta(new Date(c.updated_at))}
                      </td>
                      <td className="py-2 pr-3 text-foreground">
                        {c.cliente?.nome || c.cliente?.whatsapp || "—"}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {c.comanda_servicos.map((cs) => cs.servico?.nome ?? "").filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="py-2 pr-3 text-foreground">{formatarMoeda(c.valor_total)}</td>
                      <td className="py-2 text-primary">{formatarMoeda(c.valor_comissao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
    </div>
  )
}
