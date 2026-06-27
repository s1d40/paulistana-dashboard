# Princípios de Design e Hierarquia Visual 🎨

Este guia explica como a API do Gerador de Carrossel garante resultados virais e profissionais.

## 1. Hierarquia Tipográfica (AIDA Framework)

A API automatiza o contraste e o impacto visual:

- **Headline (Título)**: Renderizada em **80px** com peso **Black (800)**. O `lineHeight` é comprimido (1.1) para garantir que o título se destaque instantaneamente.
- **SubHeadline**: Renderizada em **32px** (400 weight). A API aplica automaticamente 80% de opacidade (`rgba(255, 255, 255, 0.8)`) para criar profundidade e não competir com o título principal.

## 2. Sistema de Películas (Contrast Overlays)

Para que o texto nunca desapareça em fundos claros ou complexos:

- **Bottom-Gradient (Padrão)**: Cria uma sombra densa na base da imagem (onde o texto fica posicionado). Diferente de gradientes simples, usamos múltiplos stops de cor (`1.0` ➔ `0.95` ➔ `0.7` ➔ `0`) para garantir um preto sólido na base e uma transição cinematográfica.
- **Full-Dark**: Escurece toda a imagem uniformemente, ideal para estilos "Minimalist Dark Mode".

## 3. Ancoragem Magnética (Bottom Align)

O layout Flexbox é parametrizado para forçar o texto a "sentar" na base da imagem:
- **`justifyContent: flex-end`**: Garante que o texto se alinhe à margem inferior.
- **`flexGrow: 1`**: Permite que o contêiner de texto ocupe toda a área vertical, exercendo "gravidade" sobre os elementos.
- **Padding**: Mantemos `40px` de respiro na base e `60px` nas laterais para um visual limpo e moderno.

## 4. Tipos de Fontes Suportadas
Utilizamos a família **Inter** (Regular e Bold Black), carregada e armazenada em cache binário para performance extrema (<100ms após o primeiro carregamento).
