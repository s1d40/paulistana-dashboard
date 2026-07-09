import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-indigo-500/30">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-zinc-500 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar
        </Link>

        <header className="mb-12">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Política de Privacidade</h1>
          <p className="text-zinc-500 font-medium tracking-wide">Última atualização: Julho de 2026</p>
        </header>

        <div className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-headings:font-bold prose-h3:text-xl prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-li:text-zinc-400">
          <p className="text-lg text-zinc-400 leading-relaxed mb-8">
            A sua privacidade é importante para nós. Esta Política de Privacidade descreve como o <strong>SFAI Content Studio / Paulistana BI</strong> coleta, usa, processa e protege os seus dados pessoais e dados de integrações de terceiros, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>

          <section className="mt-12 space-y-8">
            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">1.</span> Dados que Coletamos</h3>
              <ul className="space-y-2">
                <li><strong>Dados de Cadastro:</strong> Quando você cria uma conta, coletamos seu nome, e-mail, telefone e dados de cobrança.</li>
                <li><strong>Dados de Integração (Meta APIs):</strong> Quando você autoriza a conexão com o Facebook ou Instagram, coletamos por meio de tokens de acesso autorizados:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>ID do usuário (Facebook e Instagram)</li>
                    <li>Nome de usuário (username) e Nome do Perfil</li>
                    <li>URL da Foto de Perfil</li>
                    <li>Conteúdo de DMs (Mensagens Diretas) e Comentários (exclusivamente para fins de automação e moderação ativadas por você).</li>
                    <li>Métricas e Insights da conta profissional.</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">2.</span> Como Usamos os Dados</h3>
              <p>Os dados coletados são utilizados exclusivamente para as seguintes finalidades:</p>
              <ul className="space-y-2 mt-4">
                <li>Execução do serviço contratado (agendamento, respostas automatizadas via IA, geração de dashboards).</li>
                <li>Autenticação e segurança da sua conta.</li>
                <li>Processamento dos dados de mensagens e comentários por modelos de IA (ex: OpenAI/Anthropic) <em>apenas</em> para gerar respostas para suas automações. Estes parceiros de IA não utilizam seus dados para treinar modelos públicos.</li>
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">3.</span> Compartilhamento de Dados</h3>
              <p>Nós <strong>não</strong> vendemos seus dados para terceiros. O compartilhamento ocorre apenas com:</p>
              <ul className="space-y-2 mt-4">
                <li>Provedores de infraestrutura e banco de dados (ex: Supabase, AWS).</li>
                <li>APIs de Inteligência Artificial para processamento de linguagem natural, operando sob acordos restritos de confidencialidade de dados.</li>
                <li>Autoridades legais, quando exigido por ordem judicial.</li>
              </ul>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
              <h3 className="flex items-center gap-3 mt-0"><span className="text-indigo-500">4.</span> Retenção e Exclusão de Dados</h3>
              <p className="mb-4">Armazenamos seus dados apenas pelo tempo necessário para a prestação dos serviços.</p>
              <h4 className="text-white font-semibold mt-6 mb-2">Exclusão de Dados da Meta (Facebook/Instagram):</h4>
              <p>
                A qualquer momento, você pode remover nosso aplicativo das suas configurações de Segurança no Facebook ou Instagram. Possuímos Webhooks automatizados que deletam instantaneamente seus tokens de acesso de nossos bancos de dados assim que recebemos o sinal de desautorização da Meta. Você também pode solicitar a exclusão total da sua conta e de todos os dados associados através do painel na aba "Configurações &gt; Contas", ou enviando um e-mail para <a href="mailto:privacidade@paulistanaemporio.com">privacidade@paulistanaemporio.com</a>.
              </p>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">5.</span> Seus Direitos (LGPD)</h3>
              <p>Você tem o direito de:</p>
              <ul className="space-y-2 mt-4">
                <li>Confirmar a existência de tratamento de dados.</li>
                <li>Acessar seus dados.</li>
                <li>Corrigir dados incompletos ou desatualizados.</li>
                <li>Solicitar a exclusão, bloqueio ou anonimização de dados desnecessários.</li>
                <li>Revogar o consentimento dado a integrações.</li>
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">6.</span> Segurança da Informação</h3>
              <p>
                Implementamos medidas técnicas e organizacionais (criptografia em trânsito e em repouso) para proteger seus dados contra acesso não autorizado, alteração ou destruição.
              </p>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">7.</span> Contato</h3>
              <p>
                Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato conosco através do suporte no painel ou via e-mail para <a href="mailto:privacidade@paulistanaemporio.com">privacidade@paulistanaemporio.com</a>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
