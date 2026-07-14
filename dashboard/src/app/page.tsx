import Link from "next/link";
import { ArrowRight, Bot, Calendar, MessageSquare, TrendingUp, CheckCircle2, Shield, Zap } from "lucide-react";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg">
              C
            </div>
            <span className="font-semibold text-xl tracking-tight">Cocreator</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-white text-black hover:bg-zinc-200">Começar Grátis</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black -z-10"></div>
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 mb-8">
              <Zap className="w-4 h-4" />
              <span>Nova Arquitetura Multi-Tenant + IA</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              Crie, gerencie e <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">escale</span> <br className="hidden md:block" />
              seu conteúdo com IA
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Uma plataforma completa para gerenciar suas redes sociais. Geração de roteiros, edição de vídeos, respostas automáticas e análise da concorrência em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto h-12 px-8">
                Testar Gratuitamente <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link href="#planos" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-white/20 hover:bg-white/5 w-full sm:w-auto h-12 bg-black text-white hover:text-white px-8">
                Ver Planos
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 border-t border-white/10 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que você precisa para dominar as redes</h2>
              <p className="text-zinc-400">Ferramentas avançadas desenhadas para criadores e agências.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard 
                icon={<Bot />}
                title="Copiloto de IA"
                description="Gere roteiros perfeitos, legendas e ideias de conteúdo em segundos com nossa inteligência artificial treinada para conversão."
              />
              <FeatureCard 
                icon={<Calendar />}
                title="Agendamento Inteligente"
                description="Publique reels e carrosséis automaticamente no Instagram e Facebook nos melhores horários."
              />
              <FeatureCard 
                icon={<TrendingUp />}
                title="Análise de Concorrência"
                description="Monitore as métricas dos seus concorrentes e descubra quais posts estão gerando mais engajamento no seu nicho."
              />
              <FeatureCard 
                icon={<MessageSquare />}
                title="Automação de DMs"
                description="Agentes de IA que respondem direct messages, tiram dúvidas de clientes e ajudam a fechar vendas no automático."
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planos" className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos que escalam com você</h2>
              <p className="text-zinc-400">Escolha o pacote ideal para o tamanho do seu negócio. Cancele quando quiser.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <PricingCard 
                title="Starter"
                price="47"
                description="Ideal para criadores autônomos e pequenos negócios."
                features={[
                  "50 Créditos IA / mês",
                  "Até 2 Contas Sociais",
                  "Geração de Roteiros e Legendas",
                  "Agendamento Básico",
                  "Suporte por Email"
                ]}
              />
              <PricingCard 
                title="Pro"
                price="147"
                description="Para Social Medias e agências em crescimento."
                isPopular
                features={[
                  "250 Créditos IA / mês",
                  "Até 10 Contas Sociais",
                  "Agentes de IA para DMs",
                  "Análise de Concorrência (ML Spy)",
                  "Relatórios Avançados",
                  "Suporte Prioritário no WhatsApp"
                ]}
              />
              <PricingCard 
                title="Enterprise"
                price="497"
                description="Para grandes operações e hubs de conteúdo."
                features={[
                  "1000 Créditos IA / mês",
                  "Contas Sociais Ilimitadas",
                  "Geração de Vídeo em Lote",
                  "Acesso a API e Webhooks",
                  "Gestor de Conta Dedicado",
                  "SLA Garantido"
                ]}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-12 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-zinc-300">Cocreator Content Studio</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 SFAI Solutions. Todos os direitos reservados.</p>
          <div className="flex gap-4 text-sm text-zinc-500">
            <Link href="/termos-de-servico" className="hover:text-zinc-300">Termos</Link>
            <Link href="/privacidade" className="hover:text-zinc-300">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ title, price, description, features, isPopular }: { title: string, price: string, description: string, features: string[], isPopular?: boolean }) {
  return (
    <div className={`relative p-8 rounded-3xl border ${isPopular ? 'bg-indigo-950/20 border-indigo-500' : 'bg-white/5 border-white/10'} flex flex-col`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
          Mais Escolhido
        </div>
      )}
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm mb-6 h-10">{description}</p>
      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-3xl font-bold">R$</span>
        <span className="text-5xl font-extrabold tracking-tight">{price}</span>
        <span className="text-zinc-400 font-medium">/mês</span>
      </div>
      <Link href="/register" className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 w-full mb-8 ${isPopular ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}>Assinar {title}</Link>
      <ul className="space-y-4 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-zinc-300">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
