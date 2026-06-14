/**
 * Logger estruturado do SmartLoop.
 *
 * O console é a FONTE DA VERDADE do QA agent. Toda função/chamada crítica deve
 * logar acertos E erros com contexto, usando o prefixo `[SmartLoop][modulo]`.
 * Nunca engula erro silenciosamente (catch vazio) — sempre `logger.error`.
 *
 * Uso:
 *   logger.info("auth", "submit iniciado", { email })
 *   logger.success("auth", "login ok", { uid })
 *   logger.warn("os", "etapa sem cliente selecionado")
 *   logger.error("pdv", "falha ao finalizar venda", err)
 */

type LogLevel = "info" | "success" | "warn" | "error"

const STYLES: Record<LogLevel, string> = {
  info: "color:#2563eb;font-weight:600",
  success: "color:#10b981;font-weight:600",
  warn: "color:#f59e0b;font-weight:600",
  error: "color:#ef4444;font-weight:700",
}

const METHOD: Record<LogLevel, "log" | "warn" | "error"> = {
  info: "log",
  success: "log",
  warn: "warn",
  error: "error",
}

function emit(level: LogLevel, mod: string, message: string, data?: unknown) {
  // Guard SSR / ambientes sem console.
  if (typeof console === "undefined") return

  const prefix = `%c[SmartLoop][${mod}]`
  const method = METHOD[level]
  const args: unknown[] = [prefix, STYLES[level], message]

  if (data !== undefined) {
    // Normaliza Error para algo serializável e legível.
    if (data instanceof Error) {
      args.push({ name: data.name, message: data.message, stack: data.stack })
    } else {
      args.push(data)
    }
  }

  // eslint-disable-next-line no-console
  console[method](...args)
}

export const logger = {
  info: (mod: string, message: string, data?: unknown) => emit("info", mod, message, data),
  success: (mod: string, message: string, data?: unknown) => emit("success", mod, message, data),
  warn: (mod: string, message: string, data?: unknown) => emit("warn", mod, message, data),
  error: (mod: string, message: string, data?: unknown) => emit("error", mod, message, data),
}

export type { LogLevel }
