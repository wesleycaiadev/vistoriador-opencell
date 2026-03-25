# Vistoriador Opencell - MSCAJU Smart Center 🚀

Um sistema moderno, rápido e focado em UX (User Experience) desenvolvido para otimizar o processo de vistoria e controle de painéis Opencell em laboratórios e assistências técnicas.

Com a identidade premium **MSCAJU Smart Center**, esta ferramenta foi projetada para substituir planilhas soltas e complexas por uma interface iterativa (Single Page Application) focada em gestão inteligente de dados, permitindo cadastro, visualização em tempo real e exportação de relatórios.
## ✨ Principais Funcionalidades

### 📋 Registro e Controle
- **Ficha Técnica Completa:** Cadastro do "Part Number / Modelo", "Ordem de Serviço (O.S)", "Técnico Responsável", "Data" e "Classificação".
- **Sistema de Status:** Classificação visual automática (`USADO COM SUCESSO`, `VISTORIA (VOLTOU DE ROTA)`, `DEFEITO DE FÁBRICA`).
- **Prevenção de Erros:** Bloqueio e alerta visual ao tentar cadastrar uma mesma O.S duplicada.

### 📊 Inteligência & Analytics (Dashboard)
- **Métricas ao Vivo:** Cartões superiores que contabilizam automaticamente o volume total de entradas, índice de sucessos e falhas.
- **Gráficos de Tendência:** Gráfico de barras rankeando os "Top 5 Modelos" mais movimentados no laboratório.
- **Tabela Interativa:** Feed cronológico com filtro de status, além de botões interativos para **Editar** ou **Deletar** registros com erros. Paginação otimizada.

### 🔄 Integração com Excel
- **Exportação (Download Mestre):** Geração automática de relatórios `.xlsx` em 1 clique, com largura de colunas otimizada, cabeçalhos na cor corporativa (Azul Samsung) e formatação de texto.
- **Importação Direta:** Possibilidade de subir uma planilha Excel legada para o sistema e ter os gráficos desenhados retroativamente em segundos.

### 🎓 Tutorial de Onboarding
- Os usuários novatos que acessarem pela primeira vez receberão um *Tour Interativo* guiado tela-a-tela ensinando a operabilidade básica do sistema de forma autônoma.

## 🛠️ Tecnologias Utilizadas

A aplicação foi construída visando performance local (Client-Side) usando infraestrutura moderna de Front-End:

- **ReactJS (Vite):** Biblioteca core para construção unificada de interfaces dinâmicas (SPA).
- **Lucide React:** Biblioteca oficial de ícones minimalistas.
- **Recharts:** Motor gráfico matemático usado para as estatísticas e rankings visuais.
- **React Joyride:** Responsável pelo Tooltip de Onboarding e guias de primeiros passos reais.
- **XLSX-js-style:** Processador de arrays que converte a base de dados interna direto em planilhas Microsoft Excel fortemente estilizadas.
- **Vanilla CSS:** Folhas de estilo construídas do zero utilizando *CSS Variables* focadas no *Design System Samsung* (Azuis e Cinzas Escuros), glassmorphism avançado, com sombras orgânicas e micro-interações sem depender de pesados frameworks externos.
- **LocalStorage API:** Toda a base de dados reside na memória de cache do navegador do usuário, provendo latência zero de persistência de informação.

## 📦 Como Rodar Localmente

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

1. Clone o repositório:
```bash
git clone https://github.com/wesleycaiadev/vistoriador-opencell.git
```

2. Acesse a pasta do projeto:
```bash
cd "vistoriador de opencell"
```

3. Instale as dependências:
```bash
npm install
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

5. O aplicativo ficará disponível no seu navegador em `http://localhost:5173`.

## 🏗️ Arquitetura e Design System

### Design Tokens (Fonte da Verdade)

Todos os valores visuais do projeto são controlados por **variáveis CSS semânticas** centralizadas em `src/styles/tokens.css`. Nenhuma cor, espaçamento ou borda é definida diretamente nos componentes — tudo referencia os tokens globais.

```
tokens.css
├── Cores Semânticas    → --surface-*, --text-*, --color-primary
├── Escala de Espaço    → --space-xs até --space-2xl (4px–48px)
├── Tipografia          → --font-xs até --font-3xl (12px–32px)
├── Bordas (Sharp)      → --radius-sm (2px), --radius-md (4px)
└── Sombras de Elevação → --shadow-sm, --shadow-md, --shadow-lg
```

**Por que tokens?** Garante consistência visual em toda a aplicação. Mudar o tom de uma cor primária, por exemplo, afeta automaticamente todos os botões, badges e inputs — sem buscar valores espalhados.

### Componentes UI Isolados (`src/components/ui/`)

A interface é construída com **componentes "burros"** (presentational components) que só cuidam do visual, recebendo dados via `props`:

| Componente | Variantes | Propósito |
|---|---|---|
| `<Button>` | `primary`, `secondary`, `danger`, `outline` | Ações do usuário |
| `<Badge>` | `success`, `danger`, `warning`, `info` | Status e classificações |
| `<Card>` | — | Container de elevação sólida |
| `<Input>` | — | Campo de entrada padronizado |
| `<Skeleton>` | `SkeletonCard`, `SkeletonRow` | Feedback de carregamento |

**Exemplo de uso:**
```jsx
<Badge variant="success">Aprovado</Badge>
<Button variant="danger" size="sm">Excluir</Button>
```

### Decisões Técnicas

| Decisão | Justificativa |
|---|---|
| **Sem Glassmorphism** | `backdrop-filter` em fundo sólido não produz efeito real. Substituído por elevação com cores sólidas e bordas sutis (`1px solid rgba(255,255,255,0.08)`). |
| **Border-radius Sharp (2-4px)** | Estética técnica e profissional. Evita o visual "genérico" de cantos muito arredondados. |
| **`:focus-visible`** | Acessibilidade: ring de foco aparece apenas na navegação por teclado, não no clique. |
| **Skeleton Loaders** | UX premium: blocos pulsantes no carregamento em vez de texto "Carregando...". |
| **CSS Vanilla + Tokens** | Máximo controle sem dependência de frameworks CSS externos. |

---
*Desenvolvido exclusivamente para MSCAJU Smart Center.*
