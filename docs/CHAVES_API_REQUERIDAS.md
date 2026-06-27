# 🗝️ Guia de Credenciais API - Centro de Comando Multi-Canal

Para transformarmos o seu painel em uma central de inteligência que puxa dados de todas as suas plataformas (sem custos extras de API), precisaremos das chaves de integração oficiais de cada sistema.

Abaixo está o checklist do que você precisará gerar em cada plataforma. Você pode ir me passando essas informações aos poucos, conforme for conseguindo.

---

## 1. 📊 Google Analytics 4 (GA4)
*Para puxar origem de acessos, tempo de tela e páginas mais visitadas.*

**O que precisamos:**
1. **Property ID (ID da Propriedade):** Fica nas Configurações da Propriedade (Admin) no GA4.
2. **Arquivo JSON da Conta de Serviço (Service Account):**
   - Acesse o [Google Cloud Console](https://console.cloud.google.com/).
   - Crie um projeto ou selecione um existente e ative a **Google Analytics Data API**.
   - Vá em "Credenciais" > "Criar Credenciais" > "Conta de Serviço".
   - Crie a conta, vá na aba "Chaves" (Keys), clique em "Adicionar Chave" > "JSON". Faça o download do arquivo.
3. **Permissão de Leitura:**
   - Copie o e-mail dessa Conta de Serviço criada.
   - Vá no seu Google Analytics > Administrador > Gerenciamento de Acesso.
   - Adicione este e-mail com a permissão de **Espectador** (Viewer).

---

## 2. 🛍️ Nuvemshop
*Para puxar faturamento do e-commerce, carrinhos abandonados e pedidos próprios.*

**O que precisamos:**
- **Access Token (Token de Acesso):**
  - Acesse o painel de parceiros/aplicativos da Nuvemshop ([Nuvemshop Partners](https://partners.nuvemshop.com.br/)).
  - Crie um Aplicativo Privado apontando para sua própria loja.
  - O sistema te fornecerá um **Access Token**, **Client ID** e **Client Secret**. (O Access Token e o ID da loja são os mais importantes).

---

## 3. 📱 TikTok Shop
*Para puxar vendas e performance do TikTok.*

**O que precisamos:**
- **App Key e App Secret:**
  - Acesse o [TikTok Shop Partner Center](https://partner.tiktokshop.com/).
  - Crie um aplicativo do tipo "Custom App" (Aplicativo Personalizado) para a sua própria loja.
  - Anote o `App Key` e o `App Secret`.
- **Autorização de Loja (Access Token):**
  - O Partner Center te dará um "Link de Autorização". Ao clicar nesse link, você conectará o app à sua própria loja do TikTok, gerando o **Access Token**.

---

## 4. 🛒 Shopee
*Para puxar vendas e ranqueamento de anúncios na Shopee.*

**O que precisamos:**
- **Partner ID e Partner Key:**
  - Acesse o [Shopee Open Platform](https://open.shopee.com/).
  - Cadastre-se como Desenvolvedor (Developer) e crie um Aplicativo (Console > Create App).
  - Selecione tipo "Custom App" se disponível.
  - Copie o `Partner ID` e `Partner Key`.
- **Shop ID:** O número de identificação da sua loja na Shopee.

---

## 5. 🎯 Meta Ads (Facebook & Instagram)
*Para puxar o CPA (Custo por Aquisição), CPC e gastos com anúncios.*

**O que precisamos:**
- **Ad Account ID:** O ID da sua Conta de Anúncios (ex: `act_123456789`).
- **User Access Token (Token Permanente):**
  - Acesse o [Meta for Developers](https://developers.facebook.com/).
  - Crie um aplicativo tipo "Empresa" ou "Business".
  - Adicione o produto "API de Marketing".
  - Vá no seu Gerenciador de Negócios (Business Manager) > Configurações do Negócio > Usuários do Sistema.
---

## 6. ▶️ YouTube (Google Cloud)
*Para puxar visualizações, likes e performance dos vídeos longos e Shorts.*

**O que precisamos:**
1. **API Key do Google Cloud:**
   - No mesmo projeto do Google Cloud onde ativamos o Analytics, pesquise por "YouTube Data API v3" e clique em **Ativar**.
   - Vá em "Credenciais" > "Criar Credenciais" > "Chave de API" (API Key). Copie essa chave.
2. **Channel ID (ID do Canal):**
   - Acesse o seu canal no YouTube pelo navegador.
   - O ID é aquele código que aparece na URL (ex: `youtube.com/channel/UC1234567890`) ou nas Configurações Avançadas da sua conta.

---

## 7. 📸 Instagram (Meta Graph API)
*Para puxar seguidores, alcance dos Reels e engajamento.*

**O que precisamos:**
- **Access Token (Token de Acesso do Instagram) e Instagram Account ID:**
  - Siga o mesmo passo da criação do App no Meta for Developers (do Meta Ads).
  - Adicione o produto **"Configuração da API do Instagram Graph"**.
  - O seu Instagram precisará estar vinculado a uma Página do Facebook.
  - Gere um Token de Acesso de Usuário com as permissões `instagram_basic` e `pages_read_engagement`.
  - Com o Token em mãos, faremos uma chamada rápida para descobrir o seu **Instagram Account ID**.
