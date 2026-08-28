import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ConfirmOptions = {
  titulo?: string
  descricao?: string
  textoConfirmar?: string
  textoCancelar?: string
}

type ConfirmContextValue = (options?: ConfirmOptions) => Promise<boolean>

const ConfirmDialogContext = React.createContext<ConfirmContextValue | undefined>(
  undefined
)

const OPCOES_PADRAO: Required<ConfirmOptions> = {
  titulo: "Confirmar exclusão",
  descricao: "Essa ação não pode ser desfeita. Deseja continuar?",
  textoConfirmar: "Excluir",
  textoCancelar: "Cancelar",
}

/**
 * Disponibiliza um modal de confirmação único e global para todas as
 * telas do sistema. Uso: `const confirmar = useConfirm(); if (await confirmar()) { ... }`
 */
export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<Required<ConfirmOptions>>(OPCOES_PADRAO)
  const resolverRef = React.useRef<(value: boolean) => void>(undefined)

  const confirmar = React.useCallback<ConfirmContextValue>((opts) => {
    setOptions({ ...OPCOES_PADRAO, ...opts })
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const handleResposta = (resposta: boolean) => {
    setOpen(false)
    resolverRef.current?.(resposta)
    resolverRef.current = undefined
  }

  return (
    <ConfirmDialogContext.Provider value={confirmar}>
      {children}
      <Dialog open={open} onOpenChange={(v) => !v && handleResposta(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{options.titulo}</DialogTitle>
            <DialogDescription>{options.descricao}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleResposta(false)}>
              {options.textoCancelar}
            </Button>
            <Button variant="destructive" onClick={() => handleResposta(true)}>
              {options.textoConfirmar}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirm() {
  const context = React.useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error("useConfirm deve ser usado dentro de um ConfirmDialogProvider")
  }
  return context
}
