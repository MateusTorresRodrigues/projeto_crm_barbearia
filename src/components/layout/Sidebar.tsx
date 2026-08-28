import { Menu, X } from "lucide-react"
import * as React from "react"
import { NavLink } from "react-router-dom"

import { Emblema } from "@/components/Emblema"
import { Button } from "@/components/ui/button"
import { useConfiguracao } from "@/contexts/ConfiguracaoContext"
import { ITENS_MENU } from "@/lib/navegacao"
import { cn } from "@/lib/utils"

function ConteudoMenu({ onNavegar }: { onNavegar?: () => void }) {
  const { nomeNegocio, logoUrl, loading } = useConfiguracao()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <Emblema logoUrl={logoUrl} nome={nomeNegocio} className="size-10" />
        <span className="truncate font-display text-base font-semibold text-foreground">
          {loading ? "" : nomeNegocio}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ITENS_MENU.map((item) => (
          <NavLink
            key={item.rota}
            to={item.rota}
            onClick={onNavegar}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                isActive && "bg-secondary text-primary"
              )
            }
          >
            <item.icone className="size-4 shrink-0" strokeWidth={1.75} />
            {item.titulo}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function Sidebar() {
  const [abertoMobile, setAbertoMobile] = React.useState(false)

  return (
    <>
      {/* Sidebar fixa (desktop) */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <ConteudoMenu />
      </aside>

      {/* Sidebar colapsável (mobile) */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-3 top-3 z-40"
          onClick={() => setAbertoMobile(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>

        {abertoMobile && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setAbertoMobile(false)}
            />
            <div className="relative z-10 w-64 bg-card shadow-xl">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => setAbertoMobile(false)}
                aria-label="Fechar menu"
              >
                <X className="size-5" />
              </Button>
              <ConteudoMenu onNavegar={() => setAbertoMobile(false)} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
