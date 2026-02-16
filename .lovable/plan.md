
# Corrigir Inputs de Metas - Permitir Digitacao Livre

## Problema
Os campos de metas na pagina `/metas` usam `type="number"`, que exibe setas de incremento (+1/-1). Isso torna dificil digitar valores grandes como R$ 150.000.

## Solucao
Alterar todos os inputs de `type="number"` para `type="text"` com `inputMode="decimal"`, permitindo digitacao livre de qualquer valor numerico.

## Detalhes Tecnicos

**Arquivo a modificar:** `src/pages/MetasPage.tsx`

- Trocar `type="number"` por `type="text"` e adicionar `inputMode="decimal"` em todos os 25 inputs da pagina
- Manter a logica de parsing (parseFloat/parseInt) no onChange para garantir que apenas numeros sejam salvos
- Isso remove as setas de incremento e permite colar/digitar valores livremente
