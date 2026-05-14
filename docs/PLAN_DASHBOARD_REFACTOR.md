# Plano de Refatoração: Sessões de System Message e Presets de Conteúdo

Este documento detalha as etapas para implementar a gestão de "Sessões" de System Message, criação de presets especializados por tipo de conteúdo e a organização do dashboard em abas dedicadas.

## 1. Reestruturação do Modelo de Dados (Presets)

Atualmente, o preset possui um campo único `systemMessage`. Vamos fragmentá-lo em "Sessões" para facilitar a edição modular e proteger instruções críticas.

### Nova Estrutura da Interface `Preset`:
```typescript
export interface SystemMessageSession {
  id: string;
  title: string;
  content: string;
  isEditable: boolean;
  isEssential: boolean; // Instruções que o usuário comum não deve alterar (ex: ferramentas)
}

export interface Preset {
  id: string;
  name: string;
  type: 'video' | 'carrossel' | 'blog' | 'general';
  description: string;
  sessions: SystemMessageSession[];
  prompt: string; // Instrução específica (user prompt base)
  createdAt: string;
  updatedAt: string;
}
```

### Sessões Padrão Propostas:
- **Base (Essencial):** Regras de ferramentas (`Post_Init`, `Generate_Content`), compliance de saúde e restrições de marca.
- **Persona (Editável):** Definição de quem é o agente (ex: Gestor de Conteúdo, Storyteller).
- **Estética e Visual (Editável):** Regras de prompts de imagem, proporção (9:16), iluminação e estilos.
- **CTA (Editável):** A chamada de ação específica para a plataforma e objetivo.

## 2. Refatoração do Gestor de Presets (UI)

- **Editor de Sessões:** Em vez de um `textarea` gigante, o `PresetsPage` mostrará uma lista de cards/blocos para cada sessão.
- **Bloqueio de Edição:** Sessões marcadas como `isEssential` terão o editor desabilitado por padrão (com um botão de "Destravar" para usuários avançados).
- **Destaque para CTA:** Uma área de edição proeminente para o Call to Action.
- **Seletor de Tipo:** Campo para definir se o preset é para Vídeo, Carrossel ou Blog.

## 3. Implementação de Presets Iniciais (Roteirista)

Baseado no documento `exemplos-system-message.md`, criaremos os seguintes presets pré-configurados:

1.  **Vídeo Informativo TikTok:** Foco em educação, história e nutrição.
2.  **TikTok Shop (Conversão):** Foco em desejo sensorial, food porn e venda direta.
3.  **Carrossel Viral (Instagram):** Foco em retenção visual e design editorial.
4.  **Blog Post SEO:** (Novo) Foco em estrutura de artigo, H1-H3, densidade de palavras-chave e conversão em texto.

## 4. Abas Dedicadas por Tipo de Conteúdo

Na página de Gestão de Conteúdo (`/conteudo`), implementaremos abas para filtrar a visualização:

- **Aba "Vídeos":** Filtra posts com `tipo_post` contendo "Video" ou "TikTok".
- **Aba "Carrosséis":** Filtra posts com `tipo_post` "Carrossel".
- **Aba "Blog":** Filtra posts de blog.

Cada aba terá um botão "Criar Novo [Tipo]" que redirecionará para o Chat já com o preset correto ativo.

## 5. Integração com `post_init`

- Garantir que a sessão **Essencial** contenha as instruções exatas de como o agente deve chamar o `Post_Init`.
- O agente deve ser instruído a consolidar todas as sessões em sua memória de sistema antes de iniciar a tarefa.

## 6. Backup e Sincronização de Dados

- Criar um script `backup_sheets.py` que:
    1. Lê as abas `DB_Produtos_Paulistana`, `Clientes` e `Contas` via Google Sheets API.
    2. Salva em CSVs locais na pasta `/local_storage/backup/`.
    3. Permite o desenvolvimento offline ou recuperação rápida.

---

## Status da Implementação

1.  **[x]** Atualizar `presetStore.ts` com a nova interface e dados iniciais.
2.  **[x]** Modificar `PresetsPage` para suportar a edição de sessões.
3.  **[x]** Criar os 4 presets baseados nos exemplos.
4.  **[x]** Implementar as abas na página de Conteúdo.
5.  **[x]** Criar o script de backup de tabelas (`scripts/backup_sheets.py`).
6.  **[x]** Integração do Chat com os novos Presets e Sessões.

## Resumo das Mudanças

- **Sessions:** O System Message agora é dividido em sessões (Essencial, Persona, Estética, CTA). Isso protege as regras do sistema enquanto permite editar facilmente o Call to Action.
- **Presets Especializados:** Adicionados presets de fábrica para TikTok Informativo, TikTok Shop, Carrosséis e Blog Posts.
- **Navegação por Abas:** A tela de gestão de conteúdo agora possui abas para filtrar por Vídeos, Carrosséis e Blog, facilitando a organização por tipo de mídia composta.
- **Backup Local:** Dados críticos do Google Sheets agora podem ser salvos localmente em `/local_storage/backup/` para segurança e desenvolvimento.
