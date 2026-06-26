import type { Product, ProductInput } from "./products"
import { logger } from "@/lib/logger"

/**
 * Importação/exportação do catálogo de produtos (CSV e JSON).
 * Estrutura de colunas esperada (nesta ordem no CSV):
 *   nome | descricao | valor | categoria | sku | marca | custo | estoque | imagem_url
 * Apenas "nome" e "valor" são obrigatórios.
 */
export const PRODUCT_COLUMNS = [
  "nome", "descricao", "valor", "categoria", "sku", "marca", "custo", "estoque", "imagem_url",
] as const

function toNumber(v: string | undefined): number {
  if (!v) return 0
  // aceita "1.234,56" ou "1234.56"
  const n = Number(String(v).replace(/\./g, "").replace(",", "."))
  return Number.isFinite(n) ? n : Number(v) || 0
}

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Parser de CSV que respeita aspas e vírgulas internas. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === "," || c === ";") { row.push(field); field = "" }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = "" }
      else field += c
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim() !== ""))
}

function rowToProduct(map: Record<string, string>): ProductInput | null {
  const name = (map["nome"] || map["name"] || "").trim()
  const price = toNumber(map["valor"] || map["preco"] || map["price"])
  if (!name || price <= 0) return null
  return {
    name,
    description: (map["descricao"] || map["descrição"] || map["description"] || "").trim() || undefined,
    price,
    category: (map["categoria"] || map["category"] || "").trim() || "Outros",
    sku: (map["sku"] || map["codigo"] || map["código"] || "").trim() || undefined,
    brand: (map["marca"] || map["brand"] || "").trim() || undefined,
    cost: toNumber(map["custo"] || map["cost"]) || undefined,
    stock: Math.round(toNumber(map["estoque"] || map["stock"])) || undefined,
    imageUrl: (map["imagem_url"] || map["imagem"] || map["image"] || "").trim() || undefined,
  }
}

/** Lê um arquivo (.csv ou .json) e retorna os produtos válidos. */
export async function parseProductsFile(file: File): Promise<{ products: ProductInput[]; ignored: number }> {
  const text = await file.text()
  const isJson = file.name.toLowerCase().endsWith(".json") || text.trim().startsWith("[") || text.trim().startsWith("{")
  const out: ProductInput[] = []
  let total = 0

  try {
    if (isJson) {
      const data = JSON.parse(text)
      const arr = Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : []
      for (const item of arr) {
        total++
        const map: Record<string, string> = {}
        for (const k of Object.keys(item)) map[k.toLowerCase()] = String(item[k] ?? "")
        const p = rowToProduct(map)
        if (p) out.push(p)
      }
    } else {
      const rows = parseCSV(text)
      if (rows.length < 2) return { products: [], ignored: 0 }
      const headers = rows[0].map((h) => h.trim().toLowerCase())
      for (let i = 1; i < rows.length; i++) {
        total++
        const map: Record<string, string> = {}
        headers.forEach((h, idx) => { map[h] = rows[i][idx] ?? "" })
        const p = rowToProduct(map)
        if (p) out.push(p)
      }
    }
  } catch (err) {
    logger.error("pdv", "falha ao ler arquivo de importação", err)
    throw new Error("Arquivo inválido. Verifique o formato (CSV ou JSON).")
  }

  logger.info("pdv", "arquivo de importação lido", { validos: out.length, ignorados: total - out.length })
  return { products: out, ignored: total - out.length }
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportProductsCSV(products: Product[]) {
  const header = PRODUCT_COLUMNS.join(",")
  const lines = products.map((p) =>
    [p.name, p.description, p.price, p.category, p.sku, p.brand, p.cost, p.stock, p.imageUrl]
      .map(csvEscape).join(",")
  )
  download("produtos-smartloop.csv", [header, ...lines].join("\n"), "text/csv;charset=utf-8")
  logger.success("pdv", "exportação CSV", { total: products.length })
}

export function exportProductsJSON(products: Product[]) {
  const data = products.map((p) => ({
    nome: p.name, descricao: p.description ?? "", valor: p.price, categoria: p.category ?? "",
    sku: p.sku ?? "", marca: p.brand ?? "", custo: p.cost ?? 0, estoque: p.stock ?? 0, imagem_url: p.imageUrl ?? "",
  }))
  download("produtos-smartloop.json", JSON.stringify(data, null, 2), "application/json")
  logger.success("pdv", "exportação JSON", { total: products.length })
}

export function downloadTemplate() {
  const header = PRODUCT_COLUMNS.join(",")
  const example = [
    "Película iPhone 14,Vidro temperado 9H,35.00,Películas,PEL-IP14,Genérica,12.00,20,",
    "Capa Silicone iPhone 14,Antichoque,25.00,Capas,CAP-IP14,Apple,8.00,15,",
    "Fone Bluetooth TWS,Cancelamento de ruído,149.90,Fones,FONE-TWS,JBL,80.00,5,",
  ].join("\n")
  download("modelo-produtos-smartloop.csv", `${header}\n${example}`, "text/csv;charset=utf-8")
  logger.info("pdv", "modelo CSV baixado")
}
