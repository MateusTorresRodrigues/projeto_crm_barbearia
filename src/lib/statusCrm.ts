import type { StatusCrm } from "@/lib/types"

export const COLUNAS_STATUS_CRM: { valor: StatusCrm; label: string }[] = [
  { valor: "novo", label: "Novo" },
  { valor: "conversando", label: "Conversando" },
  { valor: "agendado", label: "Agendado" },
  { valor: "cancelou", label: "Cancelou" },
  { valor: "compareceu", label: "Compareceu" },
  { valor: "follow_up_1", label: "Follow-up 1" },
  { valor: "follow_up_2", label: "Follow-up 2" },
]

export const COR_STATUS_CRM: Record<StatusCrm, string> = {
  novo: "bg-secondary text-muted-foreground",
  conversando: "bg-primary/15 text-primary",
  agendado: "bg-primary/15 text-primary",
  cancelou: "bg-destructive/15 text-destructive",
  compareceu: "bg-green-500/15 text-green-500",
  follow_up_1: "bg-orange-500/15 text-orange-500",
  follow_up_2: "bg-orange-500/15 text-orange-500",
}
