# Configuração da Ferramenta: Definir_Metadados_Post

Este documento contém os dados necessários para configurar a ferramenta no Agente Arquiteto (n8n).

## 1. Exemplo de Input (JSON Example)
*No n8n, use este exemplo para que o Agente identifique os campos automaticamente.*

```json
{
  "id_post": "eecfde41-6505-40be-99cc-1d5b7670b6d9",
  "titulo": "O Segredo das Galinhas na Horta Orgânica",
  "tema": "Galinhas e Horta Orgânica",
  "captions": "Você sabia que as galinhas podem ser suas melhores aliadas na horta? 🐔🌿 Elas controlam pragas e adubam o solo de forma natural!",
  "hashtags": "#hortaorganica #galinhas #sustentabilidade #vidasimples"
}
```

## 2. Descrição da Ferramenta para o n8n
*Use este texto na descrição da ferramenta no Agente:*
> "Atualiza o título, tema, a legenda (captions) e as hashtags do post no banco de dados. Deve ser chamada assim que o objetivo do vídeo for definido na conversa."

## 3. SQL Query (Supabase/Postgres)
*Use este comando no nó de banco de dados do n8n para atualizar o post.*

```sql
UPDATE posts 
SET 
    titulo_post = '{{ $json.titulo }}', 
    tema_post = '{{ $json.tema }}', 
    captions = '{{ $json.captions }}',
    hashtags = '{{ $json.hashtags }}'
WHERE 
    id_post = '{{ $json.id_post }}';
```

---

### Benefícios:
- **Download Inteligente:** O arquivo MP4 final poderá usar o `titulo_post` como nome de arquivo.
- **Identidade Visual:** O Dashboard exibirá nomes reais dos posts em vez de IDs genéricos.
- **Copywriting e SEO:** A legenda e as hashtags já estarão prontas no banco de dados assim que a conversa com o Arquiteto/Roteirista terminar.

