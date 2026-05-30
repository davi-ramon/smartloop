import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(
  "C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/"
);
const { chromium } = require("playwright");

const ROOT = path.resolve("auditorias/orderfy");
const OUTPUT_JSON = path.join(ROOT, "feature_inventory.json");
const OUTPUT_MD = path.join(ROOT, "RELATORIO_QA_ORDERFY.md");
const SCREEN_DIR = path.join(ROOT, "evidencias");

const url = process.env.ORDERFY_URL || "https://ordemfy.com.br/auth";
const email = process.env.ORDERFY_EMAIL;
const password = process.env.ORDERFY_PASSWORD;
const headed = process.env.ORDERFY_HEADED !== "0";
const executablePath = process.env.ORDERFY_BROWSER_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

if (!email || !password) {
  throw new Error("ORDERFY_EMAIL and ORDERFY_PASSWORD must be set in the environment.");
}

function now() {
  return new Date().toISOString();
}

function maskText(value = "") {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}\b/g, "[phone]")
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[cpf]")
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, "[cnpj]");
}

function unique(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

async function loadInventory() {
  try {
    return JSON.parse(await fs.readFile(OUTPUT_JSON, "utf8"));
  } catch {
    return {};
  }
}

async function saveInventory(inventory) {
  await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
}

async function appendMarkdown(section) {
  await fs.appendFile(OUTPUT_MD, `\n\n${section}\n`, "utf8");
}

async function pageSummary(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    };
    const textOf = (element) =>
      (element.innerText || element.textContent || element.getAttribute("aria-label") || element.getAttribute("placeholder") || "")
        .replace(/\s+/g, " ")
        .trim();
    const pick = (selector, limit = 80) =>
      Array.from(document.querySelectorAll(selector))
        .filter(visible)
        .map(textOf)
        .filter(Boolean)
        .slice(0, limit);
    const links = Array.from(document.querySelectorAll("a[href]"))
      .filter(visible)
      .map((anchor) => ({
        text: textOf(anchor),
        href: anchor.href,
      }))
      .filter((item) => item.text || item.href)
      .slice(0, 80);

    return {
      title: document.title,
      url: location.href,
      headings: pick("h1,h2,h3", 40),
      navTexts: pick("nav a, aside a, [role='navigation'] a, [data-sidebar] a", 80),
      buttons: pick("button, [role='button']", 80),
      labels: pick("label", 80),
      placeholders: Array.from(document.querySelectorAll("input[placeholder], textarea[placeholder]"))
        .filter(visible)
        .map((input) => input.getAttribute("placeholder"))
        .filter(Boolean)
        .slice(0, 80),
      links,
      bodySample: (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 2400),
      tech: {
        next: Boolean(document.querySelector("script[id='__NEXT_DATA__']")) || [...document.scripts].some((script) => script.src.includes("/_next/")),
        vite: [...document.scripts].some((script) => script.src.includes("/@vite/") || script.src.includes("/assets/")),
        manifest: document.querySelector("link[rel='manifest']")?.href || null,
        serviceWorker: "serviceWorker" in navigator,
      },
    };
  });
}

async function safeClickLogin(page) {
  const candidates = [
    "button[type='submit']",
    "button:has-text('Entrar')",
    "button:has-text('Login')",
    "button:has-text('Acessar')",
    "input[type='submit']",
  ];

  for (const selector of candidates) {
    const count = await page.locator(selector).count().catch(() => 0);
    if (count === 1) {
      await page.locator(selector).click();
      return selector;
    }
  }

  await page.keyboard.press("Enter");
  return "keyboard:Enter";
}

async function main() {
  await fs.mkdir(SCREEN_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 180 : 0,
    executablePath,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    ignoreHTTPSErrors: false,
  });
  const page = await context.newPage();

  const inventory = await loadInventory();
  inventory.target = {
    ...(inventory.target || {}),
    name: "Ordenfy",
    official_url: url,
    authenticated: false,
    credentials_persisted: false,
  };
  inventory.live_log = inventory.live_log || [];

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);
  const loginSummary = await pageSummary(page);
  await page.screenshot({ path: path.join(SCREEN_DIR, "01-login.png"), fullPage: true });

  const emailInput = page.locator("input[type='email'], input[name*='email' i], input[placeholder*='email' i]").first();
  const passwordInput = page.locator("input[type='password']").first();
  await emailInput.fill(email, { timeout: 15000 });
  await passwordInput.fill(password, { timeout: 15000 });
  const loginAction = await safeClickLogin(page);
  await page.waitForLoadState("domcontentloaded", { timeout: 45000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(2500);

  const afterLogin = await pageSummary(page);
  const authenticated = !/\/auth\b/.test(new URL(afterLogin.url).pathname) || /sair|logout|dashboard|ordem|cliente|servi[cç]o/i.test(afterLogin.bodySample);
  inventory.target.authenticated = authenticated;
  inventory.target.environment = "production_or_public_webapp";
  inventory.target.last_audited_at = now();
  inventory.observable_stack = unique([
    ...(inventory.observable_stack || []),
    afterLogin.tech.next ? "Next.js observavel por assets/_next ou __NEXT_DATA__" : "",
    afterLogin.tech.manifest ? `PWA manifest: ${afterLogin.tech.manifest}` : "",
    afterLogin.tech.serviceWorker ? "Service Worker API disponivel no navegador" : "",
  ]).map((name) => ({ name, source: "passive_browser_observation" }));

  const sameOriginLinks = afterLogin.links
    .filter((link) => {
      try {
        const target = new URL(link.href);
        return target.origin === new URL(afterLogin.url).origin;
      } catch {
        return false;
      }
    })
    .filter((link) => !/logout|sair|delete|excluir|remover/i.test(`${link.text} ${link.href}`))
    .slice(0, 18);

  const pages = [];
  for (const link of sameOriginLinks) {
    const current = page.url();
    if (link.href === current) continue;
    await page.goto(link.href, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(900);
    const summary = await pageSummary(page);
    pages.push({
      link_text: maskText(link.text),
      url: summary.url,
      title: maskText(summary.title),
      headings: unique(summary.headings.map(maskText)),
      navTexts: unique(summary.navTexts.map(maskText)),
      buttons: unique(summary.buttons.map(maskText)),
      labels: unique(summary.labels.map(maskText)),
      placeholders: unique(summary.placeholders.map(maskText)),
      bodySample: maskText(summary.bodySample),
    });
  }

  const navLabels = [
    "Dashboard",
    "Clientes",
    "Técnicos",
    "Fornecedores",
    "Vendas",
    "Serviços",
    "Marketing",
    "Estoque",
    "Financeiro",
    "Garantia",
    "Relatórios Avançados",
    "Fiscal",
    "Integrações",
    "Assinatura",
    "Configurações",
    "Ajuda",
  ];
  const navInteractions = [];
  await page.goto("https://ordemfy.com.br/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1000);
  for (const label of navLabels) {
    const before = page.url();
    const locator = page.getByText(label, { exact: true }).first();
    const visible = await locator.isVisible({ timeout: 1500 }).catch(() => false);
    if (!visible) continue;
    await locator.click({ timeout: 5000 }).catch(() => {});
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(900);
    const summary = await pageSummary(page);
    navInteractions.push({
      label,
      before_url: before,
      after_url: summary.url,
      title: maskText(summary.title),
      headings: unique(summary.headings.map(maskText)),
      navTexts: unique(summary.navTexts.map(maskText)),
      buttons: unique(summary.buttons.map(maskText)),
      labels: unique(summary.labels.map(maskText)),
      placeholders: unique(summary.placeholders.map(maskText)),
      bodySample: maskText(summary.bodySample),
    });
  }

  const safeActionLabels = [
    "Nova OS",
    "Criar primeira OS",
    "Nova Ordem de Serviço",
    "Cadastrar Cliente",
    "Novo Cliente",
    "Nova Venda",
    "Abrir PDV",
    "Orçamento Rápido",
    "Novo Técnico",
    "Novo Fornecedor",
  ];
  const actionForms = [];
  for (const action of safeActionLabels) {
    await page.goto("https://ordemfy.com.br/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const locator = page.getByText(action, { exact: true }).first();
    const visible = await locator.isVisible({ timeout: 1600 }).catch(() => false);
    if (!visible) continue;
    const before = page.url();
    await locator.click({ timeout: 5000 }).catch(() => {});
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const summary = await pageSummary(page);
    actionForms.push({
      action,
      before_url: before,
      after_url: summary.url,
      headings: unique(summary.headings.map(maskText)),
      buttons: unique(summary.buttons.map(maskText)),
      labels: unique(summary.labels.map(maskText)),
      placeholders: unique(summary.placeholders.map(maskText)),
      bodySample: maskText(summary.bodySample),
    });
    await page.keyboard.press("Escape").catch(() => {});
  }

  const directRouteCandidates = [
    "/dashboard",
    "/dashboard/orders",
    "/dashboard/orders/new",
    "/dashboard/customers",
    "/dashboard/customers/new",
    "/dashboard/technicians",
    "/dashboard/suppliers",
    "/dashboard/pdv",
    "/dashboard/quick-quotes",
    "/dashboard/sales",
    "/dashboard/services",
    "/dashboard/marketing",
    "/dashboard/stock",
    "/dashboard/products",
    "/dashboard/financial",
    "/dashboard/finance",
    "/dashboard/warranty",
    "/dashboard/reports",
    "/dashboard/fiscal",
    "/dashboard/integrations",
    "/dashboard/subscription",
    "/dashboard/settings",
    "/dashboard/settings/users",
    "/dashboard/settings/company",
    "/dashboard/settings/equipment-types",
    "/dashboard/settings/custom-fields",
    "/dashboard/settings/checklists",
    "/dashboard/settings/payment-methods",
    "/dashboard/settings/product-categories",
    "/dashboard/settings/compatible-films",
    "/dashboard/settings/prints",
    "/dashboard/support",
  ];
  const directRoutes = [];
  const origin = new URL(afterLogin.url).origin;
  for (const route of directRouteCandidates) {
    const routeUrl = `${origin}${route}`;
    await page.goto(routeUrl, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(700);
    const summary = await pageSummary(page);
    const missing = /404|not found|n[aã]o encontrada|p[aá]gina n[aã]o existe/i.test(summary.bodySample);
    directRoutes.push({
      route,
      requested_url: routeUrl,
      final_url: summary.url,
      status: missing ? "missing_or_not_found" : "loaded",
      title: maskText(summary.title),
      headings: unique(summary.headings.map(maskText)),
      buttons: unique(summary.buttons.map(maskText)),
      labels: unique(summary.labels.map(maskText)),
      placeholders: unique(summary.placeholders.map(maskText)),
      bodySample: maskText(summary.bodySample),
    });
  }

  const featureCandidates = unique([
    ...afterLogin.navTexts,
    ...afterLogin.headings,
    ...afterLogin.buttons,
    ...pages.flatMap((item) => [...item.headings, ...item.buttons, ...item.navTexts]),
    ...navInteractions.flatMap((item) => [...item.headings, ...item.buttons, ...item.navTexts]),
    ...actionForms.flatMap((item) => [...item.headings, ...item.buttons, ...item.labels, ...item.placeholders]),
    ...directRoutes.flatMap((item) => [...item.headings, ...item.buttons, ...item.labels, ...item.placeholders]),
  ].map(maskText));

  inventory.navigation = pages.map((item) => ({
    menu_or_route: item.link_text || item.title || item.url,
    url: item.url,
    type: "same_origin_link",
    objective: "Pendente de classificacao manual",
    actions: item.buttons,
    observations: item.bodySample,
  }));
  inventory.nav_interactions = navInteractions;
  inventory.action_forms = actionForms;
  inventory.direct_routes = directRoutes;
  inventory.features = featureCandidates.map((name) => ({
    name,
    source: "authenticated_ui_observation",
    status: "observed_label_or_action",
  }));
  inventory.live_log.push({
    at: now(),
    area: "auth",
    action: "login_attempt",
    result: authenticated ? "authenticated_or_dashboard_reached" : "login_may_have_failed_or_stayed_on_auth",
    evidence: "auditorias/orderfy/evidencias/01-login.png",
    details: {
      login_action: loginAction,
      before_title: maskText(loginSummary.title),
      after_title: maskText(afterLogin.title),
      after_url: afterLogin.url,
    },
  });

  await saveInventory(inventory);
  await appendMarkdown(`## Varredura automatizada inicial - ${now()}

- URL oficial: ${url}
- Resultado do login: ${authenticated ? "acesso autenticado ou dashboard alcancado" : "permaneceu na autenticacao ou login inconclusivo"}
- Titulo antes do login: ${maskText(loginSummary.title)}
- URL apos login: ${afterLogin.url}
- Menus/rotas internas observadas: ${pages.length}
- Interacoes de menu testadas: ${navInteractions.length}
- Formularios/acoes seguras abertas: ${actionForms.length}
- Rotas diretas verificadas: ${directRoutes.length}
- Candidatos de funcionalidades capturados: ${featureCandidates.length}
- Evidencia nao autenticada: \`auditorias/orderfy/evidencias/01-login.png\`

### Rotas observadas

${pages.map((item) => `- ${item.link_text || item.title || item.url}: ${item.url}`).join("\n") || "- Nenhuma rota interna observada nesta passada."}

### Menus clicados

${navInteractions.map((item) => `- ${item.label}: ${item.after_url}`).join("\n") || "- Nenhum menu adicional clicado nesta passada."}

### Acoes seguras abertas sem salvar

${actionForms.map((item) => `- ${item.action}: ${item.after_url} | campos: ${unique([...item.labels, ...item.placeholders]).slice(0, 24).join(", ") || "sem campos capturados"}`).join("\n") || "- Nenhuma acao segura aberta nesta passada."}

### Rotas diretas verificadas

${directRoutes.map((item) => `- ${item.status === "loaded" ? "OK" : "N/A"} ${item.route}: ${item.final_url} | ${item.headings.slice(0, 4).join(" / ") || item.title}`).join("\n")}

### Labels e acoes candidatas

${featureCandidates.slice(0, 120).map((item) => `- ${item}`).join("\n") || "- Nenhuma label capturada nesta passada."}
`);

  await browser.close();
  console.log(JSON.stringify({ authenticated, afterUrl: afterLogin.url, pages: pages.length, features: featureCandidates.length }, null, 2));
}

main().catch(async (error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
