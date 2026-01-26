
# Plano: Corrigir Contagem de Vendas e Filtro de Vendedores

## Problemas Identificados

### 1. Total de Vendas (21 vs 23)
O Dashboard mostra 21 vendas porque exige `data_venda` preenchida no período. Há **2 vendas da Tainara** com `data_venda = NULL`:
- Negócio #18465 (R$ 734,47)
- Negócio #12999 (sem valor)

### 2. Filtro de Vendedor Incompleto
O filtro usa o campo `responsavel_reuniao`, mas muitas vendas têm esse campo como **"Não se aplica"** ou nulo:

| Vendedor | Vendas com responsavel_reuniao correto | Vendas com "Não se aplica" |
|----------|----------------------------------------|---------------------------|
| Tainara  | 1                                      | 5 (+ 2 sem data)          |
| Beatriz  | 0                                      | 1                         |
| Talita   | 8                                      | 0                         |
| Valéria  | 5                                      | 0                         |
| John     | 1                                      | 0                         |

---

## Solução Proposta

### Parte 1: Corrigir o Filtro de Vendedores

Alterar a fonte de dados do filtro de **`responsavel_reuniao`** para **`quem_vendeu`**, que contém a atribuição correta de vendas.

**Arquivos a modificar:**

#### `src/hooks/useNegocios.ts`
1. Mudar `useFilterOptions` para usar `quem_vendeu` ao invés de `responsavel_reuniao`
2. Mudar a query `useNegocios` para filtrar por `quem_vendeu` quando vendedores são selecionados

```typescript
// Em useFilterOptions
const normalizedVendedores = negocios.map(n => normalizeName(n.quem_vendeu));

// Em useNegocios (filtro)
if (filters?.vendedores && filters.vendedores.length > 0) {
  const orConditions = filters.vendedores
    .map(v => `quem_vendeu.ilike.%${v}%`)
    .join(',');
  query = query.or(orConditions);
}
```

---

### Parte 2: Corrigir Contagem de Vendas no Dashboard

Há duas opções:

#### Opção A: Corrigir os dados no banco (Recomendado)
Atualizar as 2 vendas da Tainara que estão sem `data_venda`:
```sql
UPDATE negocios 
SET data_venda = '2026-01-20'  -- ou data apropriada
WHERE id IN ('5807ce3e-f382-4074-b922-b7d2ac9a1764', 'ace4989a-2acf-45e6-8265-9550af2fcc68');
```

#### Opção B: Incluir vendas sem data_venda
Alterar a lógica de contagem para incluir vendas onde `venda_aprovada = true` mesmo sem `data_venda`:
```typescript
// Em Dashboard.tsx
const vendasNoPeriodo = negociosComercial.filter(n => 
  n.venda_aprovada === true && 
  (isInPeriod(n.data_venda) || n.data_venda === null)
);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useNegocios.ts` | Mudar filtro e opções de `responsavel_reuniao` para `quem_vendeu` |
| `src/pages/Dashboard.tsx` | Ajustar lógica de vendas (se opção B) |
| Banco de dados | Corrigir `data_venda` das 2 vendas (se opção A) |

---

## Resultado Esperado

| Vendedor | Vendas Visíveis Após Correção |
|----------|------------------------------|
| Tainara  | 8 (ou 6 se não corrigir datas) |
| Talita   | 8                            |
| Valéria  | 5                            |
| John     | 1                            |
| Beatriz  | 1                            |
| **Total**| **23**                       |

---

## Recomendação

Sugiro implementar **Opção A** (corrigir dados no banco) junto com a mudança do filtro para usar `quem_vendeu`. Isso garante:
1. Dados consistentes no banco
2. Filtro correto por vendedor
3. Contagem correta de 23 vendas
