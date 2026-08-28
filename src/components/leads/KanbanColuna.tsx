import * as React from "react"

import { LeadCard } from "@/components/leads/LeadCard"
import type { CrmBarbearia, StatusCrm } from "@/lib/types"
import { cn } from "@/lib/utils"

export function KanbanColuna({
  status,
  label,
  leads,
  emArraste,
  onClickLead,
  onDragStartCard,
  onDropStatus,
}: {
  status: StatusCrm
  label: string
  leads: CrmBarbearia[]
  emArraste: boolean
  onClickLead: (lead: CrmBarbearia) => void
  onDragStartCard: (e: React.DragEvent<HTMLButtonElement>, leadId: string) => void
  onDropStatus: (status: StatusCrm) => void
}) {
  const [emHover, setEmHover] = React.useState(false)

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (emArraste) setEmHover(true)
      }}
      onDragLeave={() => setEmHover(false)}
      onDrop={() => {
        setEmHover(false)
        onDropStatus(status)
      }}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border border-border bg-secondary/20 transition-colors",
        emHover && "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="font-display text-sm font-semibold text-foreground">{label}</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {leads.length}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ minHeight: 120 }}>
        {leads.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">Nenhum lead aqui</p>
        )}
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => onClickLead(lead)}
            onDragStart={(e) => onDragStartCard(e, lead.id)}
          />
        ))}
      </div>
    </div>
  )
}
