// Post-build: o Next export gera /bio/index.html com chunks válidos.
// Não deletamos — o rewrite catch-all ** do firebase.json serve o
// /index.html quando o path não existe; mas como out/bio/index.html
// EXISTE, o Hosting serve direto. O rewrite /bio → Cloud Function foi
// REMOVIDO do firebase.json (causava problemas de chunks stale quando
// a SPA inline era gerada por build, mas deploys subsequentes usavam
// chunks novos — incompatibilidade).
//
// A Cloud Function getBioPageHtml continua deployada, mas só é útil
// para cenários internos (ex: gerar preview de crawler manualmente).

const fs = require("fs")
const path = require("path")

const outBio = path.join(__dirname, "..", "out", "bio")
console.log("[postbuild] mantido", outBio || "(não existe)", "— Hosting serve direto (sem rewrite /bio → function)")
