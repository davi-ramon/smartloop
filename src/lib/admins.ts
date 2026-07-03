/**
 * Allowlist de administradores/desenvolvedores do SmartLoop.
 * Usada para liberar o repositório de bugs (leitura dos relatos de todos os
 * tenants). A segurança de verdade é imposta nas Firestore/Storage rules por
 * request.auth.token.email — aqui é só para UX (mostrar/ocultar a página).
 */
export const ADMIN_EMAILS = [
  "ads.deyvid@gmail.com",
  "deyvid.win7@gmail.com",
  "pvrgeral@gmail.com",
]

export function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}
