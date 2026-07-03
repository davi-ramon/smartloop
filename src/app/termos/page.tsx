import { LegalShell, LegalH2 } from "@/components/legal/legal-shell"

export const metadata = { title: "Termos de Uso — SmartLoop" }

export default function TermosPage() {
  return (
    <LegalShell title="Termos de Uso" updated="3 de julho de 2026">
      <p>Bem-vindo ao SmartLoop. Estes Termos de Uso regem o acesso e a utilização da plataforma SmartLoop (&ldquo;Plataforma&rdquo;), um sistema de gestão para assistências técnicas operado pela Connect Assistência em parceria com a Lazy Labs. Ao criar uma conta ou utilizar a Plataforma, você concorda com estes Termos.</p>

      <LegalH2>1. Cadastro e conta</LegalH2>
      <p>Para usar o SmartLoop é necessário criar uma conta com informações verdadeiras e mantê-las atualizadas. Você é responsável pela guarda das suas credenciais e por toda atividade realizada na sua conta. Cada conta representa uma loja (tenant) e seus dados são isolados dos demais clientes.</p>

      <LegalH2>2. Período de teste e assinatura</LegalH2>
      <p>Oferecemos um período de teste gratuito de 14 dias. O cadastro de um cartão de crédito é exigido para iniciar o teste. Você não é cobrado durante os 14 dias; ao término do período, a assinatura do plano escolhido é cobrada automaticamente no cartão informado, de forma recorrente mensal, até o cancelamento. Ao contratar um plano diretamente (sem teste), a cobrança é imediata.</p>

      <LegalH2>3. Pagamentos</LegalH2>
      <p>Os pagamentos são processados pela Stripe. Não armazenamos os dados completos do seu cartão. Você pode gerenciar ou cancelar a assinatura a qualquer momento pelo painel de configurações. Valores pagos não são reembolsados proporcionalmente, salvo disposição legal em contrário.</p>

      <LegalH2>4. Uso aceitável</LegalH2>
      <p>Você concorda em não utilizar a Plataforma para fins ilícitos, não tentar burlar mecanismos de segurança, não sobrecarregar a infraestrutura e não acessar dados de outros clientes. Podemos suspender contas que violem estas regras.</p>

      <LegalH2>5. Propriedade dos dados</LegalH2>
      <p>Os dados que você insere (clientes, ordens de serviço, financeiro, estoque) pertencem a você. O SmartLoop atua como operador desses dados para prestar o serviço. O software, a marca e o código da Plataforma pertencem aos seus desenvolvedores.</p>

      <LegalH2>6. Disponibilidade e limitação de responsabilidade</LegalH2>
      <p>Empregamos esforços para manter a Plataforma disponível e segura, mas ela é fornecida &ldquo;no estado em que se encontra&rdquo;. Não nos responsabilizamos por perdas decorrentes de indisponibilidade temporária, uso indevido ou fatores externos. Faça backups periódicos das informações críticas.</p>

      <LegalH2>7. Alterações</LegalH2>
      <p>Podemos atualizar estes Termos a qualquer momento. Alterações relevantes serão comunicadas na Plataforma ou por e-mail. O uso continuado após a atualização representa concordância.</p>

      <LegalH2>8. Contato</LegalH2>
      <p>Dúvidas sobre estes Termos: <a href="mailto:suporte@smartloop.com.br" className="text-[#60a5fa]">suporte@smartloop.com.br</a> ou (63) 99108-9086.</p>
    </LegalShell>
  )
}
