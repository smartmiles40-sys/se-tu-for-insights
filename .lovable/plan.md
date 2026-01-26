

# Plano: Ajustar Filtro Interno dos KPIs de Reunião

## Objetivo
Modificar a lógica do filtro interno para os 3 KPIs (% No-Show, % Show-Up, % Conversão Vendas) usando uma **lista de exclusão** em vez de uma lista de inclusão.

## Mudança de Abordagem

| Antes (Whitelist) | Depois (Blacklist) |
|-------------------|---------------------|
| Inclui apenas: "Pacote de Viagens", "Expedições" | Exclui: "Outros", "Seguro Viagem", "Passagens aéreas" |
| Ignora registros sem tipo_venda | **Inclui** registros com tipo_venda vazio ou outros tipos |

## Alterações Técnicas

### Arquivo: `src/pages/Dashboard.tsx`

**Linha 85-88 - Atualizar helper de filtro:**

De:
```typescript
// Filtro interno para KPIs de reunião: apenas Pacote de Viagens e Expedições
const TIPOS_VENDA_VALIDOS = ['Pacote de Viagens', 'Expedições'];
const isTipoVendaValido = (tipoVenda: string | null | undefined): boolean =>
  TIPOS_VENDA_VALIDOS.includes(tipoVenda || '');
```

Para:
```typescript
// Filtro interno para KPIs de reunião: excluir Outros, Seguro Viagem e Passagens aéreas
const TIPOS_VENDA_EXCLUIDOS = ['Outros', 'Seguro Viagem', 'Passagens aéreas'];
const isTipoVendaValido = (tipoVenda: string | null | undefined): boolean =>
  !TIPOS_VENDA_EXCLUIDOS.includes(tipoVenda || '');
```

## Resultado Esperado

Os 3 KPIs agora vão:
- **Incluir** todos os registros, EXCETO aqueles com tipo_venda = "Outros", "Seguro Viagem" ou "Passagens aéreas"
- **Incluir** registros sem tipo_venda preenchido (porque string vazia não está na lista de exclusão)

Isso deve aumentar a quantidade de registros contabilizados nos KPIs, resultando em valores mais próximos dos 41 registros que você mencionou na imagem.

