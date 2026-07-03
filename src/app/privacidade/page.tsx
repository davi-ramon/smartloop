import { LegalShell, LegalH2 } from "@/components/legal/legal-shell"

export const metadata = { title: "Política de Privacidade — SmartLoop" }

export default function PrivacidadePage() {
  return (
    <LegalShell title="Política de Privacidade" updated="3 de julho de 2026">
      <p>Esta Política descreve como o SmartLoop coleta, usa, armazena e protege dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>

      <LegalH2>1. Quem somos</LegalH2>
      <p>O SmartLoop é operado pela Connect Assistência em parceria com a Lazy Labs, atuando como controlador dos dados de cadastro e como operador dos dados que você insere sobre seus próprios clientes.</p>

      <LegalH2>2. Dados que coletamos</LegalH2>
      <p>Coletamos: (a) dados de cadastro (nome, e-mail, telefone, dados da loja); (b) dados de pagamento processados pela Stripe (não armazenamos o número completo do cartão); (c) dados operacionais que você insere (clientes, OS, estoque, financeiro); (d) dados técnicos de uso (endereço IP, navegador, páginas acessadas) para segurança e melhoria do serviço.</p>

      <LegalH2>3. Como usamos os dados</LegalH2>
      <p>Usamos os dados para: fornecer e manter a Plataforma; processar pagamentos; enviar comunicações essenciais e notificações do serviço; garantir segurança e prevenir fraudes; e cumprir obrigações legais. Não vendemos seus dados.</p>

      <LegalH2>4. Compartilhamento</LegalH2>
      <p>Compartilhamos dados apenas com provedores necessários à operação: Google Firebase (infraestrutura e banco de dados) e Stripe (pagamentos). Esses provedores seguem padrões de segurança adequados. Também podemos divulgar dados mediante ordem judicial.</p>

      <LegalH2>5. Armazenamento e segurança</LegalH2>
      <p>Os dados são armazenados em infraestrutura do Google Cloud/Firebase. Aplicamos isolamento por cliente (multi-tenant), regras de acesso, criptografia em trânsito e controle de credenciais. Apenas você acessa os dados da sua loja.</p>

      <LegalH2>6. Seus direitos</LegalH2>
      <p>Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados pessoais, além de revogar consentimentos. Basta contatar nosso canal de privacidade. Veja também a página <a href="/lgpd" className="text-[#60a5fa]">LGPD</a>.</p>

      <LegalH2>7. Retenção</LegalH2>
      <p>Mantemos os dados enquanto sua conta estiver ativa e pelo prazo necessário para cumprir obrigações legais. Após o encerramento, os dados podem ser anonimizados ou excluídos.</p>

      <LegalH2>8. Contato do encarregado (DPO)</LegalH2>
      <p><a href="mailto:suporte@smartloop.com.br" className="text-[#60a5fa]">suporte@smartloop.com.br</a> · (63) 99108-9086.</p>
    </LegalShell>
  )
}
