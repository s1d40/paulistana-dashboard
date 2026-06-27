# Plano de Implementação: Layout Flexível e Paleta Golden Hour no Monitor de Produção

Este plano descreve as melhorias estéticas e de usabilidade para a página de **Produção em Massa** (`/production`), permitindo redimensionamento dinâmico das divisões laterais, colapso completo do painel de Chat/Catálogo e a adoção de um design com a paleta de cores quentes e suaves de fim de tarde/amanhecer (*Golden Hour*).

## Requisitos e Contexto

- **Fila em Execução**: Conforme solicitado, as alterações devem ser planejadas e revisadas **sem alterar os arquivos ativos neste momento**, garantindo que a fila atual de vídeos não seja interrompida.
- **Redimensionamento Manual**: O controle de redimensionamento horizontal será implementado nativamente em React (usando eventos de mouse do navegador), o que evita a necessidade de instalar pacotes npm externos pesados.

---

## Proposta de Mudanças

### 1. Sistema de Layout Flexível (Drag-Resizer & Collapsible)

#### Estado e Eventos do Mouse
Adicionaremos estados locais no início do componente em `dashboard/src/app/production/page.tsx` para gerenciar a largura do painel esquerdo e se o painel da direita está recolhido:
```tsx
const [leftPanelWidth, setLeftPanelWidth] = useState(450); // largura em pixels
const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
const [isDragging, setIsDragging] = useState(false);
```

#### Hook de Arrastar (MouseMove / MouseUp)
Implementaremos um fluxo de escuta nativo nas bordas que altera a largura dinamicamente à medida que o usuário move o cursor:
```tsx
const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
  setIsDragging(true);
  
  const startWidth = leftPanelWidth;
  const startX = mouseDownEvent.clientX;

  const doDrag = (mouseMoveEvent: MouseEvent) => {
    const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
    // Limites de segurança da tela
    if (newWidth > 320 && newWidth < window.innerWidth - 320) {
      setLeftPanelWidth(newWidth);
    }
  };

  const stopDrag = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
}, [leftPanelWidth]);
```

#### Divisão de Tela
Substituiremos a estrutura de classes estáticas por estilos Inline controlados pelos estados dinâmicos:
* **Painel Esquerdo (Monitor)**: `style={{ width: isRightPanelCollapsed ? '100%' : `${leftPanelWidth}px` }}`
* **Divisor Vertical (Handler)**: Um divisor de `4px` com efeito hover que atua como gatilho do drag e possui um botão de colapso de clique único.
* **Painel Direito (Chat/Catálogo)**: `className={clsx("flex-1", isRightPanelCollapsed ? "hidden" : "flex")}`

---

### 2. Estética Golden Hour (Cores Quentes & Suaves)

Substituiremos as cores frias e metálicas (`bg-zinc-950`, `border-zinc-800`, `bg-indigo-600`) por tons quentes, suaves e premium que lembram a luz dourada do nascer/pôr do sol:

#### Paleta de Cores e Gradiantes
* **Fundos Quentes**: `bg-stone-950` e `bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950/20`
* **Painéis / Cards**: `bg-stone-900/60 backdrop-blur-md border-amber-950/30`
* **Destaques e Botões Principais**: `bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-stone-950 font-black`
* **Botões Secundários**: `border-amber-500/20 text-amber-500 hover:bg-amber-950/20`
* **Indicadores Ativos**: `bg-amber-500/10 text-amber-400 border-amber-500/20`
* **Efeitos de Brilho (Glows)**: Sombras suaves do tipo `shadow-[0_0_50px_rgba(245,158,11,0.05)]` para dar a sensação de calor solar nas bordas das caixas de vídeo e painéis.

---

## Plano de Verificação

### Testes Manuais de Layout
1. **Redimensionar por Drag**: Clicar na barra divisória e arrastar para a esquerda/direita. Verificar se os limites mínimos (`320px`) e máximos são respeitados.
2. **Minimizar Painel**: Clicar no botão do divisor para recolher o Chat/Catálogo. Verificar se o Monitor de Produção se expande suavemente para `100%` da largura da tela.
3. **Restaurar Painel**: Clicar no botão de expansão flutuante para restaurar o Chat/Catálogo na posição/largura anteriormente definida.

### Testes Estéticos
1. **Responsividade das Cores**: Garantir contraste ideal para leitura confortável do roteiro sob os tons quentes de dourado e stone.
2. **TypeScript**: Executar `npx tsc --noEmit` para validar que nenhuma alteração na estrutura de JSX causou inconsistência na tipagem.
