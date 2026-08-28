import { LogOut, User as UserIcon } from "lucide-react"
import { useLocation } from "react-router-dom"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { ITENS_MENU } from "@/lib/navegacao"

function tituloDaPagina(pathname: string): string {
  const item = ITENS_MENU.find((i) => pathname.startsWith(i.rota))
  return item?.titulo ?? "Sistema de Gestão para Barbearia"
}

function iniciais(texto: string): string {
  return texto.trim().slice(0, 2).toUpperCase()
}

export function Header() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const email = user?.email ?? ""

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <h1 className="pl-10 font-display text-lg font-semibold text-foreground lg:pl-0">
        {tituloDaPagina(location.pathname)}
      </h1>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar>
            <AvatarFallback>{email ? iniciais(email) : <UserIcon className="size-4" />}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:bg-destructive/10">
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
