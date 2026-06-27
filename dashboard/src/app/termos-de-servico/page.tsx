export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold mb-6">Termos de Serviço</h1>
        <p className="mb-4 text-slate-500">Última atualização: 25 de Junho de 2026</p>
        
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Aceitação dos Termos</h2>
            <p>Ao interagir com o robô de autoatendimento ("Cocreator Content Studio") da Natural Feeding BR e Paulistana Empório através do Instagram ou outras redes sociais da Meta, você concorda com estes Termos de Serviço. O uso continuado dos nossos canais de comunicação constitui a sua aceitação destes termos.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">2. Descrição do Serviço</h2>
            <p>Fornecemos respostas automatizadas via inteligência artificial e regras de negócios pré-definidas para mensagens diretas (DMs) e comentários. Nosso objetivo é facilitar o acesso a links de compras e sanar dúvidas rapidamente sobre produtos do Mercado Livre, Nuvemshop e TikTok Shop.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">3. Uso Apropriado</h2>
            <p>O usuário concorda em utilizar nossos canais de atendimento apenas para fins lícitos e relacionados aos nossos produtos. É estritamente proibido:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Enviar mensagens com conteúdo abusivo, difamatório ou ilegal.</li>
              <li>Tentar explorar, invadir ou sobrecarregar a infraestrutura do nosso sistema de respostas automáticas.</li>
              <li>Utilizar robôs ou scripts de terceiros para inundar nossa caixa de mensagens (Spam).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Limitação de Responsabilidade</h2>
            <p>Nossas respostas automatizadas são geradas baseadas em nosso catálogo atual. No entanto, em caso de divergências de preços, links quebrados ou instabilidades, prevalecem as informações oficiais contidas nos anúncios das respectivas plataformas de venda (Mercado Livre, Nuvemshop etc.). Não nos responsabilizamos por perdas decorrentes do uso da ferramenta automatizada.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Modificações no Serviço</h2>
            <p>A Paulistana Empório / Natural Feeding BR reserva-se o direito de modificar, suspender ou descontinuar o serviço de autoatendimento a qualquer momento, sem aviso prévio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">6. Contato e Suporte</h2>
            <p>Se você precisar de atendimento humano ou quiser reportar um problema técnico, envie uma mensagem explícita solicitando "Atendimento Humano" em nossos canais de comunicação oficiais.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
