import {
  CalendarCheck,
  Columns3,
  History,
  Percent,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import * as React from "react"
import { Link } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useConfiguracao } from "@/contexts/ConfiguracaoContext"
import { useAgendamentos } from "@/hooks/useAgendamentos"
import { useClientesInativos } from "@/hooks/useClientesInativos"
import { useComissao } from "@/hooks/useComissao"
import { useLeadsRealtime } from "@/hooks/useLeadsRealtime"
import {
  fimDoDia,
  fimDoMes,
  formatarHoraMinuto,
  formatarMesAno,
  inicioDoDia,
  inicioDoMes,
} from "@/lib/horarios"
import type { StatusAgendamento, StatusCrm } from "@/lib/types"
import { cn } from "@/lib/utils"

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const LABEL_STATUS_AGENDAMENTO: Record<StatusAgendamento, string> = {
  agendado: "Agendado",
  compareceu: "Compareceu",
  cancelou: "Cancelado",
  faltou: "Faltou",
}

const COR_STATUS_AGENDAMENTO: Record<StatusAgendamento, string> = {
  agendado: "bg-primary/15 text-primary",
  compareceu: "bg-green-500/15 text-green-500",
  cancelou: "bg-destructive/15 text-destructive",
  faltou: "bg-orange-500/15 text-orange-500",
}

const STATUS_LEAD_EM_ANDAMENTO: StatusCrm[] = ["conversando", "agendado", "follow_up_1", "follow_up_2"]

function CartaoIndicador({
  icone: Icone,
  titulo,
  valor,
  descricao,
  rota,
}: {
  icone: LucideIcon
  titulo: string
  valor: string
  descricao: string
  rota: string
}) {
  return (
    <Link to={rota}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardContent className="flex items-start justify-between gap-3 p-5">
          <div>
            <p className="text-sm text-muted-foreground">{titulo}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">{valor}</p>
            <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Icone className="size-4 text-primary" strokeWidth={1.75} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function Dashboard() {
  const agora = React.useMemo(() => new Date(), [])
  const inicioHoje = React.useMemo(() => inicioDoDia(agora), [agora])
  const fimHoje = React.useMemo(() => fimDoDia(agora), [agora])
  const inicioMes = React.useMemo(() => inicioDoMes(agora), [agora])
  const fimMes = React.useMemo(() => fimDoMes(agora), [agora])

  const { agendamentos: agendamentosHoje, loading: carregandoAgendamentos } = useAgendamentos(
    inicioHoje,
    fimHoje
  )
  const { grupos: gruposHoje, loading: carregandoComissaoHoje } = useComissao({
    dataInicio: inicioHoje,
    dataFim: fimHoje,
    idProfissional: null,
  })
  const { grupos: gruposMes, totalGeral: comissaoMes, loading: carregandoComissaoMes } = useComissao({
    dataInicio: inicioMes,
    dataFim: fimMes,
    idProfissional: null,
  })
  const { leads, loading: carregandoLeads } = useLeadsRealtime()
  const { configuracao, loading: carregandoConfig } = useConfiguracao()
  const { itens: inativos, loading: carregandoInativos } = useClientesInativos(
    configuracao?.dias_inatividade ?? 30
  )

  const loading =
    carregandoAgendamentos ||
    carregandoComissaoHoje ||
    carregandoComissaoMes ||
    carregandoLeads ||
    carregandoConfig ||
    carregandoInativos

  const concluidosHoje = agendamentosHoje.filter((a) => a.status === "compareceu").length
  const faturamentoHoje = gruposHoje.flatMap((g) => g.comandas).reduce((soma, c) => soma + c.valor_total, 0)
  const faturamentoMes = gruposMes.flatMap((g) => g.comandas).reduce((soma, c) => soma + c.valor_total, 0)
  const leadsNovos = leads.filter((l) => l.tipo === "lead" && l.status === "novo").length
  const leadsEmAndamento = leads.filter(
    (l) => l.tipo === "lead" && STATUS_LEAD_EM_ANDAMENTO.includes(l.status)
  ).length

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Carregando indicadores...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoIndicador
          icone={CalendarCheck}
          titulo="Agendamentos hoje"
          valor={String(agendamentosHoje.length)}
          descricao={`${concluidosHoje} concluído(s)`}
          rota="/agenda"
        />
        <CartaoIndicador
          icone={Wallet}
          titulo="Faturamento hoje"
          valor={formatarMoeda(faturamentoHoje)}
          descricao="Comandas fechadas hoje"
          rota="/comandas"
        />
        <CartaoIndicador
          icone={TrendingUp}
          titulo="Faturamento do mês"
          valor={formatarMoeda(faturamentoMes)}
          descricao={formatarMesAno(agora)}
          rota="/comissao"
        />
        <CartaoIndicador
          icone={Percent}
          titulo="Comissão do mês"
          valor={formatarMoeda(comissaoMes)}
          descricao="A pagar aos profissionais"
          rota="/comissao"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CartaoIndicador
          icone={Columns3}
          titulo="Leads novos"
          valor={String(leadsNovos)}
          descricao={`${leadsEmAndamento} em conversa/atendimento`}
          rota="/leads"
        />
        <CartaoIndicador
          icone={History}
          titulo="Clientes para retorno"
          valor={String(inativos.length)}
          descricao="Sem visitar há mais tempo que o esperado"
          rota="/retorno"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenda de hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {agendamentosHoje.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum agendamento para hoje.
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {agendamentosHoje.map((ag) => (
                <div key={ag.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: ag.agenda?.cor ?? "#C7883C" }}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatarHoraMinuto(new Date(ag.data_hora_inicio))} ·{" "}
                        {ag.cliente?.nome || ag.cliente?.whatsapp || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ag.agenda?.profissional?.nome ?? "—"} · {ag.servico?.nome ?? "—"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      COR_STATUS_AGENDAMENTO[ag.status]
                    )}
                  >
                    {LABEL_STATUS_AGENDAMENTO[ag.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
