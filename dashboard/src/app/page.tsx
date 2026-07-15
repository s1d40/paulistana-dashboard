"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bot, Calendar, MessageSquare, TrendingUp, CheckCircle2, Zap, Play, Layers, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function LandingPage() {
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 1000], [0, 200]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      
      {/* Background Gradients & Grids */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black opacity-80" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5" />
      </div>

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="border-b border-white/10 bg-black/50 backdrop-blur-xl fixed top-0 w-full z-50"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px]">
              <div className="w-full h-full bg-black rounded-xl flex items-center justify-center font-black text-xl text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-400 group-hover:scale-110 transition-transform">
                C
              </div>
            </div>
            <span className="font-extrabold text-2xl tracking-tighter">Cocreator<span className="text-indigo-500">.ai</span></span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="relative group inline-flex items-center justify-center rounded-xl text-sm font-bold h-10 px-6 bg-white text-black overflow-hidden transition-transform hover:scale-105 active:scale-95">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative group-hover:text-white transition-colors duration-300">Começar Grátis</span>
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10">
        
        {/* Hero Section */}
        <section className="pt-40 pb-20 lg:pt-48 lg:pb-32 px-6">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left Content */}
            <motion.div 
              initial="hidden" animate="show" variants={staggerContainer}
              className="flex-1 text-center lg:text-left"
            >
              <motion.div variants={itemUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-300 uppercase tracking-widest mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <Sparkles className="w-4 h-4" />
                <span>O Futuro da Produção de Conteúdo</span>
              </motion.div>
              
              <motion.h1 variants={itemUp} className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1]">
                Automação <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Inteligente</span> <br className="hidden lg:block" />
                para suas Redes.
              </motion.h1>
              
              <motion.p variants={itemUp} className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
                Gere roteiros persuasivos, edite vídeos automaticamente e deixe nossos agentes de IA interagirem com seu público 24/7.
              </motion.p>
              
              <motion.div variants={itemUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/register" className="group relative inline-flex items-center justify-center rounded-xl text-sm font-bold bg-indigo-600 text-white w-full sm:w-auto h-14 px-8 overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)]">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600" />
                  <span className="relative flex items-center gap-2">
                    Iniciar Produção Grátis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link href="#planos" className="inline-flex items-center justify-center rounded-xl text-sm font-bold border border-white/10 hover:bg-white/5 w-full sm:w-auto h-14 bg-black/50 backdrop-blur-md text-white px-8 transition-colors">
                  <Play className="w-4 h-4 mr-2 text-zinc-400" /> Ver Demo
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Hero Image (3D Dashboard Concept) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, type: "spring" }}
              className="flex-1 relative w-full aspect-square max-w-lg mx-auto lg:max-w-none"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
              <div className="relative w-full h-full rounded-3xl border border-white/10 overflow-hidden bg-black/40 backdrop-blur-2xl shadow-2xl shadow-indigo-500/10">
                <Image 
                  src="/hero-concept.png" 
                  alt="Cocreator 3D Dashboard" 
                  fill 
                  className="object-cover object-center opacity-90 hover:opacity-100 transition-opacity duration-500 mix-blend-screen"
                  priority
                />
              </div>
            </motion.div>

          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="py-32 relative border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Poder de fogo para criadores</h2>
              <p className="text-xl text-zinc-400 max-w-3xl mx-auto">Tudo que você precisa para dominar o algoritmo, empacotado em uma interface estonteante e rápida.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              
              {/* Feature 1 (Large) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="md:col-span-2 md:row-span-2 rounded-3xl bg-zinc-950/50 border border-white/10 p-8 relative overflow-hidden group hover:border-indigo-500/50 transition-colors backdrop-blur-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Esteira de Produção Autônoma</h3>
                  <p className="text-zinc-400 text-lg max-w-md">Deixe a IA orquestrar roteiros, gerar mídias e editar vídeos virais em massa, tudo no background.</p>
                  
                  <div className="mt-auto relative w-full h-64 rounded-2xl overflow-hidden border border-white/5 mt-8">
                     <Image 
                        src="/features-bento.png" 
                        alt="Automação Visual" 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700 mix-blend-screen opacity-70 group-hover:opacity-100"
                     />
                  </div>
                </div>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                className="rounded-3xl bg-zinc-950/50 border border-white/10 p-8 relative overflow-hidden group hover:border-purple-500/50 transition-colors backdrop-blur-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Chatbots Persuasivos</h3>
                <p className="text-zinc-400">Converta seguidores em clientes com agentes de IA treinados na voz da sua marca.</p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                className="rounded-3xl bg-zinc-950/50 border border-white/10 p-8 relative overflow-hidden group hover:border-pink-500/50 transition-colors backdrop-blur-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-6">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Publicação Multi-Plataforma</h3>
                <p className="text-zinc-400">Agende e publique para Instagram, TikTok e YouTube de um só lugar.</p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planos" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Preços para quem quer escalar</h2>
              <p className="text-xl text-zinc-400">Investimento com ROI imediato em produtividade e conversão.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <PricingCard 
                title="Starter"
                price="47"
                description="Ideal para criadores autônomos."
                features={["50 Créditos IA / mês", "Até 2 Contas Sociais", "Geração de Roteiros e Legendas", "Agendamento Básico"]}
              />
              <PricingCard 
                title="Pro"
                price="147"
                description="Para Social Medias e agências."
                isPopular
                features={["250 Créditos IA / mês", "Até 10 Contas Sociais", "Agentes de IA para DMs", "Análise de Concorrência (Spy)", "Relatórios Avançados"]}
              />
              <PricingCard 
                title="Enterprise"
                price="497"
                description="Para hubs de conteúdo massivos."
                features={["1000 Créditos IA / mês", "Contas Ilimitadas", "Geração de Vídeo em Lote", "API e Webhooks", "Gestor Dedicado"]}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-16 bg-black relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-sm text-white">C</div>
            <span className="font-bold tracking-tight text-white">Cocreator Content Studio</span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">© 2026 SFAI Solutions. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-sm font-semibold text-zinc-500">
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ title, price, description, features, isPopular }: { title: string, price: string, description: string, features: string[], isPopular?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative p-10 rounded-[2rem] border transition-transform duration-300 hover:-translate-y-2 backdrop-blur-xl ${
        isPopular 
          ? 'bg-indigo-900/10 border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.1)]' 
          : 'bg-zinc-950/50 border-white/10 hover:border-white/20'
      } flex flex-col`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
          Mais Escolhido
        </div>
      )}
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-400 text-sm mb-8 h-10 font-medium">{description}</p>
      
      <div className="mb-8 flex items-start gap-1">
        <span className="text-xl font-bold text-zinc-400 mt-2">R$</span>
        <span className="text-6xl font-black tracking-tighter">{price}</span>
        <span className="text-zinc-500 font-bold self-end mb-2">/mês</span>
      </div>
      
      <Link 
        href="/register" 
        className={`inline-flex items-center justify-center rounded-xl text-sm font-bold h-14 px-4 w-full mb-10 transition-all ${
          isPopular 
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
            : 'bg-white hover:bg-zinc-200 text-black'
        }`}
      >
        Assinar {title}
      </Link>
      
      <ul className="space-y-5 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-zinc-300 font-medium text-sm">
            <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
               <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
