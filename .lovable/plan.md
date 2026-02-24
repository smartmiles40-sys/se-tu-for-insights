

## Adicionar tooltips de mapeamento de campos na página de importação

### O que será feito
Adicionar uma seção de referência na página de importação com todos os campos do dashboard e seus respectivos nomes esperados no CSV/Excel. Cada campo terá um ícone de informação (ℹ️) que, ao passar o cursor, mostra quais colunas da planilha são aceitas para aquele campo.

### Alterações técnicas

**Arquivo: `src/components/DataImport.tsx`**

Adicionar, abaixo da descrição do card (após linha 507), uma seção com um accordion ou uma lista compacta dos campos agrupados por categoria, cada um com um `Tooltip` mostrando as variações aceitas do CSV:

**Categorias e mapeamentos:**

| Campo no Dashboard | Colunas aceitas no CSV |
|---|---|
| **Identificação** | |
| CRM ID | `ID`, `crm_id` |
| Nome | `Nome`, `Título`, `Titulo` |
| Pipeline | `Pipeline de Negócio`, `Pipeline` |
| Fase | `Fase: Em Andamento`, `Fase: Perdidos`, `Fase: Fechados`, `Fase` |
| **Datas** | |
| Data de Início | `Data de início`, `Data criação` |
| Data Agendamento | `Data do agendamento` |
| Data Reunião Realizada | `Data da reunião realizada`, `Data da reunião realizada/Proposta enviada` |
| Data MQL | `Data do MQL` |
| Data SQL | `Data do SQL` |
| Data Venda | `Data da venda realizada` |
| Data No Show | `Data de no show` |
| Data Prevista | `Data prevista de fechamento` |
| Primeiro Contato | `Primeiro contato lead` |
| Data Movimentação | `Data de movimentação do card` |
| **Pessoas** | |
| Vendedor | `Vendedor`, `Responsável` |
| SDR | `Quem fez o agendamento?`, `SDR` |
| Quem Vendeu | `Quem realizou a venda?` |
| Resp. Reunião | `Responsável pela reunião` |
| **Valores** | |
| Faturamento (Total) | `Total`, `Valor`, `Valor total`, `Lead: Total` |
| Custo | `Custo`, `Custo total da venda` |
| **Qualificação** | |
| MQL | `MQL`, `MQL (preencha com "sim")` |
| SQL | `SQL`, `SQL (preencha com "sim")` |
| Reunião Agendada | `Reunião agendada?`, `Reunião agendada` |
| Reunião Realizada | `Reunião realizada?`, `Reunião realizada` |
| No Show | `No show?`, `No show` |
| Venda Aprovada | `Venda aprovada`, `Venda aprovada (preencha com "sim")` |
| **Outros** | |
| Tipo de Venda | `Tipo de venda`, `Venda realizada - tipo` |
| Motivo de Perda | `Motivo de perda` |
| Info Etapa | `Informações da etapa` |
| **Fontes** | |
| Lead Fonte | `Lead: Fonte`, `Fonte` |
| Contato Fonte | `Contato: Fonte` |
| **UTM** | |
| UTM Source | `Lead: utm_source`, `utm_source`, `utm source` |
| UTM Medium | `Lead: utm_medium`, `utm_medium` |
| UTM Campaign | `Lead: utm_campaign`, `utm_campaign` |
| UTM Content | `Lead: utm_content`, `utm_content` |
| UTM Term | `Lead: utm_term`, `utm_term` |

**Implementação:**

1. Importar `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` e o ícone `Info` do lucide-react
2. Criar um array constante `fieldMappingInfo` agrupando os campos por categoria com o nome do dashboard e as variações aceitas
3. Adicionar um componente `Collapsible` (ou accordion) abaixo da descrição do card com título "Mapeamento de campos" 
4. Dentro, renderizar cada campo como um badge/chip com um ícone `Info` que ao hover mostra um tooltip com as colunas CSV aceitas
5. Layout compacto em grid para não ocupar muito espaço

**Nenhuma alteração de lógica** — apenas UI informativa.

