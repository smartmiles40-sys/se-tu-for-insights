
# Plano: Filtro Interno para KPIs de Reunião

## Objetivo
Aplicar um filtro interno nos 3 KPIs (% No-Show, % Show-Up, % Conversão Vendas) para que **somente** registros com `tipo_venda` igual a "Pacotes de Viagens" ou "Expedições" entrem no cálculo.

## O que vai mudar

Atualmente, esses 3 KPIs consideram **todos** os registros. Com a nova regra:

| KPI | Antes | Depois |
|-----|-------|--------|
| % No-Show | Todos os registros com `data_noshow` | Apenas se `tipo_venda` = "Pacotes de Viagens" ou "Expedições" |
| % Show-Up | Todos os registros com `reuniao_realizada = true` | Apenas se `tipo_venda` = "Pacotes de Viagens" ou "Expedições" |
| % Conversão Vendas | Vendas / Reuniões realizadas | Apenas se `tipo_venda` = "Pacotes de Viagens" ou "Expedições" |

## Alterações Técnicas

### Arquivo: `src/pages/Dashboard.tsx`

**1. Criar helper de filtro interno (linha ~85)**

```typescript
// Filtro interno para KPIs de reunião: apenas Pacotes de Viagens e Expedições
const TIPOS_VENDA_VALIDOS = ['Pacotes de Viagens', 'Expedições'];
const isTipoVendaValido = (tipoVenda: string | null | undefined): boolean =>
  TIPOS_VENDA_VALIDOS.includes(tipoVenda || '');
```

**2. Atualizar cálculo de No-Shows (linha 106)**

De:
```typescript
const noShows = negocios.filter(n => n.data_noshow !== null).length;
```

Para:
```typescript
const noShows = negocios.filter(n => 
  n.data_noshow !== null && isTipoVendaValido(n.tipo_venda)
).length;
```

**3. Atualizar cálculo de Reuniões Realizadas (linha 109)**

De:
```typescript
const reunioesRealizadas = negocios.filter(n => n.reuniao_realizada === true).length;
```

Para:
```typescript
const reunioesRealizadas = negocios.filter(n => 
  n.reuniao_realizada === true && isTipoVendaValido(n.tipo_venda)
).length;
```

**4. Atualizar cálculo de Vendas para Conversão (linha 123-124)**

De:
```typescript
const vendasNoPeriodo = negociosComercial.filter(n => 
  n.venda_aprovada === true && isInPeriod(n.data_venda)
);
const vendasRealizadas = vendasNoPeriodo.length;
```

Para:
```typescript
const vendasNoPeriodo = negociosComercial.filter(n => 
  n.venda_aprovada === true && isInPeriod(n.data_venda)
);
const vendasRealizadas = vendasNoPeriodo.length;

// Vendas filtradas por tipo para % Conversão
const vendasParaConversao = vendasNoPeriodo.filter(n => 
  isTipoVendaValido(n.tipo_venda)
).length;
```

**5. Atualizar taxa de conversão (linha 128)**

De:
```typescript
const taxaConversaoGeral = reunioesRealizadas > 0 
  ? vendasRealizadas / reunioesRealizadas * 100 
  : 0;
```

Para:
```typescript
const taxaConversaoGeral = reunioesRealizadas > 0 
  ? vendasParaConversao / reunioesRealizadas * 100 
  : 0;
```

## Resultado Esperado

Com essa alteração, os 3 KPIs vão refletir apenas os dados de "Pacotes de Viagens" e "Expedições", independente dos filtros globais aplicados pelo usuário. Os outros KPIs (Faturamento, Vendas totais, Leads, etc.) continuarão funcionando normalmente com todos os tipos de venda.
