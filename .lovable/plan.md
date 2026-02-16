

## Correção dos cálculos de No-Show e Show-Up

### Problema identificado

Atualmente o dashboard conta como **No-Show** qualquer registro que tenha `data_noshow` preenchida, mesmo que a reunião tenha sido realizada depois. Dos 10 registros com `data_noshow`, **8 também têm `data_reuniao_realizada`** -- ou seja, deram no-show inicialmente mas acabaram fazendo a reunião. Esses não devem contar como no-show.

Alem disso, o filtro de no-show nao aplica:
- Filtro de **pipeline** (deveria ser apenas "Comercial 1", como as reuniões realizadas)
- Filtro de **período** (deveria verificar se `data_noshow` esta dentro do período selecionado)

### Dados reais (Fevereiro 2026)

| Metrica | Valor atual (errado) | Valor correto |
|---------|---------------------|---------------|
| No-Shows | ~8-10 | 0 (o unico no-show de fev tambem tem reuniao realizada) |
| Reunioes Realizadas | 41 | 41 |

### Regra corrigida

Um registro e **No-Show** somente se:
1. `data_noshow` esta preenchida **E** dentro do periodo selecionado
2. `data_reuniao_realizada` **NAO** esta preenchida (se fez a reuniao depois, nao e no-show)
3. Pipeline e "Comercial 1" (consistencia com reunioes realizadas)

### Alteracoes tecnicas

**Arquivo: `src/pages/Dashboard.tsx`**

Alterar o calculo de `noShows` (linhas ~112-120) para:

```typescript
const noShows = negocios.filter(n => {
  // Exigir data_noshow preenchida e dentro do periodo
  if (!n.data_noshow || !isInPeriod(n.data_noshow)) return false;
  // Se realizou a reuniao depois, NAO e no-show
  if (n.data_reuniao_realizada) return false;
  // Exigir pipeline Comercial 1
  if (!isComercial(n.pipeline)) return false;
  // Filtro de vendedor
  if (filters?.vendedores && filters.vendedores.length > 0) {
    const responsavel = removeAccents(n.responsavel_reuniao?.toLowerCase() || '');
    return filters.vendedores.some(v => responsavel.includes(removeAccents(v.toLowerCase())));
  }
  return true;
}).length;
```

**Arquivo: `src/components/dashboard/CriticalRatesPanel.tsx`**

Aplicar a mesma logica na contagem de no-shows desse componente (linha ~29):

```typescript
// No-show: apenas se NAO realizou reuniao depois
const noShows = negocios.filter(n => 
  n.data_noshow !== null && n.data_noshow !== undefined && !n.data_reuniao_realizada
).length;
```

**Arquivo: `src/hooks/useNegocios.ts`** (funcao `useNegociosStats`)

Ajustar a contagem de no-shows para consistencia:

```typescript
const noShows = negocios.filter(n => n.no_show && !n.data_reuniao_realizada).length;
```
