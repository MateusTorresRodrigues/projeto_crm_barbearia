/** Monta o link `wa.me` para abrir uma conversa de WhatsApp com o número informado. */
export function linkWhatsApp(whatsapp: string): string {
  const numero = whatsapp.replace(/\D/g, "")
  return `https://wa.me/${numero}`
}
