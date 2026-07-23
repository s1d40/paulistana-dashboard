import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function TermsOfService() {
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
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Termos e Condições de Uso</h1>
          <p className="text-zinc-500 font-medium tracking-wide">Última atualização: Julho de 2026</p>
        </header>

        <div className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-headings:font-bold prose-h3:text-xl prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-li:text-zinc-400">
          <p className="text-lg text-zinc-400 leading-relaxed mb-8">
            Bem-vindo ao <strong>Cocreator Content Studio / Cocreator Studio</strong> ("Plataforma", "nós", "nosso"). Ao acessar ou utilizar nossa plataforma, você concorda em se vincular a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
          </p>

          <section className="mt-12 space-y-8">
            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">1.</span> Escopo dos Serviços</h3>
              <p>
                Nossa Plataforma fornece ferramentas de automação de marketing, inteligência artificial, agendamento de postagens e gestão de interações sociais (DMs e comentários) através da integração com plataformas de terceiros, primariamente a Meta Platforms, Inc. (Facebook, Instagram, WhatsApp).
              </p>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">2.</span> Contas de Usuário</h3>
              <p>
                Para utilizar nossos serviços, você deve criar uma conta. Você é responsável por manter a confidencialidade de sua conta, credenciais e tokens de acesso, sendo totalmente responsável por todas as atividades que ocorram sob sua conta.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
              <h3 className="flex items-center gap-3 mt-0"><span className="text-indigo-500">3.</span> Integração com Terceiros (Meta)</h3>
              <p className="mb-4">Nossos serviços dependem das APIs da Meta. Ao conectar sua conta do Facebook ou Instagram, você reconhece e concorda que:</p>
              <ul className="space-y-2 mt-4">
                <li>Você está sujeito aos Termos de Serviço e Políticas para Desenvolvedores da Meta.</li>
                <li>Nós não nos responsabilizamos por indisponibilidades, mudanças de políticas, revogação de acessos ou bloqueios realizados pela Meta em sua conta social.</li>
                <li>Caso a Meta altere ou descontinue suas APIs de forma que afete nossos serviços, não seremos responsabilizados por eventuais perdas ou danos.</li>
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">4.</span> Uso de Inteligência Artificial</h3>
              <p>Nossa plataforma utiliza ferramentas de Inteligência Artificial (IA) para gerar textos, imagens e responder automaticamente a mensagens e comentários. O usuário compreende que:</p>
              <ul className="space-y-2 mt-4">
                <li>O conteúdo gerado por IA pode, ocasionalmente, conter imprecisões.</li>
                <li>É responsabilidade do usuário revisar e aprovar conteúdos antes da publicação final.</li>
                <li>O usuário é o único responsável legal por qualquer conteúdo publicado por meio de nossa plataforma em suas redes sociais.</li>
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">5.</span> Propriedade Intelectual</h3>
              <p>
                Todo o código-fonte, design, logotipos e infraestrutura da Plataforma são de nossa propriedade exclusiva. Ao utilizar o serviço, concedemos uma licença revogável, não exclusiva e intransferível de uso da plataforma, sem a transferência de qualquer direito autoral.
              </p>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">6.</span> Limitação de Responsabilidade</h3>
              <p>
                Em nenhuma circunstância seremos responsáveis por danos indiretos, lucros cessantes, perda de dados ou danos punitivos resultantes do uso ou incapacidade de usar nossos serviços.
              </p>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">7.</span> Rescisão</h3>
              <p>
                Reservamo-nos o direito de suspender ou encerrar sua conta a qualquer momento, por violação destes Termos, uso indevido das APIs integradas (como envio de spam) ou falta de pagamento.
              </p>
            </div>

            <div>
              <h3 className="flex items-center gap-3"><span className="text-indigo-500">8.</span> Lei Aplicável</h3>
              <p>
                Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede da empresa para dirimir quaisquer controvérsias.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
