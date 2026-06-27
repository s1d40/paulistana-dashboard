# Carousel Generation Microservice 🎨

Bem-vindo à documentação oficial do nosso microsserviço de automação de imagens para redes sociais.

## Missão do Projeto
Este projeto foi concebido para resolver o problema de **alucinação tipográfica** em IAs generativas de imagem. Ao separar a criação visual do fundo da renderização textual, garantimos precisão absoluta e design de alta autoridade para carrosséis de LinkedIn e Instagram.

## Core Stack
- **Node.js + TypeScript**: Performance e segurança.
- **Satori**: Renderização de HTML/CSS para SVG.
- **@resvg/resvg-js**: Conversão de SVG para PNG ultra-nítido.
- **Zod**: Validação rigorosa dos dados de entrada.

## Estrutura da Documentação
- [**Referência de API**](./api/v1/generate-slide.md): Documentação detalhada dos endpoints.
- [**Design System**](./concepts/design-system.md): Entenda como as fontes, cores e películas (overlays) funcionam.

## Primeiros Passos
Para rodar o projeto localmente:
1. `npm install`
2. `npm run dev`

A API estará disponível por padrão em `http://localhost:3000`.
