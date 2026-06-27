export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
        <p className="mb-4 text-slate-500">Última atualização: 25 de Junho de 2026</p>
        
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Introdução</h2>
            <p>Esta Política de Privacidade descreve como o aplicativo "Cocreator Content Studio" (o "Aplicativo") coleta, usa e protege as informações de nossos usuários. Nós desenvolvemos este Aplicativo com foco na segurança e transparência dos dados, exclusivamente para a integração entre plataformas de mídias sociais (como o Instagram) e nosso painel administrativo interno.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">2. Informações que Coletamos</h2>
            <p>O Aplicativo coleta dados básicos de perfil de usuário do Instagram/Facebook e o conteúdo de mensagens diretas e comentários (via webhook) estritamente quando você interage com nossa página oficial. Não capturamos informações sensíveis de cartões de crédito ou senhas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">3. Como Usamos as Informações</h2>
            <p>Usamos suas informações apenas para os seguintes propósitos:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Responder automaticamente às suas mensagens no direct do Instagram (Autoresponder).</li>
              <li>Fornecer links rápidos para os produtos que você se interessou.</li>
              <li>Monitorar métricas internas de engajamento do nosso conteúdo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Compartilhamento de Dados</h2>
            <p>Nós não vendemos, alugamos ou repassamos seus dados para terceiros. O fluxo de informações acontece exclusivamente entre a Meta (Facebook/Instagram) e o nosso servidor seguro.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Direitos do Usuário</h2>
            <p>Você pode solicitar a exclusão do seu histórico de interação com o nosso robô enviando uma mensagem direta para a nossa conta no Instagram solicitando "Excluir meus dados".</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">6. Contato</h2>
            <p>Se tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco através dos nossos canais de atendimento oficiais da Paulistana Empório.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
