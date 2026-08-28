import { Copy, Eye, EyeOff, ImageUp, KeyRound, Settings, Trash2 } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useConfiguracao } from "@/contexts/ConfiguracaoContext"
import { useConfirm } from "@/contexts/ConfirmDialogContext"
import { useToast } from "@/contexts/ToastContext"
import { Emblema } from "@/components/Emblema"
import { useApiTokens } from "@/hooks/useApiTokens"
import { formatarHora, formatarTempoRelativo, traduzErroAgendamento } from "@/lib/horarios"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import type { ApiToken } from "@/lib/types"
import { cn } from "@/lib/utils"

const TIPOS_LOGO_ACEITOS = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
const TAMANHO_MAXIMO_LOGO = 2 * 1024 * 1024
const URL_FUNCAO_AGENTE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agente`
const ACOES_AGENTE = ["buscar_lead", "upsert_lead", "listar_servicos", "listar_profissionais", "disponibilidade", "criar_agendamento"]

/** Extrai o caminho dentro do bucket a partir da URL pública, para poder remover o arquivo antigo. */
function caminhoNoBucketLogos(url: string | null): string | null {
  if (!url) return null
  const marcador = "/object/public/logos/"
  const indice = url.indexOf(marcador)
  return indice === -1 ? null : url.slice(indice + marcador.length)
}

/** Aba "API": gera/revoga os tokens que o agente de IA usa para chamar a Edge Function `agente`. */
function AbaApi() {
  const { tokens, loading, criar, alternarAtivo, excluir } = useApiTokens()
  const confirmar = useConfirm()
  const toast = useToast()

  const [nomeNovoToken, setNomeNovoToken] = React.useState("")
  const [criando, setCriando] = React.useState(false)
  const [tokenRevelado, setTokenRevelado] = React.useState<string | null>(null)
  const [tokenRecemCriado, setTokenRecemCriado] = React.useState<string | null>(null)

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeNovoToken.trim()) {
      toast({ titulo: "Dê um nome ao token, ex: n8n produção", variante: "erro" })
      return
    }

    setCriando(true)
    try {
      const novo = await criar(nomeNovoToken.trim())
      await registrarLog({ acao: "criar", tabela: "api_tokens", idRegistro: novo.id, dadosNovos: { nome: novo.nome } })
      setNomeNovoToken("")
      setTokenRevelado(novo.id)
      setTokenRecemCriado(novo.id)
      toast({ titulo: "Token gerado", descricao: "Copie agora e configure no n8n.", variante: "sucesso" })
    } catch (erro) {
      toast({ titulo: "Não foi possível gerar o token", descricao: traduzErroAgendamento(erro), variante: "erro" })
    } finally {
      setCriando(false)
    }
  }

  async function handleCopiar(token: string) {
    try {
      await navigator.clipboard.writeText(token)
      toast({ titulo: "Token copiado", variante: "sucesso" })
    } catch {
      toast({ titulo: "Não foi possível copiar", descricao: "Copie manualmente.", variante: "erro" })
    }
  }

  async function handleAlternarAtivo(item: ApiToken) {
    try {
      await alternarAtivo(item)
      await registrarLog({
        acao: "atualizar",
        tabela: "api_tokens",
        idRegistro: item.id,
        dadosAnteriores: { ativo: item.ativo },
        dadosNovos: { ativo: !item.ativo },
      })
    } catch (erro) {
      toast({ titulo: "Não foi possível atualizar o token", descricao: traduzErroAgendamento(erro), variante: "erro" })
    }
  }

  async function handleExcluir(item: ApiToken) {
    const ok = await confirmar({
      titulo: "Excluir token",
      descricao: `Qualquer integração usando "${item.nome}" para de funcionar imediatamente.`,
      textoConfirmar: "Excluir",
    })
    if (!ok) return

    try {
      await excluir(item.id)
      await registrarLog({ acao: "excluir", tabela: "api_tokens", idRegistro: item.id, dadosAnteriores: { nome: item.nome } })
      toast({ titulo: "Token excluído", variante: "sucesso" })
    } catch (erro) {
      toast({ titulo: "Não foi possível excluir", descricao: traduzErroAgendamento(erro), variante: "erro" })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API</CardTitle>
          <CardDescription>
            Tokens usados pelo agente de IA (n8n/Evolution API) para autenticar na Edge Function{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs text-foreground">agente</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCriar} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label htmlFor="nome_token">Nome do token</Label>
              <Input
                id="nome_token"
                placeholder="Ex.: n8n produção"
                value={nomeNovoToken}
                onChange={(e) => setNomeNovoToken(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={criando}>
              <KeyRound className="size-4" />
              {criando ? "Gerando..." : "Gerar token"}
            </Button>
          </form>

          {loading && <p className="text-sm text-muted-foreground">Carregando tokens...</p>}

          {!loading && tokens.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum token gerado ainda.</p>
          )}

          {!loading && tokens.length > 0 && (
            <div className="space-y-2">
              {tokens.map((item) => {
                const revelado = tokenRevelado === item.id
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-secondary/20 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{item.nome}</p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            item.ativo ? "bg-green-500/15 text-green-500" : "bg-secondary text-muted-foreground"
                          )}
                        >
                          {item.ativo ? "Ativo" : "Inativo"}
                        </span>
                        {item.id === tokenRecemCriado && (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                            Novo — copie agora
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <code className="truncate rounded bg-secondary px-2 py-1 font-mono text-xs text-foreground">
                          {revelado ? item.token : `${item.token.slice(0, 8)}${"•".repeat(20)}`}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => setTokenRevelado(revelado ? null : item.id)}
                          aria-label={revelado ? "Ocultar token" : "Mostrar token"}
                        >
                          {revelado ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleCopiar(item.token)}
                          aria-label="Copiar token"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Último uso:{" "}
                        {item.ultimo_uso_em ? formatarTempoRelativo(new Date(item.ultimo_uso_em)) : "Nunca"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAlternarAtivo(item)}>
                        {item.ativo ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExcluir(item)}
                        aria-label="Excluir token"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endpoint</CardTitle>
          <CardDescription>Configure o node HTTP Request do n8n para chamar essa URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <code className="block overflow-x-auto rounded bg-secondary px-3 py-2 text-xs text-foreground">
            POST {URL_FUNCAO_AGENTE}
          </code>
          <p className="text-muted-foreground">
            Header{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs text-foreground">
              Authorization: Bearer &lt;token&gt;
            </code>{" "}
            e corpo{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs text-foreground">{"{ action, payload }"}</code>.
          </p>
          <p className="text-muted-foreground">
            Ações disponíveis:{" "}
            {ACOES_AGENTE.map((acao, i) => (
              <React.Fragment key={acao}>
                <code className="text-xs text-foreground">{acao}</code>
                {i < ACOES_AGENTE.length - 1 ? ", " : "."}
              </React.Fragment>
            ))}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Configuracoes() {
  const { configuracao, loading, recarregar } = useConfiguracao()
  const toast = useToast()
  const confirmar = useConfirm()
  const inputLogoRef = React.useRef<HTMLInputElement>(null)

  const [nomeNegocio, setNomeNegocio] = React.useState("")
  const [abertura, setAbertura] = React.useState("09:00")
  const [fechamento, setFechamento] = React.useState("19:00")
  const [diasInatividade, setDiasInatividade] = React.useState("30")
  const [salvando, setSalvando] = React.useState(false)
  const [enviandoLogo, setEnviandoLogo] = React.useState(false)
  const [criandoConfiguracao, setCriandoConfiguracao] = React.useState(false)

  React.useEffect(() => {
    if (!configuracao) return
    setNomeNegocio(configuracao.nome_negocio)
    setAbertura(formatarHora(configuracao.horario_abertura))
    setFechamento(formatarHora(configuracao.horario_fechamento))
    setDiasInatividade(String(configuracao.dias_inatividade))
  }, [configuracao])

  async function removerArquivoAntigo(url: string | null) {
    const caminho = caminhoNoBucketLogos(url)
    if (!caminho) return
    try {
      await supabase.storage.from("logos").remove([caminho])
    } catch {
      // Limpeza é best-effort: falhar aqui não deve incomodar quem só quer trocar a logo.
    }
  }

  async function handleArquivoLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ""
    if (!arquivo || !configuracao) return

    if (!TIPOS_LOGO_ACEITOS.includes(arquivo.type)) {
      toast({
        titulo: "Formato não suportado",
        descricao: "Envie um arquivo PNG, JPEG, WEBP ou SVG.",
        variante: "erro",
      })
      return
    }
    if (arquivo.size > TAMANHO_MAXIMO_LOGO) {
      toast({ titulo: "Arquivo muito grande", descricao: "O tamanho máximo é 2MB.", variante: "erro" })
      return
    }

    setEnviandoLogo(true)
    const extensao = arquivo.name.split(".").pop() || "png"
    const caminho = `logo-${configuracao.id}-${Date.now()}.${extensao}`

    const { error: erroUpload } = await supabase.storage
      .from("logos")
      .upload(caminho, arquivo, { contentType: arquivo.type })

    if (erroUpload) {
      setEnviandoLogo(false)
      toast({ titulo: "Não foi possível enviar a logo", descricao: traduzErroAgendamento(erroUpload), variante: "erro" })
      return
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(caminho)
    const logoAnterior = configuracao.logo_url

    const { error: erroUpdate } = await supabase
      .from("configuracoes")
      .update({ logo_url: urlData.publicUrl })
      .eq("id", configuracao.id)

    setEnviandoLogo(false)

    if (erroUpdate) {
      toast({
        titulo: "Não foi possível salvar a nova logo",
        descricao: traduzErroAgendamento(erroUpdate),
        variante: "erro",
      })
      return
    }

    await registrarLog({
      acao: "atualizar_logo",
      tabela: "configuracoes",
      idRegistro: configuracao.id,
      dadosAnteriores: { logo_url: logoAnterior },
      dadosNovos: { logo_url: urlData.publicUrl },
    })

    removerArquivoAntigo(logoAnterior)
    toast({ titulo: "Logo atualizada", variante: "sucesso" })
    recarregar()
  }

  async function handleRemoverLogo() {
    if (!configuracao?.logo_url) return

    const ok = await confirmar({
      titulo: "Remover logo",
      descricao: "O sistema voltará a usar o emblema padrão no lugar da logo atual.",
      textoConfirmar: "Remover",
    })
    if (!ok) return

    const logoAnterior = configuracao.logo_url
    const { error } = await supabase.from("configuracoes").update({ logo_url: null }).eq("id", configuracao.id)

    if (error) {
      toast({ titulo: "Não foi possível remover a logo", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({
      acao: "remover_logo",
      tabela: "configuracoes",
      idRegistro: configuracao.id,
      dadosAnteriores: { logo_url: logoAnterior },
    })

    removerArquivoAntigo(logoAnterior)
    toast({ titulo: "Logo removida", variante: "sucesso" })
    recarregar()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!configuracao) return

    if (!nomeNegocio.trim()) {
      toast({ titulo: "Informe o nome do negócio", variante: "erro" })
      return
    }
    const dias = Number(diasInatividade)
    if (!Number.isFinite(dias) || dias <= 0) {
      toast({ titulo: "Informe um número válido de dias de inatividade", variante: "erro" })
      return
    }
    if (!abertura || !fechamento) {
      toast({ titulo: "Informe o horário de abertura e fechamento", variante: "erro" })
      return
    }
    if (abertura >= fechamento) {
      toast({ titulo: "O horário de abertura deve ser antes do fechamento", variante: "erro" })
      return
    }

    setSalvando(true)
    const payload = {
      nome_negocio: nomeNegocio.trim(),
      horario_abertura: abertura,
      horario_fechamento: fechamento,
      dias_inatividade: dias,
    }

    const { error } = await supabase.from("configuracoes").update(payload).eq("id", configuracao.id)
    setSalvando(false)

    if (error) {
      toast({ titulo: "Não foi possível salvar", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }

    await registrarLog({
      acao: "atualizar",
      tabela: "configuracoes",
      idRegistro: configuracao.id,
      dadosAnteriores: {
        nome_negocio: configuracao.nome_negocio,
        horario_abertura: configuracao.horario_abertura,
        horario_fechamento: configuracao.horario_fechamento,
        dias_inatividade: configuracao.dias_inatividade,
      },
      dadosNovos: payload,
    })

    toast({ titulo: "Configurações salvas", variante: "sucesso" })
    recarregar()
  }

  async function criarConfiguracaoPadrao() {
    setCriandoConfiguracao(true)
    const { error } = await supabase.from("configuracoes").insert({ nome_negocio: "Minha Barbearia" })
    setCriandoConfiguracao(false)

    if (error) {
      toast({ titulo: "Não foi possível criar a configuração", descricao: traduzErroAgendamento(error), variante: "erro" })
      return
    }
    toast({ titulo: "Configuração criada", variante: "sucesso" })
    recarregar()
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Carregando configurações...
      </div>
    )
  }

  if (!configuracao) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
        <Settings className="size-8 text-muted-foreground" strokeWidth={1.5} />
        <div>
          <p className="font-display text-lg font-semibold text-foreground">Nenhuma configuração encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie a configuração inicial do negócio para começar.
          </p>
        </div>
        <Button onClick={criarConfiguracaoPadrao} disabled={criandoConfiguracao}>
          {criandoConfiguracao ? "Criando..." : "Criar configuração"}
        </Button>
      </div>
    )
  }

  return (
    <Tabs defaultValue="geral">
      <TabsList>
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="api">API</TabsTrigger>
      </TabsList>

      <TabsContent value="geral" className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Identidade e preferências</CardTitle>
            <CardDescription>
              Essas informações aparecem na sidebar, no cabeçalho e na tela de login para toda a equipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Emblema logoUrl={configuracao.logo_url} nome={configuracao.nome_negocio} className="size-16" />
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={enviandoLogo}
                    onClick={() => inputLogoRef.current?.click()}
                  >
                    <ImageUp className="size-4" />
                    {enviandoLogo ? "Enviando..." : configuracao.logo_url ? "Trocar logo" : "Enviar logo"}
                  </Button>
                  {configuracao.logo_url && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoverLogo}>
                      <Trash2 className="size-4" />
                      Remover
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPEG, WEBP ou SVG, até 2MB.</p>
                <input
                  ref={inputLogoRef}
                  type="file"
                  accept={TIPOS_LOGO_ACEITOS.join(",")}
                  className="hidden"
                  onChange={handleArquivoLogo}
                />
              </div>
            </div>

            <Separator />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_negocio">Nome do negócio *</Label>
                <Input
                  id="nome_negocio"
                  value={nomeNegocio}
                  onChange={(e) => setNomeNegocio(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="abertura">Abre às *</Label>
                  <Input
                    id="abertura"
                    type="time"
                    value={abertura}
                    onChange={(e) => setAbertura(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechamento">Fecha às *</Label>
                  <Input
                    id="fechamento"
                    type="time"
                    value={fechamento}
                    onChange={(e) => setFechamento(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dias_inatividade">Dias de inatividade *</Label>
                <Input
                  id="dias_inatividade"
                  type="number"
                  min={1}
                  step="1"
                  value={diasInatividade}
                  onChange={(e) => setDiasInatividade(e.target.value)}
                  required
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Clientes sem visitar há mais tempo que isso aparecem na página de Retorno.
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={salvando}>
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="api" className="max-w-2xl">
        <AbaApi />
      </TabsContent>
    </Tabs>
  )
}
