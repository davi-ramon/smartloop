// Post-build:
// 1. Salva out/bio/index.html em functions/assets/bio-spa.html (a Cloud
//    Function serve este HTML inline para visitantes humanos).
// 2. Remove out/bio/ do Hosting para que o rewrite /bio → Cloud Function
//    funcione para crawlers (sem isso, Hosting serve estático e ignora o rewrite).

const fs = require("fs")
const path = require("path")

const outBio = path.join(__dirname, "..", "out", "bio")
const targetAsset = path.join(__dirname, "..", "functions", "assets", "bio-spa.html")
fs.mkdirSync(path.dirname(targetAsset), { recursive: true })

const indexHtml = path.join(outBio, "index.html")
if (fs.existsSync(indexHtml)) {
  fs.copyFileSync(indexHtml, targetAsset)
  console.log("[postbuild] copiado", indexHtml, "→", targetAsset)
} else {
  console.warn("[postbuild] aviso: não achei", indexHtml)
}

if (fs.existsSync(outBio)) {
  fs.rmSync(outBio, { recursive: true, force: true })
  console.log("[postbuild] removido", outBio)
} else {
  console.log("[postbuild] nada para remover em", outBio)
}