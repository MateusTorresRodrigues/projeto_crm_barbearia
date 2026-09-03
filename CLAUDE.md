# Sistema de Gestão para Barbearia

## Visão geral

Sistema de gestão para uma barbearia com 3 barbeiros que atendem por hora marcada. Organiza a operação diária: agenda por profissional, cadastro de clientes, comanda de atendimento (fechamento financeiro), cálculo de comissão dos profissionais e um Kanban de Leads alimentado automaticamente por um agente de IA via n8n/Evolution API (WhatsApp).

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4 (config via `@theme` em [src/index.css](src/index.css), sem `tailwind.config.js`)
- shadcn/ui (componentes montados manualmente em [src/components/ui/](src/components/ui/) — ver "Componentes de UI" abaixo)
- Supabase (Postgres + Auth + Storage + Realtime)
- React Router (v7, `react-router-dom`)

## Banco de dados (Supabase)

- Projeto: `crm-barbearia` (ref `pxpwkegxvxnricfiexrm`, região `sa-east-1`)
- Timezone do banco: `America/Sao_Paulo`
- Tabelas padrão: `usuarios`, `api_tokens` (com `ultimo_uso_em`, desde a Etapa 9), `configuracoes`, `logs_sistema`
- Edge Function `agente` ([supabase/functions/agente/](supabase/functions/agente/)) — porta de entrada do agente de IA, autenticada por token de `api_tokens` (ver "Integração do agente de IA" abaixo)
- Tabela principal do CRM: `crm_barbearia` (leads/clientes, alimenta o Kanban de Leads, Realtime habilitado)
- Tabelas de domínio: `profissionais`, `agendas`, `escalas`, `servicos`, `agendamentos`, `comandas`, `comanda_servicos`
- RLS habilitado em todas as tabelas (CRUD para `authenticated`; `crm_barbearia` e `agendamentos` também aceitam insert/update via `service_role` para o agente de IA)
- Triggers principais: `updated_at` automático, lead vira cliente ao comparecer, sincronização de status `agendamentos` → `crm_barbearia`, cálculo de `minutos_ultima_mensagem`, criação automática de `agenda` ao cadastrar profissional, validação de conflito de horário e de escala em `agendamentos`, cálculo automático de `valor_total`/`valor_comissao` da comanda
- Bucket de Storage `logos`: público, aceita PNG/JPEG/WEBP/SVG (usado na página de Configurações)
- Realtime habilitado em `crm_barbearia` (Kanban de Leads) e `configuracoes` (sincronização do nome/logo do negócio em toda a interface)

O schema completo (colunas, constraints, funções) foi criado via migrations aplicadas diretamente no projeto Supabase — não há uma pasta local de migrations neste repositório.

## Variáveis de ambiente

Definidas em `.env.local` (não versionado — veja `.env.example` para o formato):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Usadas pelo cliente Supabase em [src/lib/supabase.ts](src/lib/supabase.ts).

## Estrutura de pastas

```
src/
  components/
    ui/            componentes shadcn/ui (button, input, dialog, dropdown-menu, avatar, card, label, separator)
    layout/        AppLayout, Sidebar, Header
    profissionais/ ProfissionalCard, ProfissionalFormDialog, EscalaEditor
    agenda/        GradeSemana, GradeMes, BlocoAgendamento, FiltroProfissionais, ClienteCombobox, AgendamentoFormDialog, AgendamentoDetalhesDialog
    servicos/      ServicoFormDialog
    clientes/      ClienteFormDialog, ClienteDetalhesDialog, HistoricoAtendimentos (reaproveitado no card de Leads)
    comandas/      NovaComandaDialog, ComandaDetalhesDialog
    leads/         KanbanColuna, LeadCard, LeadDetalhesDialog
    Emblema.tsx    emblema circular (logo/ícone do app)
    ProtectedRoute.tsx
  contexts/
    AuthContext.tsx          sessão do Supabase Auth
    ConfiguracaoContext.tsx  dados de `configuracoes` (nome/logo do negócio), com Realtime
    ConfirmDialogContext.tsx modal de confirmação global (`useConfirm()`)
    ToastContext.tsx         notificações não bloqueantes (`useToast()`)
  hooks/
    useProfissionais.ts    profissionais + agenda (cor) + escalas
    useServicos.ts         serviços (com opção de incluir inativos, para a tela de administração)
    useAgendamentos.ts     agendamentos de um intervalo de datas, com cliente/serviço/agenda unidos
    useClientesBusca.ts    busca de clientes em `crm_barbearia` com debounce (usada no agendamento/comanda)
    useClientes.ts         listagem de `crm_barbearia` com tipo=cliente, busca e filtro por barbeiro preferido
    useHistoricoCliente.ts histórico unificado de um cliente (agendamentos + comandas avulsas fechadas)
    useComandas.ts         listagem de comandas com filtro por status/profissional/período
    useComandaDetalhada.ts uma comanda com seus itens (`comanda_servicos`) unidos, para a tela de detalhes
    useComissao.ts         comandas fechadas de um período, agrupadas por profissional
    useLeadsRealtime.ts    todos os registros de `crm_barbearia` sincronizados via Supabase Realtime (Kanban)
    useClientesInativos.ts clientes tipo=cliente cuja última visita passou de `configuracoes.dias_inatividade`
    useUsuarios.ts         usuários da equipe (tabela `usuarios`), para o filtro por usuário da tela de Logs
    useLogsSistema.ts      `logs_sistema` paginado (mais recentes primeiro) com usuário unido e filtros por tabela/usuário/período
  lib/
    supabase.ts    cliente Supabase
    navegacao.ts   itens do menu lateral (título, rota, ícone)
    types.ts       tipos das linhas do banco usados no front-end
    logs.ts        `registrarLog()` — grava em `logs_sistema` (best-effort)
    horarios.ts    helpers de data/hora e tradução de erros do banco
    calendario.ts  cálculo das bandas de disponibilidade (união/complemento de escalas) para a grade do calendário
    statusCrm.ts   colunas do Kanban (ordem/rótulos) e cores por status de `crm_barbearia`
    whatsapp.ts    `linkWhatsApp()` — monta o link `wa.me` a partir do número do cliente
    utils.ts       helper `cn()`
  pages/          uma página por rota (ver tabela abaixo)
  App.tsx         definição das rotas
  main.tsx        providers globais (Router, Auth, Configuracao, Toast, ConfirmDialog)
supabase/
  functions/
    agente/       Edge Function chamada pelo agente de IA (n8n) — ver "Integração do agente de IA"
```

## Estrutura de páginas e rotas

Login público; todas as demais rotas são protegidas por autenticação (`ProtectedRoute`, redireciona para `/login` quando não há sessão) e renderizadas dentro do layout base (`AppLayout`): sidebar fixa à esquerda (colapsável em telas menores, com o nome/logo do negócio no topo) + header superior (título da página atual + avatar/menu do usuário com opção de sair).

| Rota | Página |
|---|---|
| `/login` | Login (pública) |
| `/dashboard` | Dashboard |
| `/agenda` | Agendas — calendário visual por profissional, estilo Google Calendar (semana/mês) |
| `/profissionais` | Profissionais — cadastro, escala de disponibilidade e ativação |
| `/clientes` | Clientes — listagem, busca, filtro por barbeiro e histórico de atendimentos |
| `/leads` | Leads / Kanban-CRM — colunas por status, arrastar para mover, atualização em tempo real |
| `/servicos` | Serviços — catálogo (nome, duração, preço) e ativação |
| `/retorno` | Retorno — clientes inativos, com ação rápida para abrir o WhatsApp |
| `/configuracoes` | Configurações |
| `/logs` | Logs |

Profissionais, Agenda, Serviços, Clientes, Comanda, Comissão, Leads/Kanban-CRM, Retorno, Dashboard, Configurações e Logs já estão implementadas (ver "Histórico de etapas construídas"). A navegação, o layout e a autenticação já estão prontos para todas as rotas.

> **Comanda e Comissão temporariamente desativadas** (a pedido do usuário, Etapa 12): as rotas `/comandas` e `/comissao`, os itens correspondentes no menu ([src/lib/navegacao.ts](src/lib/navegacao.ts)) e os cards do Dashboard que linkavam para elas foram removidos. O código das páginas (`src/pages/Comandas.tsx`, `src/pages/Comissao.tsx`), os componentes (`src/components/comandas/`) e os hooks (`useComandas`, `useComandaDetalhada`, `useComissao`) **não foram apagados** — continuam no repositório, só não estão referenciados em `App.tsx`. As tabelas `comandas`/`comanda_servicos` e os triggers de cálculo de valor/comissão continuam ativos no banco. Para reativar: reinserir as duas linhas em `ITENS_MENU` e as duas `<Route>` em `App.tsx`, e devolver os três cards de faturamento/comissão ao Dashboard.

### Agenda — detalhes de implementação

- Grade própria (sem biblioteca de calendário externa): visão semana (grade de horas por dia, `GradeSemana`) e mês (`GradeMes`), com alternância no topo da página.
- Cada profissional é uma "cor" (a de sua `agenda`); o filtro (`FiltroProfissionais`) decide quais aparecem sobrepostos na grade — quando mais de um profissional está selecionado, cada um ocupa uma coluna própria dentro do dia.
- As faixas fora da escala (`bandasIndisponiveis` em [src/lib/calendario.ts](src/lib/calendario.ts), união das escalas dos profissionais visíveis) aparecem esmaecidas na grade semanal.
- Criar (clique em horário livre), remarcar (arrastar um bloco ou editar data/hora no modal de detalhes) e cancelar (com confirmação) chamam o Supabase diretamente; conflitos de horário e violações de escala são validados pelos triggers do banco e a mensagem é exibida via toast, sem recarregar a tela.
- Cliente do agendamento é buscado ou cadastrado rapidamente em `crm_barbearia` pelo próprio modal (`ClienteCombobox`).

### Clientes — detalhes de implementação

- Lista apenas registros de `crm_barbearia` com `tipo = cliente`; leads ainda não viram cliente não aparecem aqui (isso acontece automaticamente quando um agendamento é marcado como `compareceu`, ou o cadastro manual já cria com `tipo = cliente`).
- O histórico de atendimentos (`useHistoricoCliente`) une duas origens em uma única linha do tempo: os `agendamentos` do cliente (com a comanda fechada vinculada, se houver, trazendo serviço(s) e valor) e comandas fechadas avulsas (`id_agendamento is null`, atendimentos sem agendamento prévio). O indicador de "última visita" considera agendamentos com status `compareceu` e comandas fechadas.
- Excluir um cliente remove em cascata (via FK do banco) os agendamentos, comandas e itens de comanda vinculados — o modal de confirmação avisa isso explicitamente.

### Comanda e Comissão — detalhes de implementação

- Uma nova comanda pode nascer vinculada a um agendamento de hoje sem comanda ainda (`NovaComandaDialog` lista os candidatos e preenche cliente/profissional automaticamente) ou ser lançada manualmente (cliente via `ClienteCombobox`, profissional escolhido à mão) — o vínculo é opcional (`comandas.id_agendamento` aceita `null`).
- `valor_total` e `valor_comissao` nunca são calculados no front-end: toda inclusão, edição de preço ou remoção em `comanda_servicos` é gravada direto no Supabase, o trigger do banco recalcula os dois campos, e a tela busca a comanda atualizada (`useComandaDetalhada`) para refletir o valor em tempo real.
- Fechar/reabrir é só uma troca de `status` — quando `fechada`, a tela desabilita adicionar, editar preço e remover itens; "Reabrir comanda" volta para `aberta` e libera a edição de novo.
- A página de Comissão (`useComissao`) busca as comandas com `status = 'fechada'` cujo `updated_at` cai no período filtrado (mês ou intervalo de datas) e agrupa por profissional no front-end, somando `valor_comissao` e contando atendimentos; cada grupo mostra a lista detalhada (data, cliente, serviço(s), valor total, comissão) e há um totalizador geral do período.

### Dashboard — detalhes de implementação

- Página só de leitura, sem estado próprio salvo no banco: compõe hooks já existentes (`useAgendamentos`, `useComissao`, `useLeadsRealtime`, `useClientesInativos`) em vez de criar uma nova fonte de dados — os cartões de indicador reagem às mesmas regras de negócio já validadas nas telas de origem.
- Cartões no topo: agendamentos de hoje (com quantos já compareceram, linka para Agenda), leads novos (`status = novo`, com quantos em andamento, linka para Leads) e clientes para retorno (`useClientesInativos`, mesmo critério de `dias_inatividade` usado na página Retorno, linka para Retorno). Os cards de faturamento/comissão (`useComissao`) foram removidos junto com a Etapa 12 (ver nota em "Estrutura de páginas e rotas") — a página ainda não usa `useComissao`.
- Abaixo, a lista "Agenda de hoje" repete os agendamentos do dia (cor do profissional, cliente, serviço, badge de status), sem paginação — é um resumo, não substitui a grade da página Agenda.

### Leads / Kanban-CRM e Retorno — detalhes de implementação

- O Kanban mostra todos os registros de `crm_barbearia` (leads e clientes), um card por registro, agrupados na coluna do seu `status` (`src/lib/statusCrm.ts` define a ordem e os rótulos das 7 colunas). `useLeadsRealtime` carrega a lista uma vez e a partir daí só reage a eventos `postgres_changes` da tabela — não há polling; quando o agente de IA (n8n/Evolution API) atualiza um `status` direto no banco, o card se move sozinho.
- Arrastar um card para outra coluna faz uma atualização otimista local (`atualizarLocal`) e grava o novo `status` no Supabase; se o Supabase recusar, a posição volta ao estado anterior e um toast explica o motivo. O evento Realtime da própria escrita chega logo em seguida e apenas confirma o estado (idempotente).
- O modal de detalhes do lead é somente leitura (dados cadastrais, motivo do contato, resumo da conversa e, quando `tipo = cliente`, o histórico de atendimentos via `HistoricoAtendimentos`) — edição de cadastro continua sendo feita pela página de Clientes.
- Retorno (`useClientesInativos`) calcula a última visita de cada cliente (maior data entre agendamentos `compareceu` e comandas `fechada`) e lista quem passou de `configuracoes.dias_inatividade` dias sem aparecer, do mais inativo para o menos inativo; clientes sem nenhuma visita registrada não entram na lista (não há uma "última visita" da qual contar). O botão de ação abre `wa.me` (`src/lib/whatsapp.ts`) em uma nova aba.

### Configurações e Logs — detalhes de implementação

- `configuracoes` ganhou as colunas `horario_abertura` e `horario_fechamento` (tipo `time`, padrão 09:00–19:00) para o horário de funcionamento exibido no formulário — as demais colunas já existiam desde a Etapa 1.
- A página tem só a seção "Geral" (o formulário de identidade/preferências). A aba "API" de gestão de tokens (criada na Etapa 9) foi removida a pedido do usuário para evitar que um funcionário da barbearia mexa sem querer nos tokens do agente de IA — a gestão de `api_tokens` passou a ser feita direto no Supabase (SQL Editor), documentada em "Integração do agente de IA" abaixo. `src/components/ui/tabs.tsx` e a dependência `@radix-ui/react-tabs` foram removidos por ficarem sem uso.
- O upload de logo acontece assim que um arquivo é escolhido (sem esperar o botão "Salvar"): valida tipo (PNG/JPEG/WEBP/SVG) e tamanho (até 2MB) no front-end, envia para o bucket `logos` com um nome de arquivo único, atualiza `configuracoes.logo_url` e remove o arquivo antigo do Storage; "Remover logo" pede confirmação (`useConfirm`) antes de limpar o campo. Os demais campos (nome do negócio, horário, dias de inatividade) são salvos juntos por um único botão "Salvar alterações". Toda alteração é refletida na sidebar/header/login pelo Realtime já existente no `ConfiguracaoContext`.
- Logs (`useLogsSistema`) lista `logs_sistema` com o usuário já unido, mais recentes primeiro, paginado 50 em 50 ("Carregar mais"); filtros por tabela, usuário (`useUsuarios`) e período são aplicados na própria query. Cada linha expande para mostrar `dados_anteriores`/`dados_novos` como pares campo/valor traduzidos (não como JSON bruto). Quando não há `id_usuario` vinculado, a tela exibe "Agente de IA" se a tabela afetada for uma das que aceitam escrita via `service_role` (`crm_barbearia`, `agendamentos`) ou "Sistema" caso contrário — desde a Etapa 9 isso acontece de verdade: a Edge Function do agente grava logs com `id_usuario: null`.

### Integração do agente de IA (n8n/Evolution API) — detalhes de implementação

- O n8n nunca recebe a `service_role key` do Supabase diretamente. Em vez disso, existe uma Edge Function única, **`agente`** ([supabase/functions/agente/index.ts](supabase/functions/agente/index.ts)), implantada com `verify_jwt = false` porque implementa autenticação própria: o n8n manda `Authorization: Bearer <token>`, e a função valida esse token contra a tabela `api_tokens` (usando a `service_role key`, disponível automaticamente dentro da Edge Function) antes de executar qualquer ação. A cada chamada válida, `api_tokens.ultimo_uso_em` é atualizado.
- **Gestão de tokens:** não existe mais tela no site para isso (removida a pedido do usuário — ver "Configurações" acima). Tokens são criados/consultados/revogados direto no Supabase, pelo SQL Editor:
  ```sql
  -- criar
  insert into api_tokens (nome, token, ativo)
  values ('n8n produção', 'bhk_' || encode(extensions.gen_random_bytes(32), 'hex'), true)
  returning token;

  -- consultar
  select nome, ativo, ultimo_uso_em, created_at from api_tokens order by created_at desc;

  -- desativar / excluir
  update api_tokens set ativo = false where nome = 'n8n produção';
  delete from api_tokens where nome = 'n8n produção';
  ```
- Requisição: `POST { action: string, payload?: object }`. Resposta: `{ ok: true, data }` ou `{ ok: false, erro: string }` com o status HTTP correspondente. Ações disponíveis:
  - `buscar_lead { whatsapp }` — retorna o registro de `crm_barbearia` ou `null`.
  - `upsert_lead { whatsapp, nome?, status?, origem?, observacoes?, barbeiro_preferido?, frequencia_visita?, motivo_contato?, resumo_conversa?, ultima_mensagem?, follow_up_1?, follow_up_2? }` — cria o lead (`tipo: "lead"`, `status: "novo"`) se o whatsapp não existir, ou atualiza só os campos enviados; valida `status` contra os valores de `StatusCrm`.
  - `listar_servicos` / `listar_profissionais` — leitura simples dos ativos, para o agente conhecer opções e preços.
  - `disponibilidade { id_profissional, data, duracao_minutos? }` — cruza a escala do profissional naquele dia da semana com os agendamentos já existentes e devolve os horários livres (`"HH:MM"`, passo de 30min por padrão).
  - `criar_agendamento { whatsapp, nome?, id_servico, id_profissional, data_hora_inicio }` — reaproveita ou cria o lead pelo whatsapp e insere o agendamento; conflito de horário e violação de escala continuam validados pelos triggers do banco (a função só traduz a mensagem de erro).
- **Fuso horário:** a Edge Function roda em UTC, mas o negócio opera em `America/Sao_Paulo` (offset fixo `-03:00`, já que o Brasil não observa horário de verão desde 2019). Por isso toda data/hora sem timezone explícito recebida no `payload` (ex.: `"2026-08-28T10:00:00"`) é interpretada como horário de São Paulo, nunca como UTC — ver `instanteLocal()` no código da função. Ao montar o workflow no n8n, tanto enviar a hora "nua" (`2026-08-28T10:00:00`) quanto com o offset explícito (`2026-08-28T10:00:00-03:00`) funciona; enviar em UTC (`Z`) também funciona, mas representa um horário diferente do pretendido se a intenção era horário de Brasília.
- A URL da função é `${VITE_SUPABASE_URL}/functions/v1/agente`; use-a no node HTTP Request do n8n junto com um token gerado pelo SQL Editor (ver acima).
- Para montar o workflow no n8n: um trigger de webhook recebe o evento da Evolution API (mensagem do WhatsApp), um node de IA (ex.: LLM com ferramentas) decide a ação e monta o `payload`, e um node HTTP Request chama a Edge Function com o token gerado nessa tela. A lógica de conversa em si (prompt, decisão do que perguntar, quando oferecer horário) fica inteiramente no workflow do n8n — fora deste repositório.

## Identidade visual

- **Paleta de cores:** fundo em preto/carvão (`#0D0D0D` a `#1A1A1A`), superfícies em cinza-chumbo escuro (`#212121`/`#262626`), destaque em âmbar/caramelo (`#C7883C` a `#B8732E`, tom "couro"), texto principal em off-white/creme (`#F2EAE1`), texto secundário em cinza claro quente (`#A39C92`). Tema único e sempre escuro (sem alternância claro/escuro) — os tokens ficam em `@theme` no topo de [src/index.css](src/index.css).
- **Tipografia:** títulos em Oswald (peso 500–700, condensada e robusta, toque vintage/másculino), corpo de texto em Inter (limpa, legível em tabelas e telas de dados). Carregadas via Google Fonts no topo de `index.css`. Tokens `font-display` / `font-sans`.
- **Iconografia:** ícones de traço simples (`lucide-react`), cantos levemente arredondados (`--radius-*` em `index.css`). Elemento circular/emblema (`src/components/Emblema.tsx`) inspirado em brasões de barbearia, usado com moderação — hoje no login e como base do favicon (`public/favicon.svg`).
- **Direção geral:** visual escuro e sóbrio, alto contraste entre fundo e destaque âmbar, estética de barbearia tradicional sem abrir mão de uma interface limpa e funcional para uso diário da equipe.

## Componentes de UI

Os componentes em `src/components/ui/` seguem a convenção shadcn/ui, mas foram escritos manualmente (a CLI atual do shadcn assume presets voltados a Next.js incompatíveis com este setup Vite). `components.json` foi mantido para compatibilidade caso a CLI clássica (`npx shadcn add`) seja usada no futuro para adicionar novos componentes.

## Contextos globais

- `AuthProvider` — sessão do Supabase Auth, `signIn`/`signOut`, usado por `ProtectedRoute` e pelo Header.
- `ConfiguracaoProvider` — carrega `configuracoes` (nome do negócio, logo, fuso horário) e mantém tudo sincronizado em tempo real via Realtime; consumido pela Sidebar, Header e Login.
- `ConfirmDialogProvider` — modal de confirmação único e global; qualquer tela chama `const confirmar = useConfirm()` antes de excluir um registro.
- `ToastProvider` — notificações não bloqueantes (`const toast = useToast()`), usadas principalmente para reportar de forma amigável os erros retornados pelos triggers do banco (ex.: conflito de horário, fora da escala).

## Observações

- Todo o conteúdo da interface em português do Brasil.
- Usuários são criados exclusivamente pelo desenvolvedor via Supabase (não há tela de cadastro/self-signup).

## Histórico de etapas construídas

- **Etapa 1 — Banco de dados:** criado o schema completo no Supabase (tabelas padrão, `crm_barbearia`, tabelas de domínio, triggers, RLS, Storage, Realtime em `crm_barbearia`, seed inicial).
- **Etapa 2 — Estrutura, navegação e login:** criados login, layout base (sidebar/header), rotas protegidas e identidade visual do sistema.
- **Etapa 3 — Profissionais e Agendas:** criados o cadastro de profissionais com escala de disponibilidade e a agenda visual por profissional estilo Google Calendar.
- **Etapa 4 — Serviços e Clientes:** criados o catálogo de serviços e a página de Clientes com histórico completo de atendimentos.
- **Etapa 5 — Comanda e Comissão:** criado o fechamento de atendimentos com cálculo automático de valor e comissão, e a página de Comissão por profissional.
- **Etapa 6 — Leads, Kanban/CRM e Retorno:** criado o Kanban de leads com atualização em tempo real e a página de Retorno para clientes inativos.
- **Etapa 7 — Dashboard:** criada a página inicial com indicadores gerais (agendamentos do dia, faturamento, comissão do mês, leads e clientes para retorno), composta a partir dos hooks já existentes das demais telas.
- **Etapa 8 — Configurações e Logs:** criada a página de Configurações com upload de logo e a página de Logs com histórico de ações do sistema.
- **Etapa 9 — Integração do agente de IA:** criada a Edge Function `agente` (autenticada por token, gerencia `crm_barbearia` e `agendamentos` via `service_role`) e a gestão de tokens na aba "API" de Configurações.
- **Etapa 10 — Auditoria de segurança (2026-08-28):** revisão completa de RLS, triggers, Edge Function, Storage e frontend, sem nenhuma alteração de código ou banco. Resultado: 1 risco **crítico** (self-signup habilitado no Supabase Auth — como toda política de RLS libera CRUD para qualquer usuário `authenticated`, qualquer pessoa pode se autocadastrar e obter acesso total aos dados) e 4 riscos **altos** (`logs_sistema` permite `UPDATE`/`DELETE` para qualquer autenticado, tokens de `api_tokens` guardados em texto plano, credencial de teste da Etapa 8/9 ainda ativa, token do agente sem escopo granular) — ver relatório completo entregue nesta etapa para a lista integral (inclui também riscos médios/baixos e os itens auditados sem problema).
- **Etapa 11 — Deploy seguro para o GitHub (2026-08-28):** verificado que nenhum segredo estava hardcoded no código ou no CLAUDE.md, `.gitignore` reforçado (`.env`, `.env.local`, `.env.*.local`, `build` adicionados), primeiro commit criado e enviado para [github.com/MateusTorresRodrigues/projeto_crm_barbearia](https://github.com/MateusTorresRodrigues/projeto_crm_barbearia) (branch `main`). **Todas as 11 etapas planejadas do projeto foram concluídas com sucesso.**
- **Etapa 12 — Comanda e Comissão temporariamente desativadas (2026-09-02):** a pedido do usuário, removidos do menu e das rotas (sem apagar código nem dados — ver nota em "Estrutura de páginas e rotas").

## Próximos passos

- Reativar Comanda e Comissão quando o usuário pedir (ver nota em "Estrutura de páginas e rotas")

Correções recomendadas pela auditoria de segurança (Etapa 10), da mais para a menos urgente:

- Desabilitar o self-signup no Supabase Auth (Authentication → Providers → Email → "Allow new users to sign up") e/ou restringir as políticas de RLS para exigir um registro correspondente em `usuarios`, não apenas `authenticated`
- Remover as policies `authenticated_update_logs_sistema` e `authenticated_delete_logs_sistema` — `logs_sistema` deveria aceitar só `SELECT`/`INSERT`
- Trocar (ou excluir) a conta de teste `mateus19torres96@gmail.com` criada durante a Etapa 8
- Migrar `api_tokens.token` para um hash (ex.: SHA-256) em vez de texto plano
- Avaliar remover as tabelas de outro template encontradas no mesmo projeto Supabase (`companies`, `contacts`, `deals`, `pipeline_stages`, `reminders`, `activity_log`) — hoje vazias ou com dado genérico, mas fora do escopo documentado deste sistema
- Habilitar "Leaked Password Protection" no Supabase Auth (achado automático do Security Advisor)
- Itens menores: restringir o CORS da Edge Function `agente` (hoje `*`), limitar o tamanho de campos de texto livre no `payload`, e reconsiderar aceitar upload de SVG no bucket `logos`
