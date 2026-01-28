

## Adicionar Luis de volta ao filtro de Vendedor

### Problema
O usuário solicitou adicionar "Luis" novamente ao filtro de Vendedor. Atualmente, ele está sendo excluído pela lista de exclusão no hook `useFilterOptions`.

### Arquivo a Modificar
`src/hooks/useNegocios.ts`

### Mudança
Remover "luiz" e "luis antonio" da lista de exclusão na linha 271:

**Antes:**
```typescript
const excludedVendedores = ['luiz', 'everton', 'everton lopes', 'luis antonio'];
```

**Depois:**
```typescript
const excludedVendedores = ['everton', 'everton lopes'];
```

### Resultado Esperado
- "Luis" (ou variantes como "Luis Antonio") aparecerá novamente no dropdown do filtro de Vendedor
- Everton continuará excluído conforme configurado anteriormente

