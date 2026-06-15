/**
 * Traduz códigos de erro do Firebase Auth para mensagens PT-BR amigáveis.
 */
const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/user-not-found": "Não encontramos uma conta com este e-mail.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Este e-mail já está cadastrado.",
  "auth/weak-password": "A senha deve ter ao menos 6 caracteres.",
  "auth/operation-not-allowed":
    "Método de login ainda não habilitado no servidor. Avise o suporte.",
  "auth/popup-closed-by-user": "Janela de login fechada antes de concluir.",
  "auth/popup-blocked": "O navegador bloqueou a janela de login. Permita pop-ups e tente de novo.",
  "auth/cancelled-popup-request": "Login cancelado.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente em alguns minutos.",
}

export function authErrorMessage(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : ""
  return MESSAGES[code] ?? "Não foi possível concluir. Tente novamente."
}
