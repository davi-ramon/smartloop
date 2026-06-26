import { getFunctions, httpsCallable } from "firebase/functions"
import app from "./config"
import { logger } from "@/lib/logger"

const functions = getFunctions(app, "southamerica-east1")

/** Mensagem amigável a partir de um erro de função callable. */
export function callableErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = String((err as { message: unknown }).message)
    if (msg && !msg.toLowerCase().includes("internal")) return msg
  }
  return "Não foi possível concluir. Tente novamente."
}

/** Solicita o envio do código de recuperação para o e-mail. */
export async function requestResetCode(email: string) {
  logger.info("auth", "solicitando código de recuperação", { email })
  const fn = httpsCallable(functions, "requestPasswordResetCode")
  await fn({ email })
  logger.success("auth", "código solicitado (e-mail a caminho)", { email })
}

/** Valida o código e define a nova senha. */
export async function confirmResetCode(email: string, code: string, newPassword: string) {
  logger.info("auth", "confirmando código de recuperação", { email })
  const fn = httpsCallable(functions, "confirmPasswordResetCode")
  await fn({ email, code, newPassword })
  logger.success("auth", "senha redefinida via código", { email })
}
