import { ChevronRight, ScrollText } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLogsSistema } from "@/hooks/useLogsSistema"
import { useUsuarios } from "@/hooks/useUsuarios"
import { formatarDataCompleta, formatarHoraMinuto, paraCampoData } from "@/lib/horarios"
import type { LogSistemaDetalhado } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Tabelas em que a tela grava ações — usadas tanto no filtro quanto no rótulo de cada log. */
const LABEL_TABELA: Record<string, string> = {
  crm_barbearia: "Leads/Clientes",
  agendamentos: "Agendamentos",
  comandas: "Comandas",
  comanda_servicos: "Itens da comanda",
  servicos: "Serviços",
  profissionais: "Profissionais",
  configuracoes: "Configurações",
}

const LABEL_ACAO: Record<string, string> = {
  criar: "Criação",
  atualizar: "Atualização",
  excluir: "Exclusão",
  adicionar_servico: "Serviço adicionado",
  atualizar_preco_servico: "Preço atualizado",
  remover_servico: "Serviço removido",
  fechar: "Comanda fechada",
  reabrir: "Comanda reaberta",
  atualizar_status: "Status atualizado",
  remarcar: "Remarcação",
  atualizar_logo: "Logo atualizada",
  remover_logo: "Logo removida",
}

const LABEL_CAMPO: Record<string, string> = {
  nome: "Nome",
  whatsapp: "WhatsApp",
  status: "Status",
  ativo: "Ativo",
  preco: "Preço",
  preco_cobrado: "Preço cobrado",
  duracao_minutos: "Duração (min)",
  id_servico: "Serviço",
  id_cliente: "Cliente",
  id_profissional: "Profissional",
  id_agenda: "Agenda",
  data_hora_inicio: "Início",
  data_hora_fim: "Fim",
  comissao_percentual: "Comissão (%)",
  telefone: "Telefone",
  logo_url: "Logo",
  nome_negocio: "Nome do negócio",
  dias_inatividade: "Dias de inatividade",
  horario_abertura: "Abertura",
  horario_fechamento: "Fechamento",
  escalas: "Escalas",
}

/** Tabelas que o agente de IA (n8n/Evolution API) pode alterar direto via service_role. */
const TABELAS_AGENTE_IA = ["crm_barbearia", "agendamentos"]

function labelAcao(acao: string): string {
  return LABEL_ACAO[acao] ?? acao.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
}

function labelTabela(tabela: string | null): string {
  if (!tabela) return "—"
  return LABEL_TABELA[tabela] ?? tabela
}

function labelCampo(campo: string): string {
  return LABEL_CAMPO[campo] ?? campo.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
}

function formatarValorCampo(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—"
  if (typeof valor === "boolean") return valor ? "Sim" : "Não"
  if (typeof valor === "number") {
    return /preco|valor/i.test(campo)
      ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : String(valor)
  }
  if (typeof valor === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(valor)) {
      const data = new Date(valor)
      return `${formatarDataCompleta(data)} ${formatarHoraMinuto(data)}`
    }
    return valor
  }
  return JSON.stringify(valor)
}

/**
 * Registros são criados pela própria tela (`registrarLog`), sempre com um
 * usuário autenticado. Quando não há usuário vinculado, assumimos que a
 * ação veio do agente de IA se a tabela afetada é uma das que aceitam
 * escrita via service_role — caso contrário, tratamos como ação do sistema.
 */
function nomeResponsavel(log: LogSistemaDetalhado): string {
  if (log.usuario) return log.usuario.nome
  if (log.tabela && TABELAS_AGENTE_IA.includes(log.tabela)) return "Agente de IA"
  return "Sistema"
}

function ListaCampos({ titulo, dados }: { titulo: string; dados: Record<string, unknown> }) {
  const entradas = Object.entries(dados)
  if (entradas.length === 0) return null

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <dl className="mt-2 space-y-1">
        {entradas.map(([campo, valor]) => (
          <div key={campo} className="flex flex-wrap justify-between gap-2 text-sm">
            <dt className="text-muted-foreground">{labelCampo(campo)}</dt>
            <dd className="text-right text-foreground">{formatarValorCampo(campo, valor)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function LinhaLog({ log }: { log: LogSistemaDetalhado }) {
  const [aberto, setAberto] = React.useState(false)
  const data = new Date(log.created_at)
  const temDetalhes = Boolean(log.dados_anteriores || log.dados_novos)

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={() => temDetalhes && setAberto((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-4 py-3 text-left",
          temDetalhes ? "cursor-pointer" : "cursor-default"
        )}
      >
        <div className="flex items-center gap-3">
          {temDetalhes ? (
            <ChevronRight
              className={cn("size-4 shrink-0 text-muted-foreground transition-transform", aberto && "rotate-90")}
            />
          ) : (
            <span className="size-4 shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {labelAcao(log.acao)} · {labelTabela(log.tabela)}
            </p>
            <p className="text-xs text-muted-foreground">{nomeResponsavel(log)}</p>
          </div>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {formatarDataCompleta(data)} {formatarHoraMinuto(data)}
        </p>
      </button>

      {aberto && temDetalhes && (
        <div className="grid gap-4 border-t border-border/60 bg-secondary/20 px-7 py-4 sm:grid-cols-2">
          {log.dados_anteriores && <ListaCampos titulo="Antes" dados={log.dados_anteriores} />}
          {log.dados_novos && <ListaCampos titulo="Depois" dados={log.dados_novos} />}
        </div>
      )}
    </div>
  )
}

export default function Logs() {
  const { usuarios } = useUsuarios()
  const [tabela, setTabela] = React.useState<string | null>(null)
  const [idUsuario, setIdUsuario] = React.useState<string | null>(null)
  const [dataInicioCampo, setDataInicioCampo] = React.useState("")
  const [dataFimCampo, setDataFimCampo] = React.useState("")

  const dataInicio = dataInicioCampo ? new Date(`${dataInicioCampo}T00:00:00`) : null
  const dataFim = dataFimCampo ? new Date(`${dataFimCampo}T23:59:59`) : null

  const { logs, loading, carregandoMais, temMais, carregarMais } = useLogsSistema({
    tabela,
    idUsuario,
    dataInicio,
    dataFim,
  })

  const filtrosAtivos = Boolean(tabela || idUsuario || dataInicioCampo || dataFimCampo)

  function limparFiltros() {
    setTabela(null)
    setIdUsuario(null)
    setDataInicioCampo("")
    setDataFimCampo("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Tabela</label>
          <select
            value={tabela ?? ""}
            onChange={(e) => setTabela(e.target.value || null)}
            className="flex h-9 rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
          >
            <option value="">Todas</option>
            {Object.entries(LABEL_TABELA).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Usuário</label>
          <select
            value={idUsuario ?? ""}
            onChange={(e) => setIdUsuario(e.target.value || null)}
            className="flex h-9 rounded-md border border-input bg-secondary/60 px-3 text-sm text-foreground"
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
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
            max={dataFimCampo || paraCampoData(new Date())}
            className="h-9 w-36"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Até</label>
          <Input
            type="date"
            value={dataFimCampo}
            onChange={(e) => setDataFimCampo(e.target.value)}
            min={dataInicioCampo}
            max={paraCampoData(new Date())}
            className="h-9 w-36"
          />
        </div>

        {filtrosAtivos && (
          <Button type="button" variant="ghost" size="sm" onClick={limparFiltros}>
            Limpar filtros
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Carregando logs...
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
          <ScrollText className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              {filtrosAtivos ? "Nenhum resultado para esses filtros" : "Nenhum log registrado ainda"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtrosAtivos
                ? "Tente ajustar a tabela, o usuário ou o período."
                : "As ações realizadas no sistema vão aparecer aqui."}
            </p>
          </div>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4">
          {logs.map((log) => (
            <LinhaLog key={log.id} log={log} />
          ))}
        </div>
      )}

      {!loading && temMais && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={carregarMais} disabled={carregandoMais}>
            {carregandoMais ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  )
}
