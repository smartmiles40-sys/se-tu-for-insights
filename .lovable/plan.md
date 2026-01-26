
# Plano: Corrigir Subtítulos dos KPIs

## Problema Identificado

Na imagem, os subtítulos mostram:
- **% No-Show**: 14/41
- **% Show-Up**: 27/41
- **% Conversão Vendas**: 23/27

Mas o "41" deveria ser o `baseComResultado` (que já está correto no código - é noShows + reunioesRealizadas = 14 + 27 = 41). Esse valor já está usando o filtro correto.

O problema real está no **% Conversão Vendas** que mostra **23/27**, onde:
- O denominador (27) está correto (reunioesRealizadas filtradas)
- O numerador (23) usa `vendasRealizadas` em vez de `vendasParaConversao`

## Alteração Técnica

### Arquivo: `src/pages/Dashboard.tsx`

**Linha 362 - Corrigir o subtítulo do % Conversão Vendas:**

De:
```typescript
<div className="text-sm text-slate-300 mt-1">{formatNumber(executiveStats.vendasRealizadas)} / {formatNumber(executiveStats.reunioesRealizadas)}</div>
```

Para:
```typescript
<div className="text-sm text-slate-300 mt-1">{formatNumber(executiveStats.vendasParaConversao)} / {formatNumber(executiveStats.reunioesRealizadas)}</div>
```

**Adicionar `vendasParaConversao` ao retorno do useMemo (~linha 230):**

Incluir o campo `vendasParaConversao` no objeto de retorno para que fique disponível no template.

## Resultado Esperado

Os 3 KPIs vão mostrar números consistentes, todos aplicando o filtro de exclusão de "Outros", "Seguro Viagem" e "Passagens aéreas":
- % No-Show: X / Y (ambos filtrados)
- % Show-Up: Z / Y (ambos filtrados)  
- % Conversão Vendas: W / Z (ambos filtrados)
