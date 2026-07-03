import { LegalShell, LegalH2 } from "@/components/legal/legal-shell"

export const metadata = { title: "Política de Cookies — SmartLoop" }

export default function CookiesPage() {
  return (
    <LegalShell title="Política de Cookies" updated="3 de julho de 2026">
      <p>Esta Política explica o que são cookies e como o SmartLoop os utiliza. Ao acessar o site, exibimos um aviso para que você aceite ou recuse cookies não essenciais.</p>

      <LegalH2>1. O que são cookies</LegalH2>
      <p>Cookies são pequenos arquivos armazenados no seu navegador que permitem lembrar preferências e entender como o site é utilizado.</p>

      <LegalH2>2. Tipos que utilizamos</LegalH2>
      <p><strong className="text-slate-200">Essenciais:</strong> necessários para o funcionamento e a segurança (sessão de login, preferências). Não podem ser desativados.</p>
      <p><strong className="text-slate-200">De desempenho/análise:</strong> ajudam a entender o uso do site para melhorá-lo. Só são ativados após o seu consentimento.</p>
      <p><strong className="text-slate-200">De marketing:</strong> eventuais pixels de conversão. Só são ativados após o seu consentimento.</p>

      <LegalH2>3. Consentimento</LegalH2>
      <p>Ao entrar no site, um aviso discreto permanece visível até você escolher. Cookies não essenciais (análise e marketing) só são ativados se você clicar em &ldquo;Aceitar&rdquo;. Se recusar, apenas os essenciais permanecem ativos.</p>

      <LegalH2>4. Como gerenciar</LegalH2>
      <p>Você pode limpar ou bloquear cookies nas configurações do seu navegador a qualquer momento. Também pode revisar sua escolha limpando os dados do site.</p>

      <LegalH2>5. Contato</LegalH2>
      <p><a href="mailto:suporte@smartloop.com.br" className="text-[#60a5fa]">suporte@smartloop.com.br</a> · (63) 99108-9086.</p>
    </LegalShell>
  )
}
