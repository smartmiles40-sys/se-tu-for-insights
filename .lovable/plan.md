

## Plano: Modulo Customer Relationship / Relacionamento

Este e um modulo grande. Vou dividir em fases para manter a qualidade e permitir testes incrementais.

---

### 1. Nova Tabela: `clientes_relacionamento`

Criar uma tabela independente para armazenar dados de clientes importados via CSV de relacionamento. Estrutura:

| Campo | Tipo | Descricao |
|---|---|---|
| id | uuid PK | Auto-gerado |
| nome_cliente | text | Nome do cliente |
| valor_total_cliente | numeric | Valor total gasto |
| quantidade_viagens | integer | Numero de viagens |
| data_primeira_viagem | date | Primeira viagem |
| data_ultima_viagem | date | Ultima viagem |
| status | text | ativo / inativo |
| segmento | text | Segmento do cliente |
| created_at / updated_at | timestamptz | Controle |
| imported_by | uuid | Quem importou |

RLS: mesmas politicas do `negocios` (authenticated pode ver, admin/gestor pode inserir/atualizar/deletar).

---

### 2. Importacao CSV de Relacionamento

- Adicionar na pagina de Importacao (`ImportPage.tsx`) um seletor ou aba para alternar entre "Comercial" e "Relacionamento"
- Criar mapeamento de colunas especifico para o CSV de relacionamento (nome_cliente, valor_total, quantidade_viagens, datas, etc.)
- Os dados vao direto para `clientes_relacionamento` (sem staging, ou com staging separada se preferir)

---

### 3. Hook `useClientesRelacionamento`

Novo hook em `src/hooks/useClientesRelacionamento.ts`:
- `useClientesRelacionamento()` - busca todos os clientes
- `useImportClientesRelacionamento()` - mutation para importar CSV
- `useClientesStats()` - calcula LTV medio, taxa recompra, ticket medio, clientes ativos/recorrentes

---

### 4. Dashboard de Relacionamento

Nova pagina `src/pages/RelacionamentoPage.tsx` com:

**KPI Cards:**
- LTV Medio (valor_total_cliente medio)
- Receita de Clientes Ativos (soma valor_total dos ativos)
- Ticket Medio por Cliente (valor_total / quantidade_viagens)
- Taxa de Recompra (clientes com quantidade_viagens > 1 / total)
- Clientes Ativos (count status = ativo)
- Clientes Recorrentes (count quantidade_viagens > 1)

**Graficos:**
- Receita por Cliente (barras horizontais, top 10-20 clientes)
- Distribuicao de Clientes (pizza: novos vs recorrentes)
- Frequencia de Viagem (histograma)

**Bloco Customer Loyalty Metrics:**
- Taxa de recompra
- Clientes com mais de 2 viagens
- Tempo medio entre viagens
- Receita media por cliente ativo

**Ranking:**
- Tabela com os clientes que mais gastaram

**Indicador "Receita de Base":**
- Receita de clientes recorrentes vs novos

---

### 5. Auto-Rotacao Comercial <-> Relacionamento

No Dashboard principal, implementar um timer de 15 segundos que alterna automaticamente entre a view Comercial e Relacionamento. Com botao para pausar/retomar e alternar manualmente.

---

### 6. Navegacao

- Adicionar link "Relacionamento" no `GlobalFilters` (barra superior) ao lado de SDRs/Especialistas/Marketing
- Rota `/relacionamento` no `App.tsx`

---

### Arquivos a criar:
- `src/hooks/useClientesRelacionamento.ts`
- `src/pages/RelacionamentoPage.tsx`
- `src/components/dashboard/RelacionamentoDashboard.tsx`
- `src/components/dashboard/ClienteRankingTable.tsx`
- `src/components/dashboard/ClienteDistributionChart.tsx`
- `src/components/dashboard/LoyaltyMetrics.tsx`

### Arquivos a modificar:
- `src/App.tsx` (nova rota)
- `src/components/dashboard/GlobalFilters.tsx` (novo link de navegacao)
- `src/pages/ImportPage.tsx` / `src/components/DataImport.tsx` (aba de importacao de relacionamento)
- `src/pages/Dashboard.tsx` (auto-rotacao entre Comercial e Relacionamento)

### Migracao SQL:
- Criar tabela `clientes_relacionamento` com RLS

---

### Ordem de implementacao:
1. Migracao da tabela
2. Hook de dados
3. Pagina de relacionamento com KPIs, graficos e ranking
4. Importacao CSV de relacionamento
5. Auto-rotacao no Dashboard
6. Navegacao

