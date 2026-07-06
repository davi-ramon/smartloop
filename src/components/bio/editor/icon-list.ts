import { BRAND_ICON_NAMES } from "../brand-icons"

/**
 * Lista de ícones disponíveis para a Bio. Marcas primeiro (renderizam via
 * BrandIcons), depois ícones genéricos do lucide-react. A busca é case-insensitive.
 */
export const BIO_ICON_OPTIONS = [
  ...BRAND_ICON_NAMES,
  // Genéricos lucide (fallback)
  "Link", "Link2", "ExternalLink", "Globe", "Mail", "Phone", "MessageCircle", "Send",
  "Share2", "Home", "Store", "ShoppingBag", "ShoppingCart", "Briefcase",
  "Calendar", "Clock", "MapPin", "Camera", "Image", "Music", "Video", "Mic",
  "FileText", "Headphones", "Wrench", "Package", "Truck", "Tag",
  "Star", "Heart", "Bookmark", "Bell", "Zap", "Shield", "ShieldCheck", "Lock", "Key",
  "User", "Users", "CreditCard", "QrCode", "Receipt", "Sparkles", "Gift",
  "HelpCircle", "Info", "Eye", "Smartphone", "Cloud", "Database", "Code",
  "TrendingUp", "BarChart2", "PieChart",
] as const

export type BioIconOption = (typeof BIO_ICON_OPTIONS)[number]

export function isBioIcon(name: string): name is BioIconOption {
  return (BIO_ICON_OPTIONS as readonly string[]).includes(name)
}