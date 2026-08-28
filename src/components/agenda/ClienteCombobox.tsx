import { Search, UserPlus, X } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/contexts/ToastContext"
import { useClientesBusca } from "@/hooks/useClientesBusca"
import { registrarLog } from "@/lib/logs"
import { supabase } from "@/lib/supabase"
import type { ClienteCRM } from "@/lib/types"

export function ClienteCombobox({
  value,
  onChange,
}: {
  value: ClienteCRM | null
  onChange: (cliente: ClienteCRM | null) => void
}) {
  const toast = useToast()
  const [termo, setTermo] = React.useState("")
  const [modoNovo, setModoNovo] = React.useState(false)
  const [nomeNovo, setNomeNovo] = React.useState("")
  const [whatsappNovo, setWhatsappNovo] = React.useState("")
  const [criando, setCriando] = React.useState(false)
  const { resultados, buscando } = useClientesBusca(termo)

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-input bg-secondary/40 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {value.nome || "(sem nome)"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{value.whatsapp}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onChange(null)} aria-label="Trocar cliente">
          <X className="size-4" />
        </Button>
      </div>
    )
  }

  if (modoNovo) {
    async function criarCliente() {
      if (!whatsappNovo.trim()) {
        toast({ titulo: "Informe o WhatsApp do cliente", variante: "erro" })
        return
      }
      setCriando(true)
      const { data, error } = await supabase
        .from("crm_barbearia")
        .insert({ whatsapp: whatsappNovo.trim(), nome: nomeNovo.trim() || null })
        .select("id, whatsapp, nome, tipo, status")
        .single()
      setCriando(false)

      if (error) {
        toast({
          titulo: "Não foi possível cadastrar o cliente",
          descricao: error.message.toLowerCase().includes("duplicate")
            ? "Já existe um cliente com esse WhatsApp."
            : error.message,
          variante: "erro",
        })
        return
      }

      await registrarLog({ acao: "criar", tabela: "crm_barbearia", idRegistro: data.id, dadosNovos: data })
      onChange(data)
      setModoNovo(false)
    }

    return (
      <div className="space-y-2 rounded-md border border-input bg-secondary/40 p-3">
        <Input
          placeholder="WhatsApp (obrigatório)"
          value={whatsappNovo}
          onChange={(e) => setWhatsappNovo(e.target.value)}
        />
        <Input
          placeholder="Nome (opcional)"
          value={nomeNovo}
          onChange={(e) => setNomeNovo(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setModoNovo(false)}>
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={criarCliente} disabled={criando}>
            {criando ? "Cadastrando..." : "Cadastrar e selecionar"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar por nome ou WhatsApp..."
          className="pl-9"
        />
      </div>

      {termo.trim().length >= 2 && (
        <div className="max-h-40 overflow-y-auto rounded-md border border-border">
          {buscando && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Buscando...</p>
          )}
          {!buscando && resultados.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          )}
          {resultados.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c)}
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-secondary"
            >
              <span className="text-foreground">{c.nome || "(sem nome)"}</span>
              <span className="text-xs text-muted-foreground">{c.whatsapp}</span>
            </button>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => setModoNovo(true)}>
        <UserPlus className="size-4" />
        Cadastrar novo cliente
      </Button>
    </div>
  )
}
