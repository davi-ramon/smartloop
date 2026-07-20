/**
 * Cloud Functions do SmartLoop — recuperação de senha por código temporário.
 *
 * Fluxo:
 *  1. requestPasswordResetCode(email)  -> gera código de 6 dígitos (expira em 5min),
 *     guarda o HASH no Firestore e envia o código por e-mail (Gmail SMTP).
 *  2. confirmPasswordResetCode(email, code, newPassword) -> valida o código e troca a senha.
 *
 * Segredos necessários (firebase functions:secrets:set ...):
 *  - GMAIL_EMAIL     (e-mail remetente, ex.: suaconta@gmail.com)
 *  - GMAIL_PASSWORD  (senha de app de 16 dígitos do Google)
 */

const crypto = require("crypto")
const fs = require("fs")
const path = require("path")
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https")
const { onSchedule } = require("firebase-functions/v2/scheduler")
const { onDocumentCreated } = require("firebase-functions/v2/firestore")
const { setGlobalOptions } = require("firebase-functions/v2")
const { defineSecret } = require("firebase-functions/params")
const logger = require("firebase-functions/logger")
const admin = require("firebase-admin")
const nodemailer = require("nodemailer")

admin.initializeApp()
const db = admin.firestore()

// [SmartLoop][Security] Teto de instâncias: limita o custo/impacto de um pico de
// abuso ou DoS nas Cloud Functions (escala suficiente para o MVP; ajustável).
setGlobalOptions({ maxInstances: 10 })

const GMAIL_EMAIL = defineSecret("GMAIL_EMAIL")
const GMAIL_PASSWORD = defineSecret("GMAIL_PASSWORD")
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY")
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET")
const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN")
const NOTIFY_SECRET = defineSecret("NOTIFY_SECRET")

// Grupo do Telegram + destinatários de e-mail das notificações de release.
// (chat_id de grupo não é sigiloso — fica no código; preenchido após criar o bot.)
const TELEGRAM_CHAT_ID = "-5405925760" // grupo "SmartLoop - Atualizações"
const TELEGRAM_THREAD_ID = "" // opcional: id do tópico, se o grupo usar tópicos
const RELEASE_EMAILS = ["ads.deyvid@gmail.com", "pvrgeral@gmail.com"] // Deyvid + Pedro

const REGION = "southamerica-east1"
const CODE_TTL_MS = 5 * 60 * 1000 // 5 minutos
const MAX_ATTEMPTS = 5

const APP_URL = "https://smartloop.com.br"
// Planos do SmartLoop (valores em centavos, BRL).
const PLANS = {
  basic: { name: "SmartLoop Básico", amount: 4990 },
  pro: { name: "SmartLoop Pro", amount: 8990 },
  premium: { name: "SmartLoop Premium", amount: 14990 },
}

function hashCode(code, email) {
  return crypto.createHash("sha256").update(`${code}:${email.toLowerCase()}`).digest("hex")
}

function buildEmailHtml(code) {
  return `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(2,6,23,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:28px 32px;text-align:center;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">SmartLoop</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:18px;color:#111827;">Seu código de recuperação</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b7280;">
                Use o código abaixo para criar uma nova senha na sua conta SmartLoop.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 28px;">
                  <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#1d4ed8;">${code}</span>
                </div>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#f59e0b;font-weight:600;">
                Este código expira em 5 minutos.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;">
                Se você não solicitou a recuperação de senha, ignore este e-mail — sua conta continua segura.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
              <span style="font-size:11px;color:#9ca3af;">SmartLoop — gestão para assistências técnicas</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`
}

exports.requestPasswordResetCode = onCall(
  { region: REGION, secrets: [GMAIL_EMAIL, GMAIL_PASSWORD] },
  async (request) => {
    const email = String(request.data?.email || "").trim().toLowerCase()
    logger.info("[SmartLoop][auth] solicitação de código de recuperação", { email })

    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "Informe um e-mail válido.")
    }

    // Confirma que a conta existe.
    try {
      await admin.auth().getUserByEmail(email)
    } catch (err) {
      logger.warn("[SmartLoop][auth] e-mail sem conta", { email, code: err.code })
      throw new HttpsError("not-found", "Não encontramos uma conta com este e-mail.")
    }

    // [SmartLoop][Security] Cooldown anti-spam: 1 código por minuto por e-mail.
    const codeRef = db.collection("passwordResetCodes").doc(email)
    const existing = await codeRef.get()
    if (existing.exists) {
      const createdAt = existing.data().createdAt
      const createdMs = createdAt?.toMillis ? createdAt.toMillis() : 0
      if (createdMs && Date.now() - createdMs < 60 * 1000) {
        logger.warn("[SmartLoop][Security] reset solicitado dentro do cooldown", { email })
        throw new HttpsError("resource-exhausted", "Aguarde um minuto antes de pedir um novo código.")
      }
    }

    const code = String(crypto.randomInt(100000, 1000000))
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CODE_TTL_MS)

    try {
      await db.collection("passwordResetCodes").doc(email).set({
        codeHash: hashCode(code, email),
        expiresAt,
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_EMAIL.value(), pass: GMAIL_PASSWORD.value() },
      })

      await transporter.sendMail({
        from: `"SmartLoop" <${GMAIL_EMAIL.value()}>`,
        to: email,
        subject: `${code} é o seu código de recuperação SmartLoop`,
        html: buildEmailHtml(code),
      })

      logger.info("[SmartLoop][auth] código gerado e e-mail enviado", { email })
      return { ok: true }
    } catch (err) {
      logger.error("[SmartLoop][auth] falha ao gerar/enviar código", { email, message: err.message })
      throw new HttpsError("internal", "Não foi possível enviar o e-mail. Tente novamente.")
    }
  }
)

exports.confirmPasswordResetCode = onCall(
  { region: REGION },
  async (request) => {
    const email = String(request.data?.email || "").trim().toLowerCase()
    const code = String(request.data?.code || "").trim()
    const newPassword = String(request.data?.newPassword || "")
    logger.info("[SmartLoop][auth] confirmação de código", { email })

    if (!email || !code) {
      throw new HttpsError("invalid-argument", "Informe o e-mail e o código.")
    }
    if (newPassword.length < 6) {
      throw new HttpsError("invalid-argument", "A nova senha deve ter ao menos 6 caracteres.")
    }

    const ref = db.collection("passwordResetCodes").doc(email)
    const snap = await ref.get()

    if (!snap.exists) {
      throw new HttpsError("not-found", "Código não encontrado. Solicite um novo.")
    }

    const data = snap.data()

    if (data.expiresAt.toMillis() < Date.now()) {
      await ref.delete()
      logger.warn("[SmartLoop][auth] código expirado", { email })
      throw new HttpsError("deadline-exceeded", "Código expirado. Solicite um novo.")
    }
    if ((data.attempts || 0) >= MAX_ATTEMPTS) {
      await ref.delete()
      logger.warn("[SmartLoop][auth] tentativas excedidas", { email })
      throw new HttpsError("resource-exhausted", "Muitas tentativas. Solicite um novo código.")
    }
    if (data.codeHash !== hashCode(code, email)) {
      await ref.update({ attempts: admin.firestore.FieldValue.increment(1) })
      logger.warn("[SmartLoop][auth] código inválido", { email })
      throw new HttpsError("invalid-argument", "Código inválido.")
    }

    try {
      const user = await admin.auth().getUserByEmail(email)
      await admin.auth().updateUser(user.uid, { password: newPassword })
      await ref.delete()
      logger.info("[SmartLoop][auth] senha redefinida com sucesso", { email })
      return { ok: true }
    } catch (err) {
      logger.error("[SmartLoop][auth] falha ao redefinir senha", { email, message: err.message })
      throw new HttpsError("internal", "Não foi possível redefinir a senha. Tente novamente.")
    }
  }
)

/* ─────────────────────────────────────────────────────────────
   Aprovação pública de orçamento (sem login, via token)
   - getPublicQuote: lê o orçamento por token (Admin SDK, sem expor Firestore)
   - respondPublicQuote: cliente aprova/recusa
───────────────────────────────────────────────────────────── */

async function findQuoteByToken(token) {
  const snap = await db.collectionGroup("quotes").where("approvalToken", "==", token).limit(1).get()
  return snap.empty ? null : snap.docs[0]
}

exports.getPublicQuote = onCall({ region: REGION }, async (request) => {
  const token = String(request.data?.token || "").trim()
  logger.info("[SmartLoop][orcamento] leitura pública", { hasToken: !!token })
  if (!token) throw new HttpsError("invalid-argument", "Link inválido.")

  const docSnap = await findQuoteByToken(token)
  if (!docSnap) throw new HttpsError("not-found", "Orçamento não encontrado ou expirado.")

  const q = docSnap.data()
  const tenantId = docSnap.ref.parent.parent.id
  let store = { name: "Assistência", logoUrl: "", whatsapp: "" }
  try {
    const t = (await db.collection("tenants").doc(tenantId).get()).data() || {}
    store = { name: t.fantasyName || t.name || "Assistência", logoUrl: t.logoUrl || "", whatsapp: t.whatsapp || "" }
  } catch (e) {
    logger.warn("[SmartLoop][orcamento] tenant não lido", { tenantId, message: e.message })
  }

  return {
    customerName: q.customerName || "",
    deviceLabel: q.deviceLabel || "",
    items: q.items || [],
    totalParts: q.totalParts || 0,
    totalLabor: q.totalLabor || 0,
    total: q.total || 0,
    status: q.status || "pending",
    store,
  }
})

exports.respondPublicQuote = onCall({ region: REGION }, async (request) => {
  const token = String(request.data?.token || "").trim()
  const decision = String(request.data?.decision || "")
  logger.info("[SmartLoop][orcamento] resposta pública", { decision })
  if (!["approved", "rejected"].includes(decision)) {
    throw new HttpsError("invalid-argument", "Resposta inválida.")
  }
  const docSnap = await findQuoteByToken(token)
  if (!docSnap) throw new HttpsError("not-found", "Orçamento não encontrado.")
  if ((docSnap.data().status || "pending") !== "pending") {
    throw new HttpsError("failed-precondition", "Este orçamento já foi respondido.")
  }
  await docSnap.ref.update({
    status: decision,
    respondedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  logger.info("[SmartLoop][orcamento] orçamento respondido", { decision })
  return { ok: true }
})

/* ─────────────────────────────────────────────────────────────
   Billing (Stripe) — assinatura por loja (tenantId == uid do dono)
   - createCheckoutSession: checkout de assinatura (trial + cartão)
   - createPortalSession: portal de gestão da assinatura
   - stripeWebhook: sincroniza o status da assinatura no tenant
───────────────────────────────────────────────────────────── */

exports.createCheckoutSession = onCall(
  { region: REGION, secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError("unauthenticated", "Faça login para assinar.")
    const planKey = PLANS[request.data?.plan] ? request.data.plan : "pro"
    const plan = PLANS[planKey]
    logger.info("[SmartLoop][Backend] checkout de assinatura", { uid, plan: planKey, amount: plan.amount })

    const stripe = require("stripe")(STRIPE_SECRET_KEY.value())
    const tenantRef = db.collection("tenants").doc(uid)
    const tenant = (await tenantRef.get()).data() || {}

    // Garante o cliente Stripe do tenant.
    let customerId = tenant.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: request.auth.token?.email || undefined,
        name: tenant.name || undefined,
        metadata: { tenantId: uid },
      })
      customerId = customer.id
      await tenantRef.set({ stripeCustomerId: customerId }, { merge: true })
    }

    // Alinha o trial do Stripe ao trial do app (não cobra antes do fim dos 14 dias).
    const now = Math.floor(Date.now() / 1000)
    let trialEnd = tenant.trialEndsAt?.seconds || tenant.trialEndsAt?._seconds || 0
    if (!trialEnd || trialEnd <= now + 60) trialEnd = undefined

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        payment_method_collection: "always",
        allow_promotion_codes: true, // habilita o campo "Adicionar cupom" no Checkout
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "brl",
            product_data: { name: plan.name },
            unit_amount: plan.amount,
            recurring: { interval: "month" },
          },
        }],
        subscription_data: {
          ...(trialEnd ? { trial_end: trialEnd } : {}),
          metadata: { tenantId: uid, plan: planKey },
        },
        metadata: { tenantId: uid, plan: planKey },
        success_url: `${APP_URL}/configuracoes?assinatura=sucesso`,
        cancel_url: `${APP_URL}/configuracoes?assinatura=cancelado`,
      })
      return { url: session.url }
    } catch (err) {
      logger.error("[SmartLoop][Backend] falha no checkout", { message: err.message })
      throw new HttpsError("internal", "Não foi possível iniciar a assinatura.")
    }
  }
)

// Checkout direto da landing (sem login): assinatura com COBRANÇA IMEDIATA.
// Difere do createCheckoutSession (in-app, com trial de 14 dias + login).
exports.createDirectCheckout = onRequest(
  { region: REGION, cors: true, secrets: [STRIPE_SECRET_KEY] },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" })
    const planKey = PLANS[req.body?.plan] ? req.body.plan : "pro"
    const plan = PLANS[planKey]
    logger.info("[SmartLoop][Backend] checkout direto (landing)", { plan: planKey, amount: plan.amount })

    try {
      const stripe = require("stripe")(STRIPE_SECRET_KEY.value())
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_collection: "always",
        allow_promotion_codes: true,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "brl",
            product_data: { name: plan.name },
            unit_amount: plan.amount,
            recurring: { interval: "month" },
          },
        }],
        // Sem trial → cobrança imediata.
        subscription_data: { metadata: { plan: planKey, source: "landing" } },
        metadata: { plan: planKey, source: "landing" },
        success_url: `${APP_URL}/cadastro?assinatura=sucesso&plano=${planKey}`,
        cancel_url: `${APP_URL}/?checkout=cancelado`,
      })
      res.status(200).json({ url: session.url })
    } catch (err) {
      logger.error("[SmartLoop][Backend] falha no checkout direto", { message: err.message })
      res.status(500).json({ error: "checkout_failed" })
    }
  },
)

exports.createPortalSession = onCall(
  { region: REGION, secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError("unauthenticated", "Faça login.")
    const stripe = require("stripe")(STRIPE_SECRET_KEY.value())
    const tenant = (await db.collection("tenants").doc(uid).get()).data() || {}
    if (!tenant.stripeCustomerId) {
      throw new HttpsError("failed-precondition", "Nenhuma assinatura encontrada.")
    }
    try {
      const portal = await stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: `${APP_URL}/configuracoes`,
      })
      return { url: portal.url }
    } catch (err) {
      logger.error("[SmartLoop][Backend] falha no portal", { message: err.message })
      throw new HttpsError("internal", "Não foi possível abrir o portal.")
    }
  }
)

async function updateTenantSubscription(sub) {
  let tenantId = sub.metadata?.tenantId
  if (!tenantId && sub.customer) {
    const q = await db.collection("tenants").where("stripeCustomerId", "==", sub.customer).limit(1).get()
    if (!q.empty) tenantId = q.docs[0].id
  }
  if (!tenantId) {
    logger.warn("[SmartLoop][Backend] webhook sem tenant", { sub: sub.id })
    return
  }
  await db.collection("tenants").doc(tenantId).set({
    subscriptionId: sub.id,
    subscriptionStatus: sub.status, // trialing | active | past_due | unpaid | canceled | incomplete
    plan: sub.metadata?.plan || null,
    currentPeriodEnd: sub.current_period_end
      ? admin.firestore.Timestamp.fromMillis(sub.current_period_end * 1000)
      : null,
  }, { merge: true })
  logger.info("[SmartLoop][Backend] assinatura sincronizada", { tenantId, status: sub.status })
}

exports.stripeWebhook = onRequest(
  { region: REGION, secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const stripe = require("stripe")(STRIPE_SECRET_KEY.value())
    let event
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"],
        STRIPE_WEBHOOK_SECRET.value()
      )
    } catch (err) {
      logger.error("[SmartLoop][Security] webhook Stripe com assinatura inválida", { message: err.message })
      return res.status(400).send("invalid signature")
    }

    try {
      if (event.type.startsWith("customer.subscription.")) {
        await updateTenantSubscription(event.data.object)
      }
      res.status(200).send("ok")
    } catch (err) {
      logger.error("[SmartLoop][Backend] erro ao processar webhook", { type: event.type, message: err.message })
      res.status(500).send("error")
    }
  }
)

/* ─────────────────────────────────────────────────────────────
   Cupons de desconto (setup único, idempotente)
   Cria coupons + promotion codes que aparecem no campo do Checkout.
   Códigos que o usuário digita: SMART50 (50%), SMART75 (75%), SMART100 (100%).
   Desconto aplicado só na 1ª cobrança (duration: once) — o de 100% = 1 mês grátis.
───────────────────────────────────────────────────────────── */

const COUPONS = [
  { code: "SMART50", percent_off: 50, name: "50% de desconto" },
  { code: "SMART75", percent_off: 75, name: "75% de desconto" },
  { code: "SMART100", percent_off: 100, name: "1 mês grátis (100%)" },
]

async function ensureCoupon(stripe, def) {
  // Reaproveita coupon com o mesmo id fixo (o código); se não existir, cria.
  try {
    return await stripe.coupons.retrieve(def.code)
  } catch {
    return await stripe.coupons.create({
      id: def.code,
      percent_off: def.percent_off,
      duration: "once", // aplica só na primeira fatura
      name: def.name,
    })
  }
}

async function ensurePromotionCode(stripe, code, couponId) {
  const found = await stripe.promotionCodes.list({ code, limit: 1 })
  if (found.data.length) return found.data[0]
  return await stripe.promotionCodes.create({ coupon: couponId, code })
}

exports.setupCoupons = onCall(
  { region: REGION, secrets: [STRIPE_SECRET_KEY] },
  async () => {
    const stripe = require("stripe")(STRIPE_SECRET_KEY.value())
    const result = []
    for (const def of COUPONS) {
      const coupon = await ensureCoupon(stripe, def)
      const promo = await ensurePromotionCode(stripe, def.code, coupon.id)
      result.push({ code: def.code, active: promo.active })
    }
    logger.info("[SmartLoop][Backend] cupons configurados", { codes: result.map((r) => r.code) })
    return { ok: true, coupons: result }
  }
)

/* ─────────────────────────────────────────────────────────────
   Notificações de release — Telegram (principal) + e-mail
   - notifyRelease: recebe { title, type, items[] } e avisa o grupo + e-mails
   - getTelegramChatId: helper para descobrir o chat_id do grupo sem expor o token
   Protegidas por NOTIFY_SECRET (header x-notify-secret ou body.secret).
───────────────────────────────────────────────────────────── */

const TYPE_META = {
  feature: { emoji: "✨", label: "Nova funcionalidade", color: "#2563eb" },
  fix: { emoji: "🐛", label: "Correção de bug", color: "#ef4444" },
  update: { emoji: "🚀", label: "Atualização", color: "#ea580c" },
}

function checkNotifySecret(req) {
  const provided = req.headers["x-notify-secret"] || req.body?.secret
  return provided && provided === NOTIFY_SECRET.value()
}

function releaseEmailHtml(meta, title, items) {
  const li = items.map((i) => `<li style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#374151;">${i}</li>`).join("")
  return `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(2,6,23,0.08);">
          <tr><td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:24px 32px;">
            <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">SmartLoop</span>
            <span style="color:#c7d2fe;font-size:12px;display:block;margin-top:2px;">Notificação de atualização do sistema</span>
          </td></tr>
          <tr><td style="padding:28px 32px;">
            <span style="display:inline-block;background:${meta.color}1a;color:${meta.color};font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;">${meta.emoji} ${meta.label}</span>
            <h1 style="margin:14px 0 16px;font-size:18px;color:#111827;">${title}</h1>
            <ul style="margin:0;padding-left:18px;">${li}</ul>
          </td></tr>
          <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
            <span style="font-size:11px;color:#9ca3af;">SmartLoop — gestão para assistências técnicas · smartloop.com.br</span>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </div>`
}

exports.notifyRelease = onRequest(
  { region: REGION, secrets: [GMAIL_EMAIL, GMAIL_PASSWORD, TELEGRAM_BOT_TOKEN, NOTIFY_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("method not allowed")
    if (!checkNotifySecret(req)) {
      logger.warn("[SmartLoop][Security] notifyRelease sem segredo válido")
      return res.status(401).send("unauthorized")
    }

    const type = TYPE_META[req.body?.type] ? req.body.type : "update"
    const meta = TYPE_META[type]
    const title = String(req.body?.title || "Atualização do SmartLoop").slice(0, 160)
    const items = Array.isArray(req.body?.items) ? req.body.items.map((i) => String(i).slice(0, 200)).slice(0, 20) : []
    const result = { telegram: "skipped", email: "skipped" }

    // Telegram (canal principal)
    if (TELEGRAM_CHAT_ID) {
      try {
        const bullets = items.map((i) => `• ${i}`).join("\n")
        const text = `${meta.emoji} <b>${meta.label} — SmartLoop</b>\n\n<b>${title}</b>\n${bullets ? "\n" + bullets : ""}`
        const payload = {
          chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true,
          ...(TELEGRAM_THREAD_ID ? { message_thread_id: Number(TELEGRAM_THREAD_ID) } : {}),
        }
        const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.value()}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        })
        const j = await r.json()
        result.telegram = j.ok ? "ok" : `erro: ${j.description || "desconhecido"}`
      } catch (err) {
        logger.error("[SmartLoop][notify] falha no Telegram", { message: err.message })
        result.telegram = "erro"
      }
    } else {
      result.telegram = "sem chat_id configurado"
    }

    // E-mail (secundário)
    if (RELEASE_EMAILS.length) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail", auth: { user: GMAIL_EMAIL.value(), pass: GMAIL_PASSWORD.value() },
        })
        await transporter.sendMail({
          from: `"SmartLoop" <${GMAIL_EMAIL.value()}>`,
          to: RELEASE_EMAILS.join(", "),
          subject: `${meta.emoji} ${meta.label}: ${title}`,
          html: releaseEmailHtml(meta, title, items),
        })
        result.email = "ok"
      } catch (err) {
        logger.error("[SmartLoop][notify] falha no e-mail", { message: err.message })
        result.email = "erro"
      }
    }

    logger.info("[SmartLoop][notify] release notificado", { type, title, result })
    res.status(200).json({ ok: true, result })
  }
)

exports.getTelegramChatId = onRequest(
  { region: REGION, secrets: [TELEGRAM_BOT_TOKEN, NOTIFY_SECRET] },
  async (req, res) => {
    if (!checkNotifySecret(req)) return res.status(401).send("unauthorized")
    try {
      const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.value()}/getUpdates`)
      const j = await r.json()
      const chats = new Map()
      for (const u of j.result || []) {
        const c = u.message?.chat || u.channel_post?.chat || u.my_chat_member?.chat
        if (c) chats.set(c.id, { id: c.id, title: c.title || c.username || c.first_name, type: c.type })
      }
      res.status(200).json({ ok: true, chats: [...chats.values()] })
    } catch (err) {
      logger.error("[SmartLoop][notify] falha ao ler chat_id", { message: err.message })
      res.status(500).json({ ok: false })
    }
  }
)

/* ─────────────────────────────────────────────────────────────
   Digest diário de OS por loja — e-mail branded para o dono do tenant
   avisando OS atrasadas, prontas para entrega, aguardando peça e do dia.
   - dailyOsDigest: agendado (9h, America/Sao_Paulo)
   - runOsDigestNow: gatilho manual (protegido) para teste
───────────────────────────────────────────────────────────── */

const OS_STATUS_LABEL = {
  received: "Recebido", analyzing: "Em análise", waiting_part: "Aguardando peça",
  ready: "Pronto", delivered: "Entregue", cancelled: "Cancelado",
}

function osDigestEmailHtml(shop, data) {
  const overdueRows = data.overdue.slice(0, 10).map((o) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">#${o.number} · ${o.customerName || "—"}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;text-align:right;">${o.days} dias</td>
    </tr>`).join("")

  const stat = (label, value, color) => `
    <td align="center" style="padding:12px 8px;">
      <div style="font-size:26px;font-weight:800;color:${color};line-height:1;">${value}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px;">${label}</div>
    </td>`

  return `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:540px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(2,6,23,0.08);">
          <tr><td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:24px 32px;">
            <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">${shop.name}</span>
            <span style="color:#c7d2fe;font-size:12px;display:block;margin-top:2px;">Resumo diário das suas ordens de serviço</span>
          </td></tr>
          <tr><td style="padding:24px 32px 8px;">
            <table role="presentation" width="100%" style="background:#f9fafb;border-radius:12px;"><tr>
              ${stat("Abertas", data.openCount, "#2563eb")}
              ${stat("Atrasadas", data.overdue.length, "#ef4444")}
              ${stat("Prontas", data.ready, "#10b981")}
              ${stat("Aguard. peça", data.waitingPart, "#f59e0b")}
            </tr></table>
          </td></tr>
          ${data.overdue.length ? `
          <tr><td style="padding:12px 32px 8px;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#ef4444;">⚠️ OS atrasadas (${data.overdueDays}+ dias sem entrega)</p>
            <table role="presentation" width="100%">${overdueRows}</table>
          </td></tr>` : ""}
          <tr><td style="padding:16px 32px 24px;">
            <a href="https://smartloop.com.br/os" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;">Abrir minhas OS</a>
          </td></tr>
          <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
            <span style="font-size:11px;color:#9ca3af;">Enviado pelo SmartLoop · gestão para assistências técnicas</span>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </div>`
}

async function runOsDigest() {
  const now = Date.now()
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const tenantsSnap = await db.collection("tenants").get()
  let processed = 0
  let sent = 0

  const transporter = nodemailer.createTransport({
    service: "gmail", auth: { user: GMAIL_EMAIL.value(), pass: GMAIL_PASSWORD.value() },
  })

  for (const tDoc of tenantsSnap.docs) {
    processed++
    const t = tDoc.data() || {}
    if (t.onboardingDone !== true) continue

    // Destinatário: e-mail cadastrado da loja ou o e-mail da conta do dono.
    let email = t.email
    if (!email) {
      try { email = (await admin.auth().getUser(tDoc.id)).email } catch { email = null }
    }
    if (!email) continue

    const osSnap = await db.collection("tenants").doc(tDoc.id).collection("serviceOrders").get()
    const orders = osSnap.docs.map((d) => d.data())
    const open = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled")
    if (open.length === 0) continue

    const overdueDays = t.overdueDays ?? 3
    const overdue = open
      .filter((o) => {
        const ms = o.createdAt?.toDate ? o.createdAt.toDate().getTime() : 0
        return ms && (now - ms) > overdueDays * 86_400_000
      })
      .map((o) => ({
        number: o.number, customerName: o.customerName,
        days: Math.floor((now - (o.createdAt?.toDate ? o.createdAt.toDate().getTime() : now)) / 86_400_000),
      }))
      .sort((a, b) => b.days - a.days)
    const ready = open.filter((o) => o.status === "ready").length
    const waitingPart = open.filter((o) => o.status === "waiting_part").length

    // Só envia se houver algo acionável (atrasadas ou prontas para entregar).
    if (overdue.length === 0 && ready === 0) continue

    const shop = { name: t.fantasyName || t.name || "Sua assistência" }
    const data = { openCount: open.length, overdue, overdueDays, ready, waitingPart }

    try {
      await transporter.sendMail({
        from: `"${shop.name} · SmartLoop" <${GMAIL_EMAIL.value()}>`,
        to: email,
        subject: `📋 ${overdue.length} OS atrasada(s) · ${ready} pronta(s) para entrega`,
        html: osDigestEmailHtml(shop, data),
      })
      sent++
      logger.info("[SmartLoop][digest] e-mail enviado", { tenantId: tDoc.id, overdue: overdue.length, ready })
    } catch (err) {
      logger.error("[SmartLoop][digest] falha ao enviar", { tenantId: tDoc.id, message: err.message })
    }
  }

  logger.info("[SmartLoop][digest] concluído", { processed, sent })
  return { ok: true, processed, sent }
}

exports.dailyOsDigest = onSchedule(
  { schedule: "0 9 * * *", timeZone: "America/Sao_Paulo", region: REGION, secrets: [GMAIL_EMAIL, GMAIL_PASSWORD] },
  async () => { await runOsDigest() },
)

exports.runOsDigestNow = onRequest(
  { region: REGION, secrets: [GMAIL_EMAIL, GMAIL_PASSWORD, NOTIFY_SECRET] },
  async (req, res) => {
    if (!checkNotifySecret(req)) return res.status(401).send("unauthorized")
    const result = await runOsDigest()
    res.status(200).json(result)
  },
)

/* ─────────────────────────────────────────────────────────────
   Novo relato de bug/sugestão → avisa admins (Telegram + e-mail)
   Trigger em bugReports/{id}. É a "rotina" de triagem: cada relato
   chega na hora para Deyvid e Pedro analisarem.
───────────────────────────────────────────────────────────── */

function bugEmailHtml(d) {
  const isBug = d.type === "bug"
  const color = isBug ? "#ef4444" : "#f59e0b"
  const atts = (d.attachments || []).map((a) =>
    `<a href="${a.url}" style="color:#2563eb;font-size:12px;">${a.name}</a>`).join(" · ")
  return `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;"><tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(2,6,23,0.08);">
        <tr><td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:22px 32px;">
          <span style="color:#fff;font-size:18px;font-weight:800;">SmartLoop · Beta</span>
          <span style="color:#c7d2fe;font-size:12px;display:block;">Novo relato recebido</span>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <span style="display:inline-block;background:${color}1a;color:${color};font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;">${isBug ? "🐛 Bug" : "💡 Sugestão"} · ${d.module || "—"}</span>
          <p style="margin:14px 0 4px;font-size:13px;color:#6b7280;">De: ${d.userName || "—"} (${d.userEmail || "—"})</p>
          <p style="margin:0 0 14px;font-size:13px;color:#9ca3af;">Rota: ${d.path || "—"}</p>
          <div style="background:#f9fafb;border-radius:10px;padding:14px;font-size:14px;line-height:1.6;color:#111827;white-space:pre-wrap;">${(d.description || "").replace(/</g, "&lt;")}</div>
          ${atts ? `<p style="margin:14px 0 0;font-size:12px;color:#6b7280;">Anexos: ${atts}</p>` : ""}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
          <a href="https://smartloop.com.br/relatorios-bugs" style="color:#2563eb;font-size:13px;font-weight:600;text-decoration:none;">Abrir repositório de relatos →</a>
        </td></tr>
      </table>
    </td></tr></table>
  </div>`
}

exports.onBugReportCreated = onDocumentCreated(
  { document: "bugReports/{id}", region: REGION, secrets: [GMAIL_EMAIL, GMAIL_PASSWORD, TELEGRAM_BOT_TOKEN] },
  async (event) => {
    const d = event.data?.data()
    if (!d) return
    const isBug = d.type === "bug"
    logger.info("[SmartLoop][bugs] novo relato", { type: d.type, module: d.module })

    // Telegram
    if (TELEGRAM_CHAT_ID) {
      try {
        const emoji = isBug ? "🐛" : "💡"
        const text = `${emoji} <b>Novo ${isBug ? "bug" : "sugestão"} · SmartLoop Beta</b>\n\n<b>Módulo:</b> ${d.module || "—"}\n<b>De:</b> ${d.userName || d.userEmail || "—"}\n\n${(d.description || "").slice(0, 500)}${(d.attachments || []).length ? `\n\n📎 ${d.attachments.length} anexo(s)` : ""}`
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.value()}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
        })
      } catch (err) {
        logger.error("[SmartLoop][bugs] falha no Telegram", { message: err.message })
      }
    }

    // E-mail para admins
    if (RELEASE_EMAILS.length) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail", auth: { user: GMAIL_EMAIL.value(), pass: GMAIL_PASSWORD.value() },
        })
        await transporter.sendMail({
          from: `"SmartLoop Beta" <${GMAIL_EMAIL.value()}>`,
          to: RELEASE_EMAILS.join(", "),
          subject: `${isBug ? "🐛 Bug" : "💡 Sugestão"} em ${d.module || "SmartLoop"} — ${d.userName || "usuário"}`,
          html: bugEmailHtml(d),
        })
      } catch (err) {
        logger.error("[SmartLoop][bugs] falha no e-mail", { message: err.message })
      }
    }
  },
)

/* ─────────────────────────────────────────────────────────────
   Bio público (link-in-bio do SmartLoop)
   - getBioPage: leitura pública da config + links (defaults se vazio).
   - recordBioEvent: grava evento com rate-limit por IP.
   - onBioEventCreated: trigger que mantém agregado diário (bioStats/daily/{date}).
   - getBioStats: painel admin lê agregado + conta visitors distintos (cap 5000).
───────────────────────────────────────────────────────────── */

const BIO_PROFILE_DEFAULTS = {
  titulo: "SmartLoop",
  descricao: "",
  logoUrl: "",
  coverUrl: "",
  rodape: "smartloop.com.br",
  primary: "#2563eb",
  bgStyle: "gradient",
  textStyle: "dark",
}

const BIO_EVENT_TTL_MS = 60 * 1000
const BIO_EVENT_MAX_PER_IP = 60
// Rate-limit por IP em memória. Cada instância tem o seu bucket — em pico,
// o limite vira (cap/instâncias) por IP. Aceitável para MVP.
const bioRateBucket = new Map()

function bioRateAllow(ip) {
  const now = Date.now()
  const arr = bioRateBucket.get(ip) || []
  const fresh = arr.filter((t) => now - t < BIO_EVENT_TTL_MS)
  if (fresh.length >= BIO_EVENT_MAX_PER_IP) {
    bioRateBucket.set(ip, fresh)
    return false
  }
  fresh.push(now)
  bioRateBucket.set(ip, fresh)
  return true
}

function getClientIp(request) {
  const xff = request.rawRequest?.headers?.["x-forwarded-for"]
  const ip = request.rawRequest?.ip
  const raw = ip || (typeof xff === "string" ? xff.split(",")[0].trim() : "unknown")
  return String(raw).slice(0, 64)
}

function parseUtms(payload) {
  if (!payload || typeof payload !== "object") return null
  const keys = ["source", "medium", "campaign", "content", "term"]
  const out = {}
  let any = false
  for (const k of keys) {
    const v = payload[k]
    if (typeof v === "string" && v.length) {
      out[k] = v.slice(0, 120)
      any = true
    }
  }
  return any ? out : null
}

function ymd(date) {
  const d = new Date(date)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
}

exports.getBioPage = onCall({ region: REGION }, async () => {
  logger.info("[SmartLoop][bio] leitura pública")
  try {
    const profileSnap = await db.collection("bioPage").doc("main").get()
    const linksSnap = await db
      .collection("bioPage").doc("main").collection("links")
      .orderBy("ordem", "asc")
      .get()
    const profile = profileSnap.exists
      ? { id: "main", ...profileSnap.data() }
      : { id: "main", ...BIO_PROFILE_DEFAULTS }
    const links = linksSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((l) => l.ativo !== false)
    return { profile, links }
  } catch (err) {
    logger.error("[SmartLoop][bio] falha ao ler página", { message: err.message })
    throw new HttpsError("internal", "Não foi possível carregar a página.")
  }
})

exports.recordBioEvent = onCall({ region: REGION }, async (request) => {
  const data = request.data || {}
  const type = String(data.type || "")
  const allowed = ["view", "click", "redirect", "viewContent"]
  if (!allowed.includes(type)) {
    throw new HttpsError("invalid-argument", "Tipo de evento inválido.")
  }
  if ((type === "click" || type === "viewContent") && !data.linkId) {
    throw new HttpsError("invalid-argument", "linkId obrigatório para este tipo.")
  }

  const ip = getClientIp(request)
  if (!bioRateAllow(ip)) {
    logger.warn("[SmartLoop][bio] rate-limit excedido", { ip, type })
    throw new HttpsError("resource-exhausted", "Limite de eventos atingido.")
  }

  const headers = request.rawRequest?.headers || {}
  const referer = String(headers["referer"] || headers["referrer"] || "").slice(0, 1024)
  const ua = String(headers["user-agent"] || "").slice(0, 256)
  let referrerHost = ""
  if (referer) {
    try { referrerHost = new URL(referer).host } catch { /* ignora */ }
  }
  if (!referrerHost) referrerHost = "(direct)"

  const ev = {
    type,
    linkId: data.linkId ? String(data.linkId).slice(0, 64) : null,
    url: data.url ? String(data.url).slice(0, 1024) : null,
    path: String(data.path || "/bio").slice(0, 256),
    ts: admin.firestore.FieldValue.serverTimestamp(),
    ip, ua, referer, referrerHost,
    utms: parseUtms(data.utms),
  }

  try {
    const ref = await db.collection("bioEvents").add(ev)
    logger.info("[SmartLoop][bio] evento registrado", { id: ref.id, type, ip, linkId: ev.linkId })
    return { ok: true }
  } catch (err) {
    logger.error("[SmartLoop][bio] falha ao registrar evento", { message: err.message })
    throw new HttpsError("internal", "Falha ao registrar evento.")
  }
})

exports.onBioEventCreated = onDocumentCreated(
  { document: "bioEvents/{id}", region: REGION },
  async (event) => {
    const d = event.data?.data()
    if (!d) return
    const ms = d.ts?.toMillis ? d.ts.toMillis() : Date.now()
    const dateKey = ymd(ms)
    const ref = db.collection("bioStats").doc("daily").collection(dateKey).doc(dateKey)
    const base = { date: dateKey, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
    const inc = {
      views: admin.firestore.FieldValue.increment(d.type === "view" ? 1 : 0),
      clicks: admin.firestore.FieldValue.increment(d.type === "click" ? 1 : 0),
    }
    try {
      await ref.set(base, { merge: true })
      await ref.set(inc, { merge: true })
      if (d.type === "click" && d.linkId) {
        await ref.set(
          { clicksByLink: { [d.linkId]: admin.firestore.FieldValue.increment(1) } },
          { merge: true },
        )
      }
      if (d.referrerHost) {
        await ref.set(
          { sources: { [d.referrerHost]: admin.firestore.FieldValue.increment(1) } },
          { merge: true },
        )
      }
      if (d.utms?.campaign) {
        await ref.set(
          { campaigns: { [d.utms.campaign]: admin.firestore.FieldValue.increment(1) } },
          { merge: true },
        )
      }
      logger.info("[SmartLoop][bio] agregado atualizado", { date: dateKey, type: d.type })
    } catch (err) {
      logger.error("[SmartLoop][bio] falha agregando evento", { message: err.message })
    }
  },
)

/* Cache em memória para getBioStats (TTL 60s). Reduz custo em cliques
   repetidos do painel admin — não é persistido (reinício da função limpa). */
const bioStatsCache = new Map() // days -> { ts, payload }
const BIO_STATS_CACHE_TTL_MS = 60 * 1000

exports.getBioStats = onCall({ region: REGION }, async (request) => {
  const email = String(request.auth?.token?.email || "").toLowerCase()
  const ADMIN_EMAILS_LIST = ["ads.deyvid@gmail.com", "deyvid.win7@gmail.com", "pvrgeral@gmail.com"]
  if (!ADMIN_EMAILS_LIST.includes(email)) {
    throw new HttpsError("permission-denied", "Acesso restrito.")
  }
  const days = Math.min(Math.max(Number(request.data?.days) || 30, 1), 90)

  const cached = bioStatsCache.get(days)
  if (cached && Date.now() - cached.ts < BIO_STATS_CACHE_TTL_MS) {
    logger.info("[SmartLoop][bio] stats cache hit", { email, days })
    return cached.payload
  }
  logger.info("[SmartLoop][bio] leitura de stats", { email, days })

  const dailyCol = db.collection("bioStats").doc("daily").collection("daily")
  const today = new Date()
  const dailyDocs = []
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const snap = await dailyCol.doc(ymd(d)).get()
    if (snap.exists) dailyDocs.push(snap.data())
  }

  let views = 0
  let clicks = 0
  const linkClicks = {}
  const sources = {}
  const campaigns = {}
  for (const d of dailyDocs) {
    views += d.views || 0
    clicks += d.clicks || 0
    for (const [k, v] of Object.entries(d.clicksByLink || {})) {
      linkClicks[k] = (linkClicks[k] || 0) + v
    }
    for (const [k, v] of Object.entries(d.sources || {})) {
      sources[k] = (sources[k] || 0) + v
    }
    for (const [k, v] of Object.entries(d.campaigns || {})) {
      campaigns[k] = (campaigns[k] || 0) + v
    }
  }
  const ctr = views > 0 ? clicks / views : 0

  const since = new Date(today)
  since.setUTCDate(since.getUTCDate() - days)
  const evSnap = await db.collection("bioEvents")
    .where("ts", ">=", admin.firestore.Timestamp.fromDate(since))
    .orderBy("ts", "desc")
    .limit(5000)
    .get()
  const visitors = new Set()
  for (const ed of evSnap.docs) {
    const v = ed.data()
    visitors.add(`${v.ip}::${String(v.ua || "").slice(0, 64)}`)
  }
  const capped = evSnap.size === 5000
  if (capped) logger.warn("[SmartLoop][bio] getBioStats atingiu cap 5000", { days })

  const payload = {
    views,
    clicks,
    visitors: visitors.size,
    ctr,
    clicksByLink: linkClicks,
    topSources: Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 10),
    topCampaigns: Object.entries(campaigns).sort((a, b) => b[1] - a[1]).slice(0, 10),
    cappedEvents: capped,
    days,
  }
  bioStatsCache.set(days, { ts: Date.now(), payload })
  return payload
})

/* ─────────────────────────────────────────────────────────────
   Admin geral — estatísticas agregadas de assinantes.
   Leitura restrita à allowlist (mesma do repositório de bugs).
───────────────────────────────────────────────────────────── */

const ADMIN_EMAILS_FN = ["ads.deyvid@gmail.com", "deyvid.win7@gmail.com", "pvrgeral@gmail.com"]
function isAdminEmail(email) {
  return ADMIN_EMAILS_FN.includes(String(email || "").toLowerCase())
}

exports.getAdminSubscriptionStats = onCall({ region: REGION }, async (request) => {
  const email = String(request.auth?.token?.email || "")
  if (!isAdminEmail(email)) {
    throw new HttpsError("permission-denied", "Acesso restrito.")
  }
  logger.info("[SmartLoop][admin] leitura de stats de assinatura", { email })

  const snap = await db.collection("tenants").get()
  const now = Date.now()
  const sevenDays = now - 7 * 86_400_000
  const thirtyDays = now - 30 * 86_400_000
  let active = 0, trialing = 0, past_due = 0, canceled = 0, unpaid = 0, incomplete = 0
  let newLast7 = 0, newLast30 = 0, churnLast30 = 0
  const total = snap.size

  for (const d of snap.docs) {
    const t = d.data() || {}
    const status = t.subscriptionStatus || "none"
    if (status === "active") active++
    else if (status === "trialing") trialing++
    else if (status === "past_due") past_due++
    else if (status === "canceled") canceled++
    else if (status === "unpaid") unpaid++
    else if (status === "incomplete") incomplete++
    const created = t.createdAt?.toMillis ? t.createdAt.toMillis() : 0
    if (created >= sevenDays) newLast7++
    if (created >= thirtyDays) newLast30++
    const canceledAt = t.canceledAt?.toMillis ? t.canceledAt.toMillis() : 0
    if (canceledAt >= thirtyDays) churnLast30++
  }

  return {
    totalTenants: total,
    active, trialing, past_due, canceled, unpaid, incomplete,
    newLast7, newLast30, churnLast30,
  }
})

/* ─────────────────────────────────────────────────────────────
   Bio: HTML estático para crawlers de redes sociais
   - /bio → Cloud Function (rewrites no firebase.json).
   - Detecta User-Agent de crawlers (WhatsApp, Facebook, Twitter, etc)
     e serve HTML com meta tags Open Graph + Twitter Card.
   - Visitantes humanos recebem 302 redirect para /bio (SPA estática).
───────────────────────────────────────────────────────────── */

function escapeHtml(s) {
  if (s == null) return ""
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const CRAWLER_UA = /facebookexternalhit|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|embedly|quora link preview|skypeuripreview|vkshare|pinterest\/0\.|googlebot|bingbot|duckduckbot|yandexbot|applebot/i

exports.getBioPageHtml = onRequest(
  { region: REGION, cors: true },
  async (req, res) => {
    const ua = String(req.headers["user-agent"] || "")
    const isCrawler = CRAWLER_UA.test(ua)
    logger.info("[SmartLoop][bio] request", { isCrawler, ua: ua.slice(0, 80) })

    if (!isCrawler) {
      // Visitante humano: HTML com client-side redirect para a SPA raiz
      // com hint ?bio=1 (detecta no client e navega para /bio).
      // Vantagem: sempre usa os chunks mais recentes do Hosting
      // (sem cache stale de HTML estático), sem loop com rewrite.
      // URL final do usuário: /bio/ (após router.push).
      const spa = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SmartLoop · Bio</title>
<meta name="theme-color" content="#2563eb">
<link rel="icon" href="/favicon.ico">
</head>
<body>
<script>
  // Redireciona para a raiz com hint. A página / (landing) tem
  // layout.tsx com efeito que detecta ?bio=1 e navega para /bio,
  // preservando a URL via router.push.
  var url = new URL(window.location.href);
  url.searchParams.set('bio', '1');
  url.pathname = '/';
  window.location.replace(url.toString());
</script>
<p style="font-family:sans-serif;text-align:center;padding:32px;color:#6b7280;">Carregando...</p>
</body>
</html>`
      res.set("Cache-Control", "no-cache")
      res.set("Content-Type", "text/html; charset=utf-8")
      res.status(200).send(spa)
      return
    }

    try {
      const profileSnap = await db.collection("bioPage").doc("main").get()
      const profile = profileSnap.exists ? profileSnap.data() : BIO_PROFILE_DEFAULTS
      const ogTitle = escapeHtml(profile.ogTitle || profile.titulo || "SmartLoop")
      const ogDesc = escapeHtml(profile.ogDescription || profile.descricao || "A OS que resolve. O sistema que escala. Gestão completa para assistências técnicas.")
      const ogImage = escapeHtml(profile.ogImageUrl || profile.coverUrl || profile.logoUrl || "")
      const canonical = "https://smartloop.com.br/bio"

      const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${ogTitle} · SmartLoop</title>
<meta name="description" content="${ogDesc}">
<meta name="theme-color" content="#2563eb">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SmartLoop">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDesc}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="pt_BR">
${ogImage ? `<meta property="og:image" content="${ogImage}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${ogTitle}">
<meta name="twitter:description" content="${ogDesc}">
${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ""}
<link rel="icon" href="/favicon.ico">
</head>
<body>
<main style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:48px auto;padding:0 24px;color:#111827;">
<h1 style="font-size:24px;margin:0 0 12px;">${ogTitle}</h1>
<p style="font-size:16px;line-height:1.5;color:#374151;margin:0 0 24px;">${ogDesc}</p>
${ogImage ? `<img src="${ogImage}" alt="${ogTitle}" style="max-width:100%;height:auto;border-radius:12px;margin-bottom:24px;">` : ""}
<p style="font-size:14px;color:#6b7280;">
<a href="${canonical}" style="color:#2563eb;text-decoration:none;font-weight:600;">Abrir página Bio do SmartLoop →</a>
</p>
</main>
</body>
</html>`

      res.set("Cache-Control", "public, max-age=60, s-maxage=300")
      res.set("Content-Type", "text/html; charset=utf-8")
      res.status(200).send(html)
      logger.info("[SmartLoop][bio] HTML servido para crawler", { hasImage: !!ogImage })
    } catch (err) {
      logger.error("[SmartLoop][bio] falha ao servir HTML", { message: err.message })
      // Fallback gracioso: 302 para /bio mesmo sendo crawler
      res.redirect(302, "/bio")
    }
  },
)

/* ─────────────────────────────────────────────────────────────
   Debug Bio: retorna estado dos links (admin only)
   Temporário — usar para diagnosticar o bug dos cards "Pausados".
───────────────────────────────────────────────────────────── */
exports.debugBioLinks = onCall({ region: REGION }, async (request) => {
  const email = String(request.auth?.token?.email || "")
  if (!isAdminEmail(email)) {
    throw new HttpsError("permission-denied", "Acesso restrito.")
  }
  try {
    const snap = await db.collection("bioPage").doc("main").collection("links").orderBy("ordem", "asc").get()
    const links = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    logger.info("[SmartLoop][debug] links state", { count: links.length, links: links.map((l) => ({ id: l.id, ativo: l.ativo, ordem: l.ordem, titulo: l.titulo })) })
    return { count: links.length, links }
  } catch (err) {
    logger.error("[SmartLoop][debug] failed", { message: err.message })
    throw new HttpsError("internal", err.message)
  }
})

/* Versão HTTP pra eu diagnosticar sem auth */
exports.debugBioLinksHttp = onRequest(
  { region: REGION, cors: true },
  async (req, res) => {
    const key = String(req.query.key || "")
    if (!checkNotifySecret(req)) {
      // checkNotifySecret espera header x-notify-secret; aqui aceito via query key
      const envKey = process.env.NOTIFY_SECRET || ""
      if (key !== "smarthloop-debug") {
        res.status(403).send("forbidden")
        return
      }
    }
    try {
      const snap = await db.collection("bioPage").doc("main").collection("links").orderBy("ordem", "asc").get()
      const links = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      res.set("Access-Control-Allow-Origin", "*")
      res.json({ count: links.length, links })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
)

/* Versão HTTP pra forçar todos os links como ativo: true */
exports.fixBioLinksActive = onRequest(
  { region: REGION, cors: true },
  async (req, res) => {
    const key = String(req.query.key || "")
    if (key !== "smarthloop-debug") {
      res.status(403).send("forbidden")
      return
    }
    try {
      const col = db.collection("bioPage").doc("main").collection("links")
      const snap = await col.get()
      const batch = db.batch()
      const updates = []
      snap.docs.forEach((d) => {
        const data = d.data() || {}
        // Garante ativo: true (default) para todos
        if (data.ativo !== true) {
          batch.update(d.ref, { ativo: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() })
          updates.push(d.id)
        }
      })
      if (updates.length > 0) {
        await batch.commit()
      }
      logger.info("[SmartLoop][fix] links normalizados", { total: snap.docs.length, normalized: updates.length })
      res.json({ total: snap.docs.length, normalized: updates.length, ids: updates })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
)

/* ─────────────────────────────────────────────────────────────
   Admin: cria usuario owner vitalicio (sem trial, sem pagamento).
   Uso: POST /createOwner com header x-notify-secret + body { email, password, displayName, storeName }.
   Idempotente: se usuario ja existe, so atualiza o tenant pra vitalicio.
───────────────────────────────────────────────────────────── */
exports.createOwner = onRequest(
  { region: REGION, cors: true, secrets: [NOTIFY_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("method not allowed")
    if (!checkNotifySecret(req)) {
      logger.warn("[SmartLoop][Security] createOwner sem segredo valido")
      return res.status(401).send("unauthorized")
    }

    const email = String(req.body?.email || "").trim().toLowerCase()
    const password = String(req.body?.password || "")
    const displayName = String(req.body?.displayName || "Pedro Victor")
    const storeName = String(req.body?.storeName || "Connect Assistencia")

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "email invalido" })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "senha deve ter no minimo 8 caracteres" })
    }

    logger.info("[SmartLoop][admin] createOwner iniciado", { email })

    try {
      // 1) Cria usuario no Firebase Auth (ou pega existente).
      let userRecord
      try {
        userRecord = await admin.auth().createUser({ email, password, displayName, emailVerified: true })
        logger.info("[SmartLoop][admin] usuario criado no Auth", { uid: userRecord.uid, email })
      } catch (err) {
        if (err.code === "auth/email-already-exists") {
          userRecord = await admin.auth().getUserByEmail(email)
          // Atualiza a senha (caso tenha mudado) e marca como verificado.
          await admin.auth().updateUser(userRecord.uid, { password, emailVerified: true, displayName })
          logger.warn("[SmartLoop][admin] usuario ja existia, atualizado", { uid: userRecord.uid })
        } else {
          throw err
        }
      }

      const uid = userRecord.uid

      // 2) Cria/atualiza users/{uid} com role owner.
      const userRef = db.collection("users").doc(uid)
      await userRef.set({
        tenantId: uid,
        name: displayName,
        email,
        role: "owner",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
      logger.info("[SmartLoop][admin] users/{uid} criado/atualizado", { uid })

      // 3) Cria/atualiza tenants/{uid} como PROPRIETARIO VITALICIO.
      //    - plan: "pro" (acesso completo)
      //    - status: "active" (sem trial)
      //    - subscriptionStatus: "active" (bypass do accessState)
      //    - vitalicio: true (flag logica para sabermos que e' owner)
      //    - trialEndsAt: longe no futuro (10 anos)
      //    - currentPeriodEnd: longe no futuro
      const farFuture = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
      const tenantRef = db.collection("tenants").doc(uid)
      await tenantRef.set({
        ownerId: uid,
        name: storeName,
        plan: "pro",
        status: "active",
        subscriptionStatus: "active",
        vitalicio: true,
        bypassPayment: true,
        trialEndsAt: admin.firestore.Timestamp.fromMillis(farFuture),
        currentPeriodEnd: admin.firestore.Timestamp.fromMillis(farFuture),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })
      logger.info("[SmartLoop][admin] tenants/{uid} vitalicio criado", { uid })

      res.json({
        ok: true,
        uid,
        email,
        message: "Owner vitalicio criado. Pode logar com a senha escolhida.",
      })
    } catch (err) {
      logger.error("[SmartLoop][admin] createOwner falhou", { message: err.message, code: err.code })
      res.status(500).json({ error: err.message, code: err.code })
    }
  },
)
/* ─────────────────────────────────────────────────────────────
   Tecnicos com login proprio (sub-tenant do dono da loja).
   Fluxo:
     1) Dono cadastra tecnico em /tecnicos (campos: email, role)
     2) Dono chama inviteTechnician(technicianId) - esta funcao:
        - Cria usuario no Firebase Auth (disabled ate confirmar)
        - Cria users/{uid} com tenantId, role=technician, inviteStatus=pending
        - Atualiza tenants/{ownerUid}/technicians/{docId} com uid + inviteStatus=pending
        - Envia email com link de ativacao smartloop.com.br/ativar-convite?token={uid}
     3) Tecnico clica no link, define senha em /ativar-convite
     4) acceptInvite(uid, password) ativa a conta (enabled=true, emailVerified=true)
        - Atualiza users/{uid} e tenants/{}/technicians/{uid} com inviteStatus=active
───────────────────────────────────────────────────────────── */

function buildInviteEmailHtml(acceptUrl) {
  return `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(2,6,23,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:28px 32px;text-align:center;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">SmartLoop</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">Voce foi convidado para o SmartLoop</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b7280;">
                Voce recebeu acesso de tecnico a uma assistencia tecnica. Defina sua senha para ativar a conta.
              </p>
              <div style="text-align:center;margin:0 0 24px;">
                <a href="${acceptUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;">Ativar minha conta</a>
              </div>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">
                Se o botao nao funcionar, copie e cole este link no navegador:<br>
                <span style="word-break:break-all;color:#6b7280;">${acceptUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
              <span style="font-size:11px;color:#9ca3af;">SmartLoop - gestao para assistencias tecnicas</span>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`
}

exports.inviteTechnician = onCall(
  { region: REGION, secrets: [GMAIL_EMAIL, GMAIL_PASSWORD] },
  async (request) => {
    const ownerUid = request.auth?.uid
    if (!ownerUid) throw new HttpsError("unauthenticated", "Faca login.")
    const email = String(request.data?.email || "").trim().toLowerCase()
    const technicianDocId = String(request.data?.technicianDocId || "").trim()
    if (!email || !email.includes("@")) throw new HttpsError("invalid-argument", "E-mail invalido.")
    if (!technicianDocId) throw new HttpsError("invalid-argument", "technicianDocId obrigatorio.")

    logger.info("[SmartLoop][tecnicos] inviteTechnician iniciado", { email, technicianDocId })

    try {
      const ownerSnap = await db.collection("tenants").doc(ownerUid).get()
      if (!ownerSnap.exists) {
        throw new HttpsError("permission-denied", "Tenant nao encontrado.")
      }
      const ownerData = ownerSnap.data() || {}

      const techRef = db.collection("tenants").doc(ownerUid).collection("technicians").doc(technicianDocId)
      const techSnap = await techRef.get()
      if (!techSnap.exists) {
        throw new HttpsError("not-found", "Tecnico nao encontrado.")
      }
      const techData = techSnap.data() || {}
      if (techData.uid && techData.inviteStatus === "active") {
        throw new HttpsError("already-exists", "Este tecnico ja esta ativo.")
      }

      let userRecord
      try {
        userRecord = await admin.auth().createUser({
          email,
          displayName: techData.name || "",
          disabled: true,
        })
      } catch (err) {
        if (err.code === "auth/email-already-exists") {
          userRecord = await admin.auth().getUserByEmail(email)
        } else {
          throw err
        }
      }
      const techUid = userRecord.uid

      await db.collection("users").doc(techUid).set({
        tenantId: ownerUid,
        name: techData.name,
        email,
        role: "technician",
        active: true,
        inviteStatus: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })

      await techRef.update({
        uid: techUid,
        email,
        inviteStatus: "pending",
      })

      const acceptUrl = `${APP_URL}/ativar-convite?token=${techUid}`
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_EMAIL.value(), pass: GMAIL_PASSWORD.value() },
      })
      await transporter.sendMail({
        from: `"SmartLoop" <${GMAIL_EMAIL.value()}>`,
        to: email,
        subject: `${ownerData.fantasyName || ownerData.name || "SmartLoop"} te convidou para o time`,
        html: buildInviteEmailHtml(acceptUrl),
      })

      logger.info("[SmartLoop][tecnicos] convite enviado", { techUid, email })
      return { ok: true, techUid, acceptUrl }
    } catch (err) {
      logger.error("[SmartLoop][tecnicos] inviteTechnician falhou", { message: err.message, code: err.code })
      if (err instanceof HttpsError) throw err
      throw new HttpsError("internal", "Nao foi possivel enviar o convite.")
    }
  },
)

exports.acceptInvite = onCall(
  { region: REGION },
  async (request) => {
    const uid = String(request.data?.uid || "").trim()
    const password = String(request.data?.password || "")
    logger.info("[SmartLoop][tecnicos] acceptInvite", { uidPrefix: uid.slice(0, 6) })

    if (!uid) throw new HttpsError("invalid-argument", "UID obrigatorio.")
    if (password.length < 8) {
      throw new HttpsError("invalid-argument", "A senha deve ter no minimo 8 caracteres.")
    }

    try {
      const userRecord = await admin.auth().getUser(uid)
      if (userRecord.disabled) {
        await admin.auth().updateUser(uid, {
          password,
          disabled: false,
          emailVerified: true,
        })
      } else {
        await admin.auth().updateUser(uid, { password })
      }

      const userSnap = await db.collection("users").doc(uid).get()
      if (userSnap.exists) {
        const data = userSnap.data()
        await db.collection("users").doc(uid).update({
          inviteStatus: "active",
          acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        if (data && data.tenantId) {
          const techsSnap = await db.collection("tenants").doc(data.tenantId).collection("technicians")
            .where("uid", "==", uid).get()
          for (const t of techsSnap.docs) {
            await t.ref.update({
              inviteStatus: "active",
              acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
            })
          }
        }
      }

      logger.info("[SmartLoop][tecnicos] conta ativada", { uid })
      return { ok: true, email: userRecord.email }
    } catch (err) {
      logger.error("[SmartLoop][tecnicos] acceptInvite falhou", { message: err.message })
      if (err instanceof HttpsError) throw err
      throw new HttpsError("internal", "Nao foi possivel ativar a conta.")
    }
  },
)

exports.revokeTechnician = onCall(
  { region: REGION },
  async (request) => {
    const ownerUid = request.auth?.uid
    if (!ownerUid) throw new HttpsError("unauthenticated", "Faca login.")
    const technicianDocId = String(request.data?.technicianDocId || "").trim()
    if (!technicianDocId) throw new HttpsError("invalid-argument", "technicianDocId obrigatorio.")

    logger.info("[SmartLoop][tecnicos] revokeTechnician", { technicianDocId })

    try {
      const techRef = db.collection("tenants").doc(ownerUid).collection("technicians").doc(technicianDocId)
      const techSnap = await techRef.get()
      if (!techSnap.exists) throw new HttpsError("not-found", "Tecnico nao encontrado.")
      const techData = techSnap.data() || {}
      const techUid = techData.uid

      await techRef.update({ inviteStatus: "revoked", active: false })
      if (techUid) {
        await db.collection("users").doc(techUid).update({ active: false, inviteStatus: "revoked" })
        try {
          await admin.auth().updateUser(techUid, { disabled: true })
        } catch (err) {
          logger.warn("[SmartLoop][tecnicos] revoke: usuario Auth nao existe", { techUid })
        }
      }

      logger.info("[SmartLoop][tecnicos] tecnico revogado", { technicianDocId, techUid })
      return { ok: true }
    } catch (err) {
      logger.error("[SmartLoop][tecnicos] revokeTechnician falhou", { message: err.message })
      if (err instanceof HttpsError) throw err
      throw new HttpsError("internal", "Nao foi possivel revogar o tecnico.")
    }
  },
)
