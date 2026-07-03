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

const APP_URL = "https://smartloop-94a06.web.app"
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
            <span style="font-size:11px;color:#9ca3af;">SmartLoop — gestão para assistências técnicas · smartloop-94a06.web.app</span>
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
            <a href="https://smartloop-94a06.web.app/os" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;">Abrir minhas OS</a>
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
          <a href="https://smartloop-94a06.web.app/relatorios-bugs" style="color:#2563eb;font-size:13px;font-weight:600;text-decoration:none;">Abrir repositório de relatos →</a>
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
