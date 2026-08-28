import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

type ToastVariante = "default" | "sucesso" | "erro"

type Toast = {
  id: number
  titulo: string
  descricao?: string
  variante: ToastVariante
}

type ToastInput = {
  titulo: string
  descricao?: string
  variante?: ToastVariante
}

const ToastContext = React.createContext<((toast: ToastInput) => void) | undefined>(
  undefined
)

let proximoId = 1

const ICONE_POR_VARIANTE: Record<ToastVariante, React.ElementType> = {
  default: Info,
  sucesso: CheckCircle2,
  erro: AlertTriangle,
}

const COR_POR_VARIANTE: Record<ToastVariante, string> = {
  default: "border-border text-foreground [&_svg]:text-primary",
  sucesso: "border-border text-foreground [&_svg]:text-green-500",
  erro: "border-destructive/50 text-foreground [&_svg]:text-destructive",
}

/**
 * Notificações não bloqueantes (toasts), usadas para reportar erros do
 * banco (ex.: conflito de horário) e confirmações de ações sem interromper
 * a interface.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((input: ToastInput) => {
    const id = proximoId++
    setToasts((atual) => [
      ...atual,
      { id, titulo: input.titulo, descricao: input.descricao, variante: input.variante ?? "default" },
    ])
    setTimeout(() => {
      setToasts((atual) => atual.filter((t) => t.id !== id))
    }, 6000)
  }, [])

  const remover = (id: number) => {
    setToasts((atual) => atual.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icone = ICONE_POR_VARIANTE[t.variante]
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-4 shadow-lg",
                COR_POR_VARIANTE[t.variante]
              )}
            >
              <Icone className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.titulo}</p>
                {t.descricao && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.descricao}</p>
                )}
              </div>
              <button
                onClick={() => remover(t.id)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Fechar notificação"
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider")
  }
  return context
}
