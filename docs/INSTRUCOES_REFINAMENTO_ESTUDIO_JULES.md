# Instruções para Refinamento do Estúdio de Vídeo (Para Jules)

## Objetivo
Refinar o editor de vídeo (`dashboard/src/components/studio/video-studio.tsx` e componentes relacionados) para torná-lo mais profissional, bonito, reativo e resolver problemas de usabilidade (UX) durante o carregamento assíncrono de assets gerados pelo `worker.py`.

## Requisitos de UX/UI (Obrigatório manter todas as funcionalidades)
1. **Design Profissional e Moderno:** 
   - Melhorar a interface geral do estúdio, garantindo que se pareça com uma ferramenta de edição de vídeo premium.
   - Adicionar micro-interações, feedbacks visuais de carregamento mais suaves (skeletons ou spinners elegantes) quando uma cena estiver no status "Processando" ou "Gerando...".

2. **Reatividade e Perfomance:**
   - O player de vídeo final e a lista de cenas precisam ser altamente reativos, refletindo o status real do banco de dados (Supabase Realtime) sem "piscar" a tela.

## Bug Crítico a ser Resolvido (Prioridade Máxima)
Atualmente, existe um bug extremamente frustrante na experiência de reprodução do vídeo em andamento:
- **Problema:** Quando o player está reproduzindo a primeira cena (ou qualquer cena parcial) e o backend (worker) finaliza a renderização de um *novo asset* (por exemplo, a próxima cena) e o estúdio sincroniza via Supabase, **o player sofre um "reload"**. Isso faz com que o vídeo volte a tocar desde o começo (cena 1) e o usuário perde o contexto do que estava assistindo.
- **O que deve ser feito:**
  - O player de vídeo deve **manter o tempo atual de reprodução (`currentTime`) e o estado (`playing` / `paused`)** intactos quando a array de `scenes` ou a URL do vídeo for atualizada.
  - Se estiver usando o elemento `<video>`, armazene o tempo em um `useRef` ou estado e restaure-o silenciosamente após a atualização da fonte de vídeo para evitar reinícios abruptos.

## Padrões de Código
- Utilize Tailwind CSS.
- Mantenha a componentização modular.
- Siga as regras definidas em `docs/ROADMAP_DESENVOLVIMENTO.md` e no arquivo de regras principal do projeto.
- Faça modificações cirúrgicas (surgical edits) em vez de reescrever tudo do zero, a não ser que a refatoração seja estritamente necessária para resolver o bug de `reload` do vídeo.
