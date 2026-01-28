

## Problema Identificado

O filtro de "Tipo de Venda" no card de Conversão de Vendas mostra apenas **4 vendas** para "Pacote de Viagens" e "Expedições" porque:

1. O cálculo está limitado ao pipeline **"Comercial 1 - Se tu for eu vou"** (linha 87)
2. A maioria das vendas desses tipos está em **outros pipelines**:

| Pipeline | Expedições | Pacote de Viagens |
|----------|-----------|-------------------|
| Comercial 1 | 2 | 2 |
| Processo Pós Venda | 1 | 3 |
| **Total** | **3** | **5** |

---

## Solução Proposta

Expandir o cálculo do card de "% Conversão Vendas" para incluir vendas de **todos os pipelines** quando o filtro de "Tipo de Venda" estiver ativo.

### Arquivo a Modificar
`src/pages/Dashboard.tsx`

### Mudanças

**1. Criar variável para todas as vendas (sem filtro de pipeline)**

```typescript
// Linha ~154 - após vendasNoPeriodo
const todasVendasNoPeriodo = negocios.filter(n => 
  n.venda_aprovada === true && isInPeriod(n.data_venda)
);
```

**2. Usar todas as vendas quando filtro de tipo estiver ativo**

```typescript
// Linha ~162-166 - modificar lógica
const vendasParaFiltro = tipoVendaConversaoFilter.length === 0 
  ? vendasNoPeriodo  // Sem filtro: apenas Comercial
  : todasVendasNoPeriodo.filter(n => 
      n.tipo_venda && tipoVendaConversaoFilter.includes(n.tipo_venda)
    );
const vendasFiltradasCount = vendasParaFiltro.length;
const taxaConversaoFiltrada = reunioesRealizadas > 0 
  ? vendasFiltradasCount / reunioesRealizadas * 100 
  : 0;
```

**3. Atualizar tipos únicos para incluir todos os pipelines**

```typescript
// Linha ~257 - extrair tipos de todas as vendas
const tiposVendaUnicos = [...new Set(
  todasVendasNoPeriodo.map(n => n.tipo_venda).filter(Boolean)
)] as string[];
```

---

## Resultado Esperado

- **Sem filtro**: Mantém comportamento atual (apenas pipeline Comercial 1)
- **Com filtro ativo**: Inclui vendas de todos os pipelines para os tipos selecionados
  - "Pacote de Viagens" + "Expedições" = 8 vendas (em vez de 4)

---

## Detalhes Técnicos

A mudança permite que o filtro local de "Tipo de Venda" busque vendas em todas as pipelines da base de dados, respeitando a regra de negócio onde vendas pós-venda também são categorizadas por tipo.

