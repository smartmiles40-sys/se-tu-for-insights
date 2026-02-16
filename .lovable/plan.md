

## Correção: No-Show baseado em agendamento passado sem reunião

### Problema
Atualmente o dashboard identifica no-shows **apenas** quando o campo `data_noshow` está preenchido no CRM. Porém, o CRM não preenche esse campo de forma consistente — em fevereiro, existem **34 reuniões agendadas sem `data_reuniao_realizada`**, mas apenas 1 tem `data_noshow` marcado.

### Nova regra
Um registro é **No-Show** se:
1. Está no pipeline **"Comercial 1"**
2. Tem `data_agendamento` preenchida e **no passado** (antes de hoje)
3. **Não tem** `data_reuniao_realizada` preenchida
4. A `data_agendamento` está dentro do período selecionado no filtro

Isso elimina a dependência do campo `data_noshow` e captura todos os casos reais.

### Alterações técnicas

**1. `src/pages/Dashboard.tsx`** - Cálculo principal de no-shows (~linhas 112-125)

Trocar a lógica de `data_noshow` para verificar se `data_agendamento` já passou sem reunião realizada:

```typescript
const noShows = negocios.filter(n => {
  // Exigir pipeline Comercial 1
  if (!isComercial(n.pipeline)) return false;
  // Exigir data_agendamento preenchida, dentro do período E no passado
  if (!n.data_agendamento || !isInPeriod(n.data_agendamento)) return false;
  if (n.data_agendamento >= getTodayBrazil()) return false;
  // Se realizou a reunião, NÃO é no-show
  if (n.data_reuniao_realizada) return false;
  // Filtro de vendedor
  if (filters?.vendedores && filters.vendedores.length > 0) {
    const responsavel = removeAccents(n.responsavel_reuniao?.toLowerCase() || '');
    return filters.vendedores.some(v => responsavel.includes(removeAccents(v.toLowerCase())));
  }
  return true;
}).length;
```

Importar `getTodayBrazil` de `@/lib/dateUtils`.

**2. `src/components/dashboard/CriticalRatesPanel.tsx`** (~linha 29)

Aplicar a mesma lógica simplificada (sem filtro de período pois os dados já vêm filtrados):

```typescript
const noShows = negocios.filter(n => 
  n.data_agendamento && n.data_agendamento < getTodayBrazil() && !n.data_reuniao_realizada
).length;
```

**3. `src/components/dashboard/SDRPerformance.tsx`** (~linha 32)

Mesma lógica para consistência entre componentes:

```typescript
const noShows = sdrNegocios.filter(n => 
  n.data_agendamento && n.data_agendamento < getTodayBrazil() && !n.data_reuniao_realizada
).length;
```

**4. `src/hooks/useNegocios.ts`** - função `useNegociosStats` (~linha 212)

Atualizar para consistência global:

```typescript
const noShows = negocios.filter(n => 
  n.reuniao_agendada && n.data_agendamento && n.data_agendamento < getTodayBrazil() && !n.data_reuniao_realizada
).length;
```

### Resultado esperado
Com os dados atuais de fevereiro, os no-shows devem subir de **1** para aproximadamente **16+** (reuniões agendadas antes de hoje sem realização), refletindo a realidade operacional.

