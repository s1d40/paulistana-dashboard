import { NextResponse } from 'next/server';
import { fetchProducts } from '@/services/supabase-service';

export const maxDuration = 60; // Aumentado para dar tempo do n8n acionar tools

export async function POST(req: Request) {
  try {
    const { 
      messages, 
      track, 
      active_preset_id, 
      current_sessions, 
      session_id,
      prompt, // Scriptwriter Global Prompt
      model,  // Scriptwriter Model
      temperature,
      architect_model, // Novo: Modelo do Arquiteto (UI Sidebar)
      architect_prompt, // Novo: DNA do Arquiteto (UI Sidebar)
      use_real_products // Novo: Flag para usar slugs de produtos reais
    } = await req.json();

    // 0. FETCH PRODUCTS IF NEEDED
    let productsContext = '';
    if (use_real_products) {
      const products = await fetchProducts();
      productsContext = [
        `## BANCO DE PRODUTOS (REFERÊNCIAS REAIS)`,
        `Você tem acesso aos slugs das embalagens e imagens reais dos produtos.`,
        `Ao configurar as cenas, se 'Produtos Reais' estiver ativo, você DEVE instruir o Roteirista a usar o campo 'slug_produto'.`,
        `---`,
        ...products.map(p => `- PRODUTO: ${p.Produto} | SLUG: ${p.slug_embalagem}`)
      ].join('\n');
    }

    // URL do seu novo Worker_Director no n8n (Agente Arquiteto)
    const N8N_DIRECTOR_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/3a3f27a3-75a4-4b48-b961-945eda83539d';

    // 1. DEFINIR A IDENTIDADE DO ARQUITETO (Priorizar o que vem da Sidebar)
    const architectIdentity = architect_prompt || `
# IDENTIDADE TÉCNICA
Você é um Agente de Configuração. Seu objetivo é coletar requisitos e atualizar os campos técnicos via ferramentas.

[ESPECIFICAÇÕES OBRIGATÓRIAS]
ID DA CONFIGURAÇÃO (PK): ${active_preset_id}

[SUAS FERRAMENTAS]
1. 'Atualizar_Card': Para atualizar o texto/conteúdo de uma sessão (card) JÁ EXISTENTE na Bancada de Trabalho.
2. 'Ajustar_Parametros_Globais': Para modelo de IA e temperatura.
3. 'Salvar_Novo_Preset': Para criar templates.
4. 'Gerenciar_Sessoes_Customizadas': Para CRIAR novas sessões/cards ou remover sessões existentes.

[FLUXO E ORDEM DE EXECUÇÃO DAS FERRAMENTAS]
É crucial que você siga a ordem lógica correta ao atender o usuário:
- Se o usuário pedir para alterar ou preencher algo que JÁ EXISTE nas sessões da Bancada de Trabalho: Use 'Atualizar_Card' diretamente.
- Se o usuário pedir algo NOVO que NÃO ESTÁ PRESENTE nas sessões atuais (ex: "adicione uma CTA", "crie uma aba de restrições"):
  1º. Use a ferramenta 'Gerenciar_Sessoes_Customizadas' (ação 'create') para CRIAR a nova sessão.
  2º. DEPOIS de criar a sessão, use a ferramenta 'Atualizar_Card' para povoar a sessão recém-criada com as informações corretas.

[REGRAS]
- Proibido gerar roteiros ou JSON no chat.
- Execute a ferramenta assim que decidir um parâmetro.
- Utilize o UUID ${active_preset_id} em todas as chamadas.
    `.trim();

    interface Session {
      id: string;
      title: string;
      content: string | null;
    }

    // 2. ESTADO ATUAL DO TRABALHO (VIRTUAL WORKBENCH)
    // Filtramos cards técnicos para não confundir o Arquiteto
    const strategicSessions = (current_sessions as Session[]).filter((s) => 
      !['template', 'framework'].includes(s.id)
    );

const cockpitPreview = [
  `# BANCADA DE TRABALHO (ESTRATÉGIA)`,
  `AVISO: Você é o Arquiteto. Sua única forma de resposta permitida é TEXTO SIMPLES.`,
  `Nunca use blocos de código JSON na sua resposta ao usuário.`,
  `---`,
  `## DIRETRIZES DE PRODUÇÃO ATUAIS:`,
  ...strategicSessions.map((s) => `### CARD: ${s.title.toUpperCase()} (ID: ${s.id})\nCONTEÚDO: ${s.content || '(Vazio - Use update_session para preencher)'}`),
  productsContext
].join('\n\n');

    // 3. MERGE FINAL MASTIGADO
    const fullSystemMessage = `${architectIdentity}\n\n${cockpitPreview}`;

    // 4. Preparar o pacote de configuração completo para o n8n
    const agentConfig = {
      id_post: session_id,
      active_preset_id: active_preset_id,
      architect_model: architect_model || 'models/gemini-3.1-pro-preview',
      scriptwriter_config: {
        model: model || 'gpt-5.4',
        temperature: temperature ?? 0.7,
        global_prompt: prompt,
        use_real_products: !!use_real_products
      },
      track: track,
      sessions_snapshot: current_sessions
    };

    const response = await fetch(N8N_DIRECTOR_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify({
        message: messages[messages.length - 1].content,
        history: messages.slice(0, -1),
        session_id: session_id,
        id_post: session_id,
        // Enviar o modelo do arquiteto para o n8n mapear no nó da IA
        model: architect_model || 'models/gemini-3.1-pro-preview', 
        system_message: fullSystemMessage, 
        agent_config: agentConfig,
        system_context: {
          id_post: session_id,
          active_preset_id: active_preset_id,
          track: track,
          instructions: `[SISTEMA: Você é o Arquiteto. Sua missão é povoar o Cockpit acima. ID do Preset: ${active_preset_id}]`
        }
      }),
    });


    if (!response.ok) {
      throw new Error('Falha na comunicação com o Cocreator Intelligence no n8n.');
    }

    const data = await response.json();
    console.log('[Director API] n8n Response:', JSON.stringify(data, null, 2));

    // Se o n8n retornar um roteiro (identificado pela presença de 'tipo_post')
    if (data.tipo_post) {
      return NextResponse.json({ 
        tool_call: 'generate_script', 
        script: data 
      });
    }

    // Caso contrário, retorna a mensagem de texto normal do chat
    return NextResponse.json({ 
      role: 'assistant', 
      content: data.output || data.message || 'Desculpe, não consegui processar sua solicitação.' 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Chat Director Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
