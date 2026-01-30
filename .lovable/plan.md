
## Plano: Usar Apenas `data_venda` para Identificar Vendas

### Situação Atual
O campo `venda_aprovada` está sendo usado em **10 componentes** para filtrar vendas, mas esse campo não está mais sendo preenchido corretamente no CRM. O critério correto agora é:

**Critério de Venda = `data_venda` preenchida (não nula)**

Confirmação no banco de dados:
- Total com `data_venda` no período (01-28/jan) + pipeline Comercial 1 = **36 vendas** ✓

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Linhas 154, 159, 174 |
| `src/components/dashboard/FunnelHorizontal.tsx` | Linha 50-51 |
| `src/components/dashboard/RankingTable.tsx` | Linhas 49, 82 |
| `src/components/dashboard/OrigemPerformance.tsx` | Linha 44 |
| `src/components/dashboard/AgentRevenueReport.tsx` | Linha 51 |
| `src/components/dashboard/EspecialistasPerformance.tsx` | Linha 29 |
| `src/components/dashboard/EspecialistasDashboard.tsx` | Linha 34 |
| `src/components/dashboard/SDRAnalytics.tsx` | Linha 76 |
| `src/components/dashboard/DailyRevenueChart.tsx` | Linha 51 |
| `src/components/dashboard/EspecialistasAnalytics.tsx` | Linha 55 |
| `src/components/dashboard/MarketingAnalytics.tsx` | Linha 46 |

### Alterações por Arquivo

**1. Dashboard.tsx (linhas 154, 159, 174)**
```typescript
// ANTES
const vendasNoPeriodo = negociosComercial.filter(n => n.venda_aprovada === true && isInPeriod(n.data_venda));
const todasVendasNoPeriodo = negocios.filter(n => n.venda_aprovada === true && isInPeriod(n.data_venda));
const vendasDosLeadsDoPeriodo = negocios.filter(n => n.venda_aprovada === true).length;

// DEPOIS
const vendasNoPeriodo = negociosComercial.filter(n => n.data_venda && isInPeriod(n.data_venda));
const todasVendasNoPeriodo = negocios.filter(n => n.data_venda && isInPeriod(n.data_venda));
const vendasDosLeadsDoPeriodo = negocios.filter(n => n.data_venda !== null).length;
```

**2. FunnelHorizontal.tsx (linhas 49-54)**
```typescript
// ANTES
const vendas = negociosValidos.filter(n => 
  n.venda_aprovada === true && 
  n.data_venda !== null && 
  isInPeriod(n.data_venda)
).length;

// DEPOIS
const vendas = negociosValidos.filter(n => 
  n.data_venda !== null && 
  isInPeriod(n.data_venda)
).length;
```

**3. RankingTable.tsx (linhas 49, 82)**
```typescript
// ANTES
if (n.venda_aprovada && isInPeriod(n.data_venda) && n.sdr) {...}
if (n.venda_aprovada && isInPeriod(n.data_venda)) {...}

// DEPOIS
if (n.data_venda && isInPeriod(n.data_venda) && n.sdr) {...}
if (n.data_venda && isInPeriod(n.data_venda)) {...}
```

**4. OrigemPerformance.tsx (linha 44)**
```typescript
// ANTES
if (n.venda_aprovada && isInPeriod(n.data_venda)) {...}

// DEPOIS
if (n.data_venda && isInPeriod(n.data_venda)) {...}
```

**5. AgentRevenueReport.tsx (linha 51)**
```typescript
// ANTES
(n) => ... && n.venda_aprovada && isInPeriod(n.data_venda),

// DEPOIS
(n) => ... && n.data_venda && isInPeriod(n.data_venda),
```

**6. EspecialistasPerformance.tsx (linha 29)**
```typescript
// ANTES
const vendas = vendedorNegocios.filter(n => n.venda_aprovada);

// DEPOIS
const vendas = vendedorNegocios.filter(n => n.data_venda !== null);
```

**7. EspecialistasDashboard.tsx (linha 34)**
```typescript
// ANTES
const vendas = vendedorNegocios.filter(n => n.venda_aprovada);

// DEPOIS
const vendas = vendedorNegocios.filter(n => n.data_venda !== null);
```

**8. SDRAnalytics.tsx (linha 76)**
```typescript
// ANTES
.filter(n => n.sdr === sdr && n.venda_aprovada && isInPeriod(n.data_venda))

// DEPOIS
.filter(n => n.sdr === sdr && n.data_venda && isInPeriod(n.data_venda))
```

**9. DailyRevenueChart.tsx (linha 51)**
```typescript
// ANTES
if (item.venda_aprovada && item.total) {...}

// DEPOIS
if (item.data_venda && item.total) {...}
```

**10. EspecialistasAnalytics.tsx (linha 55)**
```typescript
// ANTES
n.venda_aprovada && isInPeriod(n.data_venda)

// DEPOIS
n.data_venda && isInPeriod(n.data_venda)
```

**11. MarketingAnalytics.tsx (linha 46)**
```typescript
// ANTES
if (n.venda_aprovada) {...}

// DEPOIS
if (n.data_venda) {...}
```

### Resultado Esperado
- Dashboard principal mostrará **36 vendas** no período 01-28/jan
- Todas as métricas de vendas e faturamento serão consistentes
- O campo `venda_aprovada` não será mais usado como critério principal

### Detalhes Técnicos
A regra unificada para todas as métricas de vendas passa a ser:
- **Critério**: `data_venda !== null` (campo preenchido)
- **Período**: `data_venda` dentro do range de datas selecionado
- **Pipeline**: Comercial 1 (onde aplicável, para consistência com reuniões)
