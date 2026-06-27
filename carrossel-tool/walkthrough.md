# Relatório Técnico: Microsserviço de Geração de Carrosséis

## Objetivo Alcançado
Desenvolvemos um microsserviço local (API REST) capaz de gerar slides de carrossel de forma determinística e com alta fidelidade tipográfica. O projeto foi construído para atuar em um modelo de **Separação de Interesses (Separation of Concerns)**: ele recebe uma URL de imagem de fundo (gerada de forma independente via IA generativa) e aplica o texto dinâmico sobre essa imagem através de diagramação baseada em Flexbox. 

Isso resolve o problema crônico de "alucinação tipográfica" (textos borrados, errados ou mal formatados) gerados por inteligências artificiais de imagem.

## Stack Tecnológico Utilizado
- **Node.js (v20+)**: Ambiente de execução rápido e eficiente.
- **TypeScript**: Tipagem forte para maior segurança e prevenção de erros em tempo de desenvolvimento.
- **Express**: Framework web minimalista para levantamento do servidor HTTP e da rota da API.
- **Zod**: Biblioteca de validação de schemas rígida. Usada para testar a entrada (payload JSON) e garantir que URLs sejam válidas, e as cores de texto respeitem o formato hexadecimal válido (ex: `#FFFFFF`).
- **Axios**: Cliente HTTP para baixar tanto a imagem de fundo via base64, quanto os dados binários das fontes Customizadas.
- **Satori (por Vercel)**: Engine assombrosamente rápida de renderização de JSX/HTML+CSS para a especificação SVG. Suporta a conversão de layouts Flexbox, fontes externas, quebras de linha paramétricas e estilizadores avançados diretamente num SVG.
- **@resvg/resvg-js**: Motor de renderização de alto desempenho em Rust e C. Converte o vetor SVG gigantesco devolvido pelo Satori para um binário de imagem `.PNG` comprimido de excelente nitidez.

## Detalhes da Implementação

### 1. Endpoint Principal e Payload
Foi criada a rota `POST /api/v1/generate-slide` que recebe um payload JSON como:
```json
{
  "backgroundImageUrl": "https://url...",
  "text": "Conteúdo...",
  "theme": { "textColor": "#FFF", "fontSize": "48px" }
}
```

### 2. Validação Robusta com `zod`
Antes de processar qualquer imagem, o `Express` passa os dados pelo `Zod`. Qualquer falha estrutural, string vazia no lugar de URL ou formatação incorreta das cores, retorna de imediato um JSON de erro `HTTP 400`, protegendo a lógica de conversão visual de parâmetros nulos.

### 3. Font Caching & Performance
Baixar arquivos customizados de fontes (ex: a fonte *Inter* no formato `.woff`) a cada requisição tornaria o endpoint lento. O sistema mitiga isso usando o conceito de **In-Memory Cache**. O microsserviço verifica se já existe o Buffer binário da fonte; se sim, reaproveita. A requisição HTTP externa para o CDN de fontes (`jsDelivr`) ocorre apenas na **primeira execução do servidor**, cortando drásticos 300ms a 500ms dos tempos de requisições seguintes.

### 4. Engine Dual de Renderização
O Satori requer tipicamente React elements, mas o código contornou esse overhead arquitetural injetando diretamente uma Árvore de Objetos Nativos JavaScript similar à estrutura do Document Object Model (DOM). 
- A imagem de fundo é posicionada como plano de fundo (`img absolute`).
- O texto e seus contêineres rodam com Flexbox absoluto (`display: flex`, `flexDirection: column`, `alignItems: center`) para centralização automática.
- Após o output vetorial SVG gerado pelo Satori fluir em memória, é instantaneamente comutado para um Buffer PNG em alta definição pela engine `Resvg`.

### 5. Resolução de Falhas
Durante a versão preliminar, o endpoint crachava com erro em tela pois o link original do repositório *Google Fonts/GitHub* rejeitava ou rate-limitava chamadas via Axios consecutivas. A falha foi depurada substituindo o source para um CDN mais robusto da biblioteca NPM dinamicamente exposta no formato WOFF, mitigando falsos-negativos.

## Sugestões Futuras (Aprimoramentos)
Este projeto base abre vastos precedentes e pode ser evoluído das seguintes formas:

- **Múltiplos Slides Simultâneos:** Capacitar um endpoint em `/api/v1/generate-carousel` que aceite uma `array` gigantesca de payloads e renderize todos em paralelo usando `Promise.all`, devolvendo um ZIP da apresentação inteira pronta para upar no LinkedIn.
- **Watermarking e Branded Logos:** Sistema que sempre afixa dinamicamente num canto a logo da pessoa e o @ do Instagram, utilizando posicionamento dinâmico sem tocar no peso da IA generativa de fundo.
- **Gradient Overlays:** O satori suporta gradientes de cores (linear-gradients). Isso possibilitaria injetar uma película preta suave (<10% de alfa) no rodapé ou atrás dos textos antes de jogar o conteúdo real ali, garantindo muito mais legibilidade quando o gerador de imagem gerar fundos muito poluídos.
- **Containerização:** Encapar o ecossistema com um `Dockerfile` para deployment massivo em clouds como Google Cloud Run ou AWS ECS.
