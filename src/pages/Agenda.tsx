import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"

import { AgendamentoDetalhesDialog } from "@/components/agenda/AgendamentoDetalhesDialog"
import { AgendamentoFormDialog } from "@/components/agenda/AgendamentoFormDialog"
import { FiltroProfissionais } from "@/components/agenda/FiltroProfissionais"
import { GradeMes } from "@/components/agenda/GradeMes"
import { GradeSemana } from "@/components/agenda/GradeSemana"
import { Button } from "@/components/ui/button"
import { useToast } from "@/contexts/ToastContext"
import { useAgendamentos } from "@/hooks/useAgendamentos"
import { useProfissionais } from "@/hooks/useProfissionais"
import { useServicos } from "@/hooks/useServicos"
import {
  adicionarDias,
  formatarDiaMes,
  formatarMesAno,
  inicioDaSemana,
  traduzErroAgendamento,
} from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import type { AgendamentoDetalhado } from "@/lib/types"
import { cn } from "@/lib/utils"

type Visao = "semana" | "mes"

export default function Agenda() {
  const toast = useToast()
  const { profissionais, loading: carregandoProfissionais } = useProfissionais()
  const { servicos } = useServicos()

  const [visao, setVisao] = React.useState<Visao>("semana")
  const [dataReferencia, setDataReferencia] = React.useState(new Date())
  const [selecionados, setSelecionados] = React.useState<Set<string>>(new Set())
  const inicializouFiltro = React.useRef(false)

  React.useEffect(() => {
    if (!inicializouFiltro.current && profissionais.length > 0) {
      setSelecionados(new Set(profissionais.filter((p) => p.ativo).map((p) => p.id)))
      inicializouFiltro.current = true
    }
  }, [profissionais])

  const semana = React.useMemo(() => {
    const inicio = inicioDaSemana(dataReferencia)
    return Array.from({ length: 7 }, (_, i) => adicionarDias(inicio, i))
  }, [dataReferencia])

  const rangeInicio = React.useMemo(() => {
    if (visao === "semana") return semana[0]
    return inicioDaSemana(new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1))
  }, [visao, semana, dataReferencia])

  const rangeFim = React.useMemo(
    () => adicionarDias(rangeInicio, visao === "semana" ? 7 : 42),
    [rangeInicio, visao]
  )

  const { agendamentos, loading: carregandoAgendamentos, recarregar } = useAgendamentos(
    rangeInicio,
    rangeFim
  )

  const profissionaisVisiveis = profissionais.filter((p) => selecionados.has(p.id))
  const agendamentosVisiveis = agendamentos.filter((a) =>
    profissionaisVisiveis.some((p) => p.agenda?.id === a.id_agenda)
  )

  // Dialog de criação
  const [criarAberto, setCriarAberto] = React.useState(false)
  const [slotClicado, setSlotClicado] = React.useState<Date | null>(null)
  const [profissionalClicado, setProfissionalClicado] = React.useState<string | null>(null)

  // Dialog de detalhes
  const [detalhesAberto, setDetalhesAberto] = React.useState(false)
  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    React.useState<AgendamentoDetalhado | null>(null)

  function abrirCriacao(data: Date) {
    setSlotClicado(data)
    setProfissionalClicado(selecionados.size === 1 ? [...selecionados][0] : null)
    setCriarAberto(true)
  }

  function abrirDetalhes(ag: AgendamentoDetalhado) {
    setAgendamentoSelecionado(ag)
    setDetalhesAberto(true)
  }

  async function reagendar(ag: AgendamentoDetalhado, novoInicio: Date) {
    const duracaoMs = new Date(ag.data_hora_fim).getTime() - new Date(ag.data_hora_inicio).getTime()
    const novoFim = new Date(novoInicio.getTime() + duracaoMs)

    const { error } = await supabase
      .from("agendamentos")
      .update({ data_hora_inicio: novoInicio.toISOString(), data_hora_fim: novoFim.toISOString() })
      .eq("id", ag.id)

    if (error) {
      toast({ titulo: "Não foi possível remarcar", descricao: traduzErroAgendamento(error), variante: "erro" })
      recarregar()
      return
    }

    await registrarLog({
      acao: "remarcar",
      tabela: "agendamentos",
      idRegistro: ag.id,
      dadosAnteriores: { data_hora_inicio: ag.data_hora_inicio },
      dadosNovos: { data_hora_inicio: novoInicio.toISOString() },
    })
    toast({ titulo: "Agendamento remarcado", variante: "sucesso" })
    recarregar()
  }

  function navegar(direcao: -1 | 1) {
    setDataReferencia((atual) => {
      if (visao === "semana") return adicionarDias(atual, 7 * direcao)
      const d = new Date(atual)
      d.setMonth(d.getMonth() + direcao)
      return d
    })
  }

  const tituloPeriodo =
    visao === "semana"
      ? `${formatarDiaMes(semana[0])} – ${formatarDiaMes(semana[6])}`
      : formatarMesAno(dataReferencia)

  const loading = carregandoProfissionais || carregandoAgendamentos

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navegar(-1)} aria-label="Período anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDataReferencia(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => navegar(1)} aria-label="Próximo período">
            <ChevronRight className="size-4" />
          </Button>
          <h2 className="ml-2 font-display text-lg font-semibold capitalize text-foreground">
            {tituloPeriodo}
          </h2>
        </div>

        <div className="flex rounded-md border border-border p-0.5">
          {(["semana", "mes"] as Visao[]).map((v) => (
            <button
              key={v}
              onClick={() => setVisao(v)}
              className={cn(
                "rounded px-3 py-1 text-sm font-medium capitalize transition-colors",
                visao === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {profissionais.length > 0 && (
        <FiltroProfissionais
          profissionais={profissionais}
          selecionados={selecionados}
          onChange={setSelecionados}
        />
      )}

      {!carregandoProfissionais && profissionais.length === 0 && (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Cadastre profissionais para começar a montar a agenda.
        </p>
      )}

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Carregando agenda...
        </div>
      )}

      {!loading && profissionais.length > 0 && (
        <>
          {profissionaisVisiveis.length === 0 && (
            <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Selecione ao menos um profissional para ver a agenda.
            </p>
          )}

          {visao === "semana" ? (
            <GradeSemana
              semana={semana}
              profissionaisVisiveis={profissionaisVisiveis}
              agendamentos={agendamentosVisiveis}
              onClickSlot={abrirCriacao}
              onClickAgendamento={abrirDetalhes}
              onReagendar={reagendar}
            />
          ) : (
            <GradeMes
              mesReferencia={dataReferencia}
              profissionaisVisiveis={profissionaisVisiveis}
              agendamentos={agendamentosVisiveis}
              onSelecionarDia={(dia) => {
                setDataReferencia(dia)
                setVisao("semana")
              }}
              onClickAgendamento={abrirDetalhes}
            />
          )}
        </>
      )}

      <AgendamentoFormDialog
        open={criarAberto}
        onOpenChange={setCriarAberto}
        profissionais={profissionais}
        servicos={servicos}
        dataHoraInicial={slotClicado}
        profissionalIdInicial={profissionalClicado}
        onCriado={recarregar}
      />

      <AgendamentoDetalhesDialog
        open={detalhesAberto}
        onOpenChange={setDetalhesAberto}
        agendamento={agendamentoSelecionado}
        onAtualizado={recarregar}
      />
    </div>
  )
}
