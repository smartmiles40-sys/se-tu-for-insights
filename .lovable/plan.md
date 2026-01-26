
## Problema Identificado

O filtro de vendedor no nível do **banco de dados** (`useNegocios.ts`) está filtrando **apenas por `quem_vendeu`**. Porém, os no-shows não têm `quem_vendeu` preenchido (é `null` porque não houve venda).

### Fluxo Atual (Incorreto)
1. Usuário filtra por "Valéria Noronha"
2. Hook `useNegocios` aplica: `WHERE quem_vendeu ILIKE '%Valéria%'`
3. Registros de no-show (que têm `quem_vendeu = NULL`) são **excluídos da query**
4. Dashboard recebe 0 no-shows

### Dados Confirmados
- Valéria tem **6 no-shows** no banco (campo `responsavel_reuniao`)
- Mas todos têm `quem_vendeu = NULL`

---

## Plano de Correção

### Arquivo a Modificar
`src/hooks/useNegocios.ts`

### Mudança Proposta
Modificar o filtro de vendedor para buscar também por `responsavel_reuniao`:

```typescript
// Linhas 97-103: Alterar para incluir responsavel_reuniao
if (filters?.vendedores && filters.vendedores.length > 0) {
  const orConditions = filters.vendedores
    .flatMap(v => [
      `quem_vendeu.ilike.%${v}%`,
      `responsavel_reuniao.ilike.%${v}%`
    ])
    .join(',');
  query = query.or(orConditions);
}
```

### Resultado Esperado
- Ao filtrar por "Valéria Noronha":
  - Registros com `quem_vendeu = 'Valéria Noronha'` → incluídos
  - Registros com `responsavel_reuniao = 'Valeria Noronha'` → incluídos (inclui no-shows)
- Os 6 no-shows serão exibidos corretamente

---

## Detalhes Técnicos

O `flatMap` cria condições para ambos os campos, permitindo que registros sejam incluídos se:
- `quem_vendeu` contém o nome do vendedor, **OU**
- `responsavel_reuniao` contém o nome do vendedor

Isso garante que:
- Vendas sejam atribuídas ao `quem_vendeu`
- No-shows e reuniões sejam atribuídos ao `responsavel_reuniao`
