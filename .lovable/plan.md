

## Diagnóstico dos 3 Problemas Críticos

### Dados do Banco de Dados (Real)

| Métrica | Valor Real | Valor no Dashboard | Status |
|---------|-----------|-------------------|--------|
| Faturamento Total (período) | R$ 921.679,65 | R$ 540.842 | ❌ ERRADO |
| Vendas Aprovadas (período) | 43 | 28 | ❌ ERRADO |
| Reuniões Realizadas (total) | 39+ | 27 | ❌ TRAVADO |

---

## Problema 1: Conversão de Vendas com Filtro Errado

**Causa:** O filtro de "Tipo de Venda" mostra valores incorretos porque:
- "Expedições" + "Pacote de Viagens" = **8 vendas** e **R$ 397.309,05** no banco
- O Dashboard está mostrando apenas 4 vendas

**Dados Reais por Pipeline:**
| Pipeline | Expedições | Pacote de Viagens |
|----------|-----------|-------------------|
| Comercial 1 | 2 (R$ 84.972) | 2 (R$ 106.004) |
| Processo Pós Venda | 1 (R$ 24.992) | 3 (R$ 181.340) |
| **Total** | **3 (R$ 109.964)** | **5 (R$ 287.345)** |

**Total combinado:** 8 vendas = R$ 397.309,05

---

## Problema 2: Faturamento Errado

**Causa:** O KPI de "Faturamento" está limitado ao pipeline "Comercial 1" (R$ 540.841), mas o negócio tem vendas em múltiplos pipelines:

| Pipeline | Vendas | Faturamento |
|----------|--------|-------------|
| Comercial 1 | 28 | R$ 540.841,51 |
| Processo Pós Venda | 9 | R$ 214.894,14 |
| Expedições Se tu for eu vou | 6 | R$ 165.944,00 |
| **Total** | **43** | **R$ 921.679,65** |

**Decisão necessária:** O Faturamento principal deve incluir TODOS os pipelines ou apenas Comercial 1?

---

## Problema 3: Reuniões Realizadas Travadas (MAIS CRÍTICO)

**Causa:** O código filtra `reuniao_realizada = true`, mas também exige correspondência com filtro de vendedor via `responsavel_reuniao` ou `quem_vendeu`. O problema é:

1. Existem **15 reuniões** onde `responsavel_reuniao` é NULL
2. O código na linha 128-140 aplica filtro de vendedor mesmo quando não há vendedor selecionado
3. A query do `useNegocios` exige que pelo menos uma das datas esteja no período, mas `data_reuniao_realizada` está VAZIO para todas as reuniões (todos os 39 registros têm `data_reuniao_realizada = NULL`)

**Dados do Banco:**
```
reuniao_realizada = true: 39 registros
data_reuniao_realizada IS NOT NULL: 0 registros ← TODOS VAZIOS!
```

**Isso significa:** As reuniões só entram no período se tiverem outra data válida (primeiro_contato, data_agendamento, etc). Muitas reuniões antigas estão sendo excluídas do período.

---

## Plano de Correção

### Arquivo: `src/pages/Dashboard.tsx`

**Correção 1: Incluir Todos os Pipelines no Faturamento Principal**

Linha ~87: Remover restrição de pipeline para faturamento

```typescript
// ANTES
const negociosComercial = negocios.filter(n => isComercial(n.pipeline));

// DEPOIS
// Vendas e faturamento: todos os pipelines com venda aprovada
const negociosComVenda = negocios.filter(n => n.venda_aprovada === true && isInPeriod(n.data_venda));
```

**Correção 2: Atualizar Cálculo de Vendas e Faturamento**

Linhas ~154-156: Usar todos os negócios com venda

```typescript
// ANTES
const vendasNoPeriodo = negociosComercial.filter(n => n.venda_aprovada === true && isInPeriod(n.data_venda));

// DEPOIS
const vendasNoPeriodo = negociosComVenda;
const vendasRealizadas = vendasNoPeriodo.length;
const receitaTotal = vendasNoPeriodo.reduce((sum, n) => sum + (n.total || 0), 0);
```

**Correção 3: Filtro de Tipo de Venda - Já Funciona**

O código do filtro já busca de `todasVendasNoPeriodo` que inclui todos os pipelines. O problema era que `vendasNoPeriodo` (base do cálculo) estava limitado.

**Correção 4: Reuniões Realizadas - Não Filtrar por Data**

Linhas ~128-140: As reuniões devem contar pelo booleano, não pela data (que está vazia)

```typescript
// O cálculo atual está correto para o booleano
// O problema é a query do useNegocios que exclui registros

// Adicionar verificação: se a reunião foi realizada mas não tem data,
// usar data_agendamento como proxy para verificar o período
const reunioesRealizadas = negocios.filter(n => {
  if (n.reuniao_realizada !== true) return false;
  
  // Verificar se está no período: usar data_agendamento como fallback
  const dataRef = n.data_reuniao_realizada || n.data_agendamento;
  if (!isInPeriod(dataRef)) return false;
  
  // Filtro de vendedor (se aplicável)
  if (filters?.vendedores && filters.vendedores.length > 0) {
    const responsavel = removeAccents(n.responsavel_reuniao?.toLowerCase() || '');
    const quemVendeu = removeAccents(n.quem_vendeu?.toLowerCase() || '');
    return filters.vendedores.some(v => {
      const vendedorNorm = removeAccents(v.toLowerCase());
      return responsavel.includes(vendedorNorm) || quemVendeu.includes(vendedorNorm);
    });
  }
  return true;
}).length;
```

---

## Resumo das Mudanças

1. **Faturamento**: Incluir vendas de TODOS os pipelines (não apenas Comercial 1)
2. **Vendas**: Incluir vendas de TODOS os pipelines  
3. **Reuniões**: Usar `data_agendamento` como fallback quando `data_reuniao_realizada` está vazia
4. **Filtro Tipo de Venda**: Manter lógica atual (já correta)

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Faturamento | R$ 540.842 | R$ 921.679 |
| Vendas | 28 | 43 |
| Reuniões Realizadas | 27 | ~39+ |
| Expedições + Pacote (filtro) | 4 vendas | 8 vendas |

