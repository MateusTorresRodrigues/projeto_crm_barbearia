import {
  Calendar,
  Columns3,
  History,
  LayoutDashboard,
  Percent,
  Receipt,
  ScrollText,
  Scissors,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

export type ItemMenu = {
  titulo: string
  rota: string
  icone: LucideIcon
}

export const ITENS_MENU: ItemMenu[] = [
  { titulo: "Dashboard", rota: "/dashboard", icone: LayoutDashboard },
  { titulo: "Agenda", rota: "/agenda", icone: Calendar },
  { titulo: "Profissionais", rota: "/profissionais", icone: Users },
  { titulo: "Clientes", rota: "/clientes", icone: UsersRound },
  { titulo: "Leads", rota: "/leads", icone: Columns3 },
  { titulo: "Comanda", rota: "/comandas", icone: Receipt },
  { titulo: "Serviços", rota: "/servicos", icone: Scissors },
  { titulo: "Comissão", rota: "/comissao", icone: Percent },
  { titulo: "Retorno", rota: "/retorno", icone: History },
  { titulo: "Configurações", rota: "/configuracoes", icone: Settings },
  { titulo: "Logs", rota: "/logs", icone: ScrollText },
]
