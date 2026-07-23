# 🔮 Código dos Signos App — Documento de Arquitetura & Planejamento

> **Projeto**: Plataforma SaaS de Astrologia, Tarô & Numerologia  
> **Marca**: Código dos Signos  
> **Status**: Planejamento / Pré-desenvolvimento  
> **Data**: Julho 2026  
> **Autor**: Equipe Paulistana Empório / SFai Solutions

---

## 1. Visão do Produto

### 1.1 Proposta de Valor
O **Código dos Signos App** é uma plataforma premium de autoconhecimento astrológico que oferece serviços personalizados de Mapa Astral, Sinastria Amorosa, Tarô com IA, Horóscopo e Numerologia — tudo em um único app com design moderno, experiência gamificada e interpretações geradas por Inteligência Artificial.

### 1.2 Diferenciais Competitivos
- **IA Generativa para Interpretações**: Uso do Gemini/OpenAI para gerar leituras personalizadas profundas (não genéricas)
- **Sinastria como Produto Principal**: Foco em compatibilidade amorosa como hook viral (conteúdo compartilhável)
- **Integração com Rede Social**: Conexão direta com o Instagram @codigodossignos (400k+ seguidores potenciais)
- **Precisão Astronômica**: Swiss Ephemeris (sub-arcsecond) via WebAssembly
- **Modelo Freemium + Micro-pagamentos**: Acesso básico gratuito com upsell de relatórios premium

### 1.3 Público-Alvo
| Segmento | Perfil | Motivação |
|----------|--------|-----------|
| Curiosos | 18-25 anos, IG/TikTok | "Qual signo combina comigo?" |
| Entusiastas | 25-40 anos, buscam autoconhecimento | Mapa astral detalhado, trânsitos |
| Praticantes | 30-50 anos, estudam astrologia | Sinastria profissional, revolução solar |

---

## 2. Módulos do Produto

### 2.1 🌟 Mapa Astral Completo
- Entrada: Data, hora e local de nascimento
- Output: Mapa natal SVG interativo + interpretação IA
- Dados calculados: Sol, Lua, Ascendente, 10 planetas, 12 casas, aspectos
- **Monetização**: Free (resumo) / Pro (completo com trânsitos)

### 2.2 💕 Sinastria Amorosa
- Entrada: Dados de nascimento de 2 pessoas
- Output: Score de compatibilidade + análise por área (amor, sexo, comunicação, valores, crescimento)
- Visualização: Mapa dual overlay com aspectos coloridos
- **Monetização**: 1 sinastria free / Pro (ilimitadas + relatório PDF)

### 2.3 🔮 Tarô Interativo com IA
- Tiragens: 1 carta, 3 cartas (passado-presente-futuro), Cruz Celta (10 cartas)
- Animação: Flip de cartas 3D com reveal progressivo
- Interpretação: IA contextualizada com pergunta do usuário
- **Monetização**: 1 tiragem/dia free / Pro (ilimitadas + tiragens especiais)

### 2.4 ♈ Horóscopo (Diário / Semanal / Mensal)
- Gerado por IA com base nos trânsitos reais do dia
- Personalizado pelo mapa natal do usuário (não genérico)
- Push notifications com horóscopo matinal
- **Monetização**: Diário free / Semanal+Mensal Pro

### 2.5 🔢 Mapa Numerológico
- Entrada: Nome completo + data de nascimento
- Cálculos: Número do destino, expressão, motivação, impressão, lições cármicas
- Interpretação IA personalizada
- **Monetização**: Resumo free / Completo Pro

### 2.6 ✡️ Mapa Cabalístico (Árvore da Vida)
- Baseado na Gematria hebraica do nome
- Visualização da Árvore da Vida com Sephiroth ativadas
- Interpretação dos caminhos e tikkunim (correções)
- **Monetização**: Pro exclusivo

### 2.7 🌙 Trânsitos & Alertas
- Cálculo dos trânsitos planetários em tempo real sobre o mapa natal
- Alertas: Mercúrio retrógrado, eclipses, Lua Nova/Cheia
- Previsões personalizadas por período
- **Monetização**: Pro exclusivo

---

## 3. Arquitetura Técnica

### 3.1 Stack Tecnológico

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  React 18 + Vite + TypeScript + Tailwind CSS        │
│  PWA (Progressive Web App) — Installable            │
│  Firebase Hosting (CDN Global)                       │
├─────────────────────────────────────────────────────┤
│                    BACKEND                           │
│  Firebase Cloud Functions (Node.js 20)               │
│  Firebase Authentication (Google, Email, Apple)      │
│  Firestore (NoSQL — User Data, Charts, Sessions)     │
│  Firebase Cloud Messaging (Push Notifications)       │
├─────────────────────────────────────────────────────┤
│               CALCULATION ENGINE                     │
│  Swiss Ephemeris WASM (Client-side, zero-latency)    │
│  Fallback: Cloud Function (server-side calc)         │
│  Timezone: Luxon + IANA + Google Timezone API        │
├─────────────────────────────────────────────────────┤
│                  AI / LLM LAYER                      │
│  Google Gemini 2.5 Flash (primary — cost-effective)  │
│  OpenAI GPT-4o (fallback for complex readings)       │
│  Structured prompts: chart JSON → interpretation     │
├─────────────────────────────────────────────────────┤
│                 PAYMENTS                             │
│  Stripe Checkout + Customer Portal                   │
│  Firebase Extension: "Run Payments with Stripe"      │
│  Webhooks: invoice.paid, subscription.updated        │
├─────────────────────────────────────────────────────┤
│              INTEGRATIONS                            │
│  Cocreator API (Paulistana BI dashboard sync)        │
│  Instagram Graph API (share charts to stories)       │
│  Google Maps/OpenCage (geocoding birthplace)          │
└─────────────────────────────────────────────────────┘
```

### 3.2 Estrutura de Pastas

```
codigo-dos-signos-app/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD → Firebase Hosting
├── public/
│   ├── manifest.json               # PWA config
│   ├── sw.js                       # Service Worker
│   └── assets/
│       ├── tarot/                  # 78 cartas (Major + Minor Arcana)
│       ├── zodiac/                 # 12 ícones de signos SVG
│       └── planets/                # Ícones planetários
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── Router.tsx
│   │   └── providers/
│   │       ├── AuthProvider.tsx
│   │       ├── ThemeProvider.tsx
│   │       └── SubscriptionProvider.tsx
│   ├── pages/
│   │   ├── Home.tsx                # Landing + Onboarding
│   │   ├── Dashboard.tsx           # Home logado
│   │   ├── NatalChart.tsx          # Mapa Astral
│   │   ├── Synastry.tsx            # Sinastria Amorosa
│   │   ├── Tarot.tsx               # Tarô Interativo
│   │   ├── Horoscope.tsx           # Horóscopo
│   │   ├── Numerology.tsx          # Numerologia
│   │   ├── Kabbalah.tsx            # Cabala
│   │   ├── Transits.tsx            # Trânsitos
│   │   ├── Profile.tsx             # Perfil do usuário
│   │   ├── Pricing.tsx             # Planos & Assinatura
│   │   └── Settings.tsx            # Configurações
│   ├── components/
│   │   ├── charts/
│   │   │   ├── NatalWheel.tsx      # SVG wheel renderer
│   │   │   ├── SynastryOverlay.tsx # Dual chart overlay
│   │   │   ├── AspectGrid.tsx      # Grid de aspectos
│   │   │   └── TransitTimeline.tsx # Timeline de trânsitos
│   │   ├── tarot/
│   │   │   ├── TarotCard.tsx       # Card component com flip 3D
│   │   │   ├── TarotSpread.tsx     # Layout de tiragem
│   │   │   └── TarotReading.tsx    # Interpretação IA
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── PaywallGate.tsx     # Paywall component
│   │   │   └── ShareCard.tsx       # Card compartilhável IG
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       ├── BottomNav.tsx       # Mobile bottom navigation
│   │       └── Sidebar.tsx
│   ├── lib/
│   │   ├── ephemeris/
│   │   │   ├── sweph.wasm          # Swiss Ephemeris WASM
│   │   │   ├── calculator.ts       # Wrapper TS
│   │   │   └── aspects.ts          # Aspect calculator
│   │   ├── numerology/
│   │   │   ├── pythagorean.ts      # Numerologia pitagórica
│   │   │   └── kabbalah.ts         # Gematria hebraica
│   │   ├── tarot/
│   │   │   ├── deck.ts             # Definição das 78 cartas
│   │   │   └── spreads.ts          # Layouts de tiragem
│   │   ├── ai/
│   │   │   ├── gemini.ts           # Gemini API client
│   │   │   ├── prompts/
│   │   │   │   ├── natal-chart.ts  # System prompt mapa astral
│   │   │   │   ├── synastry.ts     # System prompt sinastria
│   │   │   │   ├── tarot.ts        # System prompt tarô
│   │   │   │   ├── horoscope.ts    # System prompt horóscopo
│   │   │   │   └── numerology.ts   # System prompt numerologia
│   │   │   └── interpreter.ts      # Orchestrator
│   │   ├── firebase.ts             # Firebase config
│   │   └── stripe.ts               # Stripe config
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSubscription.ts
│   │   ├── useChart.ts
│   │   └── useTarot.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── chart.service.ts
│   │   ├── payment.service.ts
│   │   └── user.service.ts
│   ├── store/
│   │   └── userStore.ts            # Zustand
│   └── styles/
│       ├── globals.css
│       └── theme.ts
├── functions/
│   ├── src/
│   │   ├── index.ts                # Cloud Functions entry
│   │   ├── stripe-webhooks.ts      # Stripe event handlers
│   │   ├── horoscope-cron.ts       # Gera horóscopo diário (Cloud Scheduler)
│   │   ├── chart-calculator.ts     # Server-side fallback calc
│   │   └── ai-interpreter.ts       # Gemini/OpenAI proxy (hides API keys)
│   ├── package.json
│   └── tsconfig.json
├── firebase.json                   # Hosting + Functions config
├── firestore.rules                 # Security rules
├── firestore.indexes.json
├── .firebaserc
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

### 3.3 Modelo de Dados (Firestore)

```
users/{userId}
├── email: string
├── displayName: string
├── photoURL: string
├── birthData: {
│     date: "1990-03-15"
│     time: "14:30"
│     latitude: -23.5505
│     longitude: -46.6333
│     city: "São Paulo, SP"
│     timezone: "America/Sao_Paulo"
│   }
├── subscription: {
│     plan: "free" | "pro" | "premium"
│     stripeCustomerId: string
│     stripeSubscriptionId: string
│     currentPeriodEnd: timestamp
│   }
├── preferences: {
│     theme: "dark" | "light" | "cosmic"
│     pushNotifications: boolean
│     dailyHoroscope: boolean
│   }
├── createdAt: timestamp
└── updatedAt: timestamp

charts/{chartId}
├── userId: string
├── type: "natal" | "synastry" | "transit" | "solar_return"
├── birthData: { ... }           # (ou 2 para sinastria)
├── partnerBirthData?: { ... }   # Sinastria
├── calculatedData: {
│     planets: [ { name, sign, degree, house, retrograde } ]
│     houses: [ { number, sign, degree } ]
│     aspects: [ { planet1, planet2, type, orb } ]
│     score?: number             # Sinastria score
│   }
├── interpretation: string       # AI-generated
├── createdAt: timestamp
└── shared: boolean

tarot_readings/{readingId}
├── userId: string
├── spreadType: "single" | "three_card" | "celtic_cross"
├── question: string
├── cards: [ { id, name, position, reversed } ]
├── interpretation: string
├── createdAt: timestamp

numerology/{numId}
├── userId: string
├── fullName: string
├── birthDate: string
├── numbers: {
│     destiny: number
│     expression: number
│     motivation: number
│     impression: number
│     personalYear: number
│     karmicLessons: number[]
│   }
├── interpretation: string
├── createdAt: timestamp

horoscopes/{date}_{sign}
├── sign: string
├── date: string
├── daily: string
├── weekly?: string
├── monthly?: string
├── transits: [ { planet, aspect, description } ]
├── generatedAt: timestamp
```

---

## 4. Planos de Assinatura

### 4.1 Modelo de Precificação

| Feature | 🆓 Free | ⭐ Pro (R$14,90/mês) | 👑 Premium (R$29,90/mês) |
|---------|---------|---------------------|--------------------------|
| Mapa Astral (resumo) | ✅ | ✅ | ✅ |
| Mapa Astral (completo + PDF) | ❌ | ✅ | ✅ |
| Sinastria | 1x total | Ilimitadas | Ilimitadas + PDF |
| Tarô | 1 tiragem/dia | Ilimitadas | Ilimitadas + Cruz Celta |
| Horóscopo Diário | ✅ Genérico | ✅ Personalizado | ✅ Personalizado |
| Horóscopo Semanal/Mensal | ❌ | ✅ | ✅ |
| Numerologia | Resumo | Completo | Completo + Cabala |
| Mapa Cabalístico | ❌ | ❌ | ✅ |
| Trânsitos & Alertas | ❌ | Básico | Completo + Push |
| Revolução Solar | ❌ | ❌ | ✅ |
| Remover Anúncios | ❌ | ✅ | ✅ |
| Suporte Prioritário | ❌ | ❌ | ✅ |

### 4.2 Micro-pagamentos (Avulso)
- Relatório Sinastria PDF Premium: R$9,90 (one-time)
- Mapa Astral Completo PDF: R$7,90 (one-time)
- Mapa Numerológico + Cabalístico PDF: R$12,90 (one-time)
- Consulta Tarô 10 cartas (Cruz Celta): R$4,90 (one-time)

---

## 5. Integrações com o Ecossistema Cocreator

### 5.1 Sub-app do Paulistana BI
O app de signos funciona como módulo independente mas integrado:

```
┌───────────────────────────────────────┐
│         Paulistana BI (Dashboard)      │
│  painel.paulistanaemporio.com          │
│                                        │
│  ┌─────────┐  ┌─────────┐  ┌────────┐│
│  │ Conteúdo │  │ ML Spy  │  │Signos  ││
│  │ Studio   │  │         │  │App 🔮  ││
│  └─────────┘  └─────────┘  └────────┘│
└───────────────────────────────────────┘
         │                        │
         ▼                        ▼
  Supabase (posts, contas)   Firebase (users, charts)
```

### 5.2 Pontos de Integração
1. **Conteúdo → App**: Posts da Novela dos Signos no IG linkam para o app
2. **App → Conteúdo**: Mapas compartilháveis geram tráfego orgânico
3. **Dashboard Métricas**: Widget no Paulistana BI mostrando assinantes, revenue, churn
4. **Bot DM**: O bot do Instagram (@codigodossignos) pode recomendar o app e redirecionar para sinastria/mapa

### 5.3 Independência
O app deve ser **100% funcional** sem o Paulistana BI:
- Domínio próprio: `signos.codigodossignos.com.br` ou `app.codigodossignos.com.br`
- Firebase Hosting com CDN
- Auth independente (Firebase Auth)
- Database independente (Firestore)

---

## 6. APIs Externas

| API | Uso | Custo Estimado |
|-----|-----|----------------|
| Swiss Ephemeris (WASM) | Cálculos astronômicos | Gratuito (AGPL) — via WASM no client |
| Google Gemini 2.5 Flash | Interpretações IA | ~$0.002/request (≈R$0.01) |
| OpenAI GPT-4o (fallback) | Interpretações complexas | ~$0.01/request (≈R$0.05) |
| Stripe | Pagamentos | 2.9% + R$0.50/transação |
| Google Timezone API | Fuso horário por coordenadas | 200 req/dia free |
| OpenCage / Google Maps | Geocoding (cidade → lat/lng) | 2.5k req/dia free |
| Firebase | Auth, Firestore, Functions, Hosting | Spark free / Blaze pay-as-you-go |

---

## 7. Design & UX

### 7.1 Temas Visuais
- **Cosmic Dark** (padrão): Background escuro (#0A0A1A) com gradientes violeta/indigo e estrelas animadas
- **Celestial Light**: Tom dourado/creme para uso diurno
- **Mystic Purple**: Roxo profundo para leituras de tarô

### 7.2 Princípios de Design
1. **Mobile-First PWA**: Design otimizado para tela de celular (BottomNav, gestos swipe)
2. **Micro-animações**: Estrelas, partículas, rotação de planetas, flip de cartas
3. **Gamificação**: Streaks diários, badges por signo, ranking de compatibilidade
4. **Compartilhável**: Cards de resultado otimizados para Instagram Stories (1080x1920)
5. **Acessibilidade**: Alto contraste, tamanhos de texto ajustáveis

### 7.3 Paleta de Cores (Cosmic Dark)

| Elemento | Cor | Hex |
|----------|-----|-----|
| Background | Deep Space | `#0A0A1A` |
| Surface | Nebula | `#12122B` |
| Primary | Cosmic Purple | `#7C3AED` |
| Secondary | Mystic Pink | `#EC4899` |
| Accent | Starlight Gold | `#F59E0B` |
| Text | Moonlight | `#E2E8F0` |
| Success | Aurora Green | `#10B981` |

---

## 8. Roadmap de Desenvolvimento

### Fase 1 — MVP (4 semanas)
> Objetivo: App funcional com Mapa Astral + Sinastria + Horóscopo

- [ ] Setup projeto (Vite + React + TS + Tailwind + Firebase)
- [ ] Firebase Auth (Google + Email)
- [ ] Swiss Ephemeris WASM integration
- [ ] Formulário de dados de nascimento (com autocomplete de cidade)
- [ ] Cálculo de Mapa Astral (planetas, casas, aspectos)
- [ ] Renderização SVG do mapa natal (wheel)
- [ ] Interpretação IA via Gemini
- [ ] Sinastria (input dual + score + análise)
- [ ] Horóscopo diário (Cloud Function cron)
- [ ] Landing page + Onboarding flow
- [ ] Deploy Firebase Hosting

### Fase 2 — Monetização (2 semanas)
> Objetivo: Stripe integrado + planos de assinatura

- [ ] Stripe Checkout integration
- [ ] Customer Portal (gerenciar assinatura)
- [ ] Paywall component (PaywallGate)
- [ ] 3 planos: Free / Pro / Premium
- [ ] Micro-pagamentos (relatórios avulsos)
- [ ] PDF export (mapa astral + sinastria)
- [ ] Firebase Extension "Run Payments with Stripe"

### Fase 3 — Engagement (3 semanas)
> Objetivo: Tarô + Numerologia + Gamificação

- [ ] Tarô: 78 cartas (arte + metadados)
- [ ] Tiragens interativas com animação 3D flip
- [ ] Interpretação Tarô via IA
- [ ] Mapa Numerológico completo
- [ ] Mapa Cabalístico (Árvore da Vida)
- [ ] Push notifications (horóscopo matinal)
- [ ] Gamificação (streaks, badges)
- [ ] Share cards para Instagram Stories

### Fase 4 — Growth (contínuo)
> Objetivo: Escala e integração com ecossistema

- [ ] Trânsitos & Alertas em tempo real
- [ ] Revolução Solar
- [ ] SEO + Blog astrológico (conteúdo orgânico)
- [ ] A/B testing de preços
- [ ] Widget no Paulistana BI (métricas de assinantes)
- [ ] Integração com bot do Instagram
- [ ] App nativo (React Native / Capacitor) — se necessário
- [ ] Expansão: Astrologia Chinesa, Vedic

---

## 9. Instruções para Delegação (Jules)

### 9.1 Contexto para o Jules
```
Você está construindo o "Código dos Signos App" — uma plataforma SaaS de 
astrologia com React + Vite + TypeScript + Firebase.

O app deve ser:
1. PWA (Progressive Web App) installable
2. Mobile-first design com tema "Cosmic Dark"
3. Hospedado no Firebase Hosting
4. Usar Swiss Ephemeris (WASM) para cálculos astronômicos no client-side
5. Usar Gemini 2.5 Flash para interpretações de IA
6. Stripe para pagamentos (Firebase Extension)

Comece pela Fase 1 (MVP): Mapa Astral + Sinastria + Horóscopo.
Siga a estrutura de pastas e modelo de dados deste documento.
```

### 9.2 Repositório
- **Nome**: `codigo-dos-signos-app`
- **GitHub**: Criar em `github.com/s1d40/codigo-dos-signos-app`
- **Branch principal**: `main`
- **Deploy**: Firebase Hosting via GitHub Actions

### 9.3 Variáveis de Ambiente Necessárias
```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=cocreator-470801
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AI
GEMINI_API_KEY=
OPENAI_API_KEY=

# Geocoding
GOOGLE_MAPS_API_KEY=
```

---

## 10. Estimativas de Custo Mensal (Projeção)

### Com 1.000 usuários ativos (10% pagantes = 100 assinantes)

| Item | Custo |
|------|-------|
| Firebase (Blaze) | ~R$50/mês |
| Gemini API (5k req/mês) | ~R$50/mês |
| Stripe (taxas) | ~R$200/mês |
| Domínio + SSL | ~R$0 (Firebase free) |
| **Total** | **~R$300/mês** |
| **Receita (100 × R$14,90)** | **R$1.490/mês** |
| **Margem** | **~R$1.190/mês (80%)** |

### Projeção de Escala (12 meses)

| Mês | Usuários | Assinantes | MRR |
|-----|----------|-----------|-----|
| 1 | 500 | 25 | R$372 |
| 3 | 2.000 | 150 | R$2.235 |
| 6 | 8.000 | 600 | R$8.940 |
| 12 | 25.000 | 2.000 | R$29.800 |
