# Referência de API: Generating Slide 🚀

Este documento descreve detalhadamente o funcionamento do endpoint principal para geração de imagens.

## 1. POST /api/v1/generate-slide

Gera uma imagem PNG de alta resolução (1080x1350) com um layout otimizado para carrosséis.

### Cabeçalhos (Headers)
- `Content-Type: application/json`

### Estrutura do Payload (Request Body)

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `backgroundImageUrl` | string (url) | Sim | URL da imagem de fundo. |
| `content` | Object | Sim | Objeto contendo os textos do slide. |
| `content.headline` | string | Sim | Título principal (80px Bold). |
| `content.subHeadline` | string | Não | Subtítulo ou corpo de texto (32px). |
| `theme` | Object | Não | Configurações de cores (padrão #FFFFFF). |
| `overlay` | Object | Não | Configurações de película de contraste. |
| `overlay.enabled` | boolean | Não | Habilita ou desabilita o overlay (padrão: false). |
| `overlay.type` | string | Não | Enum: `bottom-gradient` ou `full-dark`. |
| `overlay.height` | string | Não | Altura do gradiente (ex: "75%", "100%"). |
| `overlay.opacity` | number | Não | Nível de transparência (0.0 a 1.0). |

### Exemplo de Chamada (cURL)

```bash
curl -X POST http://localhost:3000/api/v1/generate-slide \
-H "Content-Type: application/json" \
-d '{
  "backgroundImageUrl": "https://example.com/hero.jpg",
  "content": {
    "headline": "O segredo do Design Viragem",
    "subHeadline": "Contraste denso e tipografia de alto impacto."
  },
  "overlay": {
    "enabled": true,
    "type": "bottom-gradient",
    "opacity": 0.95
  }
}' --output slide-resultado.png
```

### Respostas (Responses)

- **200 OK**: Retorna o binário da imagem PNG. `Content-Type: image/png`.
- **400 Bad Request**: Erro de validação de payload (JSON inválido ou campos ausentes).
- **500 Internal Server Error**: Erro inesperado durante o processamento da imagem ou fonte.
