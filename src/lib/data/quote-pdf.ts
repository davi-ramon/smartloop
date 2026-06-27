import { jsPDF } from "jspdf"
import { logger } from "@/lib/logger"

const brl = (n: number) => `R$ ${(n ?? 0).toFixed(2).replace(".", ",")}`

export interface QuotePdfItem {
  description: string
  quantity: number
  unitPrice: number
  type: "part" | "labor" | "other"
}

export interface QuotePdfData {
  store: { name: string; whatsapp?: string }
  customerName?: string
  deviceLabel?: string
  items: QuotePdfItem[]
  totalParts: number
  totalLabor: number
  total: number
}

/** Gera e baixa um PDF do orçamento com a identidade do SmartLoop. */
export function downloadQuotePDF(data: QuotePdfData) {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" })
    const W = doc.internal.pageSize.getWidth()
    const M = 48
    let y = 64

    // Faixa de marca
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, W, 8, "F")

    // Cabeçalho — loja
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.setTextColor(17, 24, 39)
    doc.text(data.store.name || "Orçamento", M, y)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text("Orçamento de serviço", M, y + 16)
    if (data.store.whatsapp) doc.text(`WhatsApp: ${data.store.whatsapp}`, W - M, y + 16, { align: "right" })
    y += 44

    // Cliente / aparelho
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(11)
    if (data.customerName) { doc.text(`Cliente: ${data.customerName}`, M, y); y += 16 }
    if (data.deviceLabel) { doc.text(`Aparelho: ${data.deviceLabel}`, M, y); y += 16 }
    doc.setFontSize(9)
    doc.setTextColor(156, 163, 175)
    doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")}`, M, y); y += 14

    // Cabeçalho da tabela
    doc.setDrawColor(229, 231, 235)
    doc.line(M, y, W - M, y); y += 18
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text("Item", M, y)
    doc.text("Qtd", W - 170, y)
    doc.text("Valor", W - M, y, { align: "right" })
    y += 8
    doc.line(M, y, W - M, y); y += 18

    // Itens
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(11)
    for (const it of data.items) {
      doc.text(String(it.description).slice(0, 52), M, y)
      doc.text(String(it.quantity), W - 170, y)
      doc.text(brl(it.unitPrice * it.quantity), W - M, y, { align: "right" })
      y += 18
      if (y > 760) { doc.addPage(); y = 64 }
    }

    y += 6
    doc.line(M, y, W - M, y); y += 22

    // Totais
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text("Peças", W - 170, y); doc.text(brl(data.totalParts), W - M, y, { align: "right" }); y += 16
    doc.text("Mão de obra", W - 170, y); doc.text(brl(data.totalLabor), W - M, y, { align: "right" }); y += 22
    doc.setFont("helvetica", "bold")
    doc.setFontSize(15)
    doc.setTextColor(37, 99, 235)
    doc.text("Total", W - 170, y); doc.text(brl(data.total), W - M, y, { align: "right" })

    // Rodapé
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(156, 163, 175)
    doc.text("Documento gerado pelo SmartLoop", M, 812)

    const safeName = (data.customerName || "cliente").replace(/\s+/g, "-").toLowerCase()
    doc.save(`orcamento-${safeName}.pdf`)
    logger.success("orcamento", "PDF gerado", { itens: data.items.length })
  } catch (err) {
    logger.error("orcamento", "falha ao gerar PDF", err)
    throw err
  }
}
