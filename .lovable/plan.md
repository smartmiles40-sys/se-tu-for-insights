

# Resumo do Colaborador - Nova Pagina de Indicadores

## Objetivo
Criar a pagina "Resumo do Colaborador" conforme o print enviado, com tabela de indicadores mostrando metas (Min/Sat/Exc), resultado realizado, peso e multiplicador.

## O que sera construido

### 1. Novos campos no banco de dados (tabela `metas`)
Adicionar 9 novos campos para os 3 indicadores que ainda nao existem:
- `meta_margem_minimo`, `meta_margem_satisfatorio`, `meta_margem_excelente` (Margem Global - %)
- `meta_media_closer_minimo`, `meta_media_closer_satisfatorio`, `meta_media_closer_excelente` (Media por Closer - R$)
- `meta_indicacoes_minimo`, `meta_indicacoes_satisfatorio`, `meta_indicacoes_excelente` (Indicacoes por Especialista - numero)

### 2. Nova pagina: `src/pages/ResumoColaboradorPage.tsx`
Layout conforme o print:
- **Header**: "Resumo do Colaborador" com subtitulo "Visualizacao consolidada de resultado e desempenho"
- **Seletor de colaborador**: Dropdown com todos os colaboradores cadastrados
- **Toggle**: "Meus Resultados" / "Meu Time"
- **Tabs**: "Resultado Financeiro" / "Avaliacao"
- **Seletores de periodo**: Mes e Ano (dropdowns)
- **Tabela "Indicadores do Mes (Camada 1)"** com colunas:
  - Indicador
  - Meta Min
  - Meta Sat
  - Meta Exc
  - Resultado (calculado a partir dos dados reais)
  - Peso (configuravel: 40%, 20%, 10%, 20%, 10%)
  - Mult (multiplicador calculado com base no nivel atingido)

### 3. Indicadores da tabela

| Indicador | Fonte do Resultado | Peso |
|---|---|---|
| Faturamento Global | Soma de `total` das vendas no periodo | 40% |
| Margem Global | Novo indicador (resultado manual por enquanto) | 20% |
| Conversao | Taxa de conversao vendas/reunioes | 10% |
| Media por Closer | Faturamento / numero de closers ativos | 20% |
| Indicacoes por Especialista | Novo indicador (resultado manual por enquanto) | 10% |

### 4. Logica do Multiplicador
- Abaixo do minimo: 0
- Entre minimo e satisfatorio: interpolacao linear (ex: 0.5 a 0.8)
- Entre satisfatorio e excelente: interpolacao linear (ex: 0.8 a 1.0)  
- Acima do excelente: 1.0 (ou bonus)
- Quando nao ha resultado: exibe "---"

### 5. Rota e navegacao
- Nova rota `/resumo` no `App.tsx`
- Novo link "Resumo" no sidebar (`AppSidebar.tsx`)

### 6. Atualizacao da pagina de Metas
- Adicionar campos para configurar os 3 novos indicadores (Margem, Media por Closer, Indicacoes) na aba Global da pagina de Metas

## Detalhes Tecnicos

**Arquivos a criar:**
- `src/pages/ResumoColaboradorPage.tsx` - Pagina principal

**Arquivos a modificar:**
- `src/App.tsx` - Adicionar rota `/resumo`
- `src/components/AppSidebar.tsx` - Adicionar link no menu
- `src/hooks/useMetas.ts` - Adicionar novos campos na interface Meta
- `src/pages/MetasPage.tsx` - Adicionar inputs para os novos indicadores

**Migracao SQL:**
```text
ALTER TABLE metas ADD COLUMN meta_margem_minimo numeric DEFAULT 0;
ALTER TABLE metas ADD COLUMN meta_margem_satisfatorio numeric DEFAULT 0;
ALTER TABLE metas ADD COLUMN meta_margem_excelente numeric DEFAULT 0;
ALTER TABLE metas ADD COLUMN meta_media_closer_minimo numeric DEFAULT 0;
ALTER TABLE metas ADD COLUMN meta_media_closer_satisfatorio numeric DEFAULT 0;
ALTER TABLE metas ADD COLUMN meta_media_closer_excelente numeric DEFAULT 0;
ALTER TABLE metas ADD COLUMN meta_indicacoes_minimo numeric DEFAULT 0;
ALTER TABLE metas ADD COLUMN meta_indicacoes_satisfatorio numeric DEFAULT 0;
ALTER TABLE metas ADD COLUMN meta_indicacoes_excelente numeric DEFAULT 0;
```

