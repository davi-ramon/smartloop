import { LegalShell, LegalH2 } from "@/components/legal/legal-shell"

export const metadata = { title: "LGPD e Tratamento de Dados — SmartLoop" }

export default function LgpdPage() {
  return (
    <LegalShell title="LGPD e Tratamento de Dados" updated="3 de julho de 2026">
      <p>O SmartLoop respeita a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018). Esta página resume como tratamos dados pessoais e como você exerce seus direitos.</p>

      <LegalH2>1. Papéis</LegalH2>
      <p>Para os dados de cadastro da sua conta, o SmartLoop é <strong className="text-slate-200">controlador</strong>. Para os dados que você registra sobre seus próprios clientes, você é o controlador e o SmartLoop atua como <strong className="text-slate-200">operador</strong>, tratando os dados conforme suas instruções e para prestar o serviço.</p>

      <LegalH2>2. Bases legais</LegalH2>
      <p>Tratamos dados com base na execução do contrato (prestação do serviço), no cumprimento de obrigação legal, no legítimo interesse (segurança e melhoria) e no consentimento (cookies não essenciais e comunicações opcionais).</p>

      <LegalH2>3. Direitos do titular</LegalH2>
      <p>Você pode solicitar, a qualquer momento: confirmação da existência de tratamento; acesso aos dados; correção de dados incompletos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; informação sobre compartilhamentos; e revogação do consentimento.</p>

      <LegalH2>4. Segurança</LegalH2>
      <p>Adotamos medidas técnicas e organizacionais: isolamento multi-tenant, regras de acesso por identidade, criptografia em trânsito, limitação de instâncias contra abuso e ausência de segredos no código. Em caso de incidente de segurança relevante, comunicaremos os titulares e a ANPD conforme a lei.</p>

      <LegalH2>5. Como exercer seus direitos</LegalH2>
      <p>Envie sua solicitação para <a href="mailto:suporte@smartloop.com.br" className="text-[#60a5fa]">suporte@smartloop.com.br</a> ou (63) 99108-9086. Responderemos nos prazos legais. Consulte também a <a href="/privacidade" className="text-[#60a5fa]">Política de Privacidade</a>.</p>
    </LegalShell>
  )
}
