export const dynamic = 'force-dynamic';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-6">Termos de Serviço</h1>
        <p className="mb-4 text-slate-500">Última atualização: 07 de Julho de 2026</p>
        
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Aceitação dos Termos</h2>
            <p>Ao conectar e utilizar o "SFAI Content Bot" / "Cocreator Content Studio", você concorda expressamente em cumprir e sujeitar-se a estes Termos de Serviço. Se não concordar com qualquer parte destes termos, você não deve usar os serviços fornecidos pelo aplicativo.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">2. Descrição do Serviço</h2>
            <p>O aplicativo atua como um facilitador de automação para perfis de negócios, conectando as páginas do Facebook e perfis comerciais do Instagram do usuário a uma plataforma CRM central. O serviço permite o agendamento de posts, resposta automatizada a comentários e a sincronização de mensagens para gestão centralizada.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">3. Restrições de Uso</h2>
            <p>O usuário concorda em utilizar o serviço estritamente de acordo com as Políticas para Desenvolvedores da Meta. É estritamente proibido:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Usar a automação de mensagens para enviar spam, phishing ou ofertas não solicitadas.</li>
              <li>Acessar ou usar dados do Instagram de forma prejudicial a usuários ou a terceiros.</li>
              <li>Tentar descompilar, fazer engenharia reversa ou subverter os mecanismos de segurança do aplicativo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Isenção de Garantias</h2>
            <p>Os serviços do aplicativo são prestados "no estado em que se encontram". Não oferecemos garantias de que o serviço será ininterrupto, oportuno ou isento de erros. Devido à dependência das APIs do Facebook e Instagram, o serviço está sujeito a indisponibilidades da Meta Platforms, Inc.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Modificação dos Termos</h2>
            <p>Reservamo-nos o direito de modificar estes Termos de Serviço a qualquer momento. Modificações entrarão em vigor no momento da sua publicação nesta página.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">6. Rescisão</h2>
            <p>Você pode encerrar o uso do serviço a qualquer momento, desvinculando o aplicativo através do painel de Configurações de Negócios do Facebook. Nós nos reservamos o direito de suspender ou encerrar seu acesso ao serviço por violação destes termos.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
