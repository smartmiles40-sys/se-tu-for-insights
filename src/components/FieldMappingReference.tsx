import { Info, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const fieldMappingInfo = [
  {
    category: 'Identificação',
    fields: [
      { label: 'CRM ID', csvColumns: ['ID', 'crm_id'] },
      { label: 'Nome', csvColumns: ['Nome', 'Título', 'Titulo'] },
      { label: 'Pipeline', csvColumns: ['Pipeline de Negócio', 'Pipeline'] },
      { label: 'Fase', csvColumns: ['Fase: Em Andamento', 'Fase: Perdidos', 'Fase: Fechados', 'Fase'] },
    ],
  },
  {
    category: 'Datas',
    fields: [
      { label: 'Data de Início', csvColumns: ['Data de início', 'Data criação'] },
      { label: 'Data Agendamento', csvColumns: ['Data do agendamento'] },
      { label: 'Data Reunião Realizada', csvColumns: ['Data da reunião realizada', 'Data da reunião realizada/Proposta enviada'] },
      { label: 'Data MQL', csvColumns: ['Data do MQL'] },
      { label: 'Data SQL', csvColumns: ['Data do SQL'] },
      { label: 'Data Venda', csvColumns: ['Data da venda realizada'] },
      { label: 'Data No Show', csvColumns: ['Data de no show'] },
      { label: 'Data Prevista', csvColumns: ['Data prevista de fechamento'] },
      { label: 'Primeiro Contato', csvColumns: ['Primeiro contato lead'] },
      { label: 'Data Movimentação', csvColumns: ['Data de movimentação do card'] },
    ],
  },
  {
    category: 'Pessoas',
    fields: [
      { label: 'Vendedor', csvColumns: ['Vendedor', 'Responsável'] },
      { label: 'SDR', csvColumns: ['Quem fez o agendamento?', 'SDR'] },
      { label: 'Quem Vendeu', csvColumns: ['Quem realizou a venda?'] },
      { label: 'Resp. Reunião', csvColumns: ['Responsável pela reunião'] },
    ],
  },
  {
    category: 'Valores',
    fields: [
      { label: 'Faturamento (Total)', csvColumns: ['Total', 'Valor', 'Valor total', 'Lead: Total'] },
      { label: 'Custo', csvColumns: ['Custo', 'Custo total da venda'] },
    ],
  },
  {
    category: 'Qualificação',
    fields: [
      { label: 'MQL', csvColumns: ['MQL', 'MQL (preencha com "sim")'] },
      { label: 'SQL', csvColumns: ['SQL', 'SQL (preencha com "sim")'] },
      { label: 'Reunião Agendada', csvColumns: ['Reunião agendada?', 'Reunião agendada'] },
      { label: 'Reunião Realizada', csvColumns: ['Reunião realizada?', 'Reunião realizada'] },
      { label: 'No Show', csvColumns: ['No show?', 'No show'] },
      { label: 'Venda Aprovada', csvColumns: ['Venda aprovada', 'Venda aprovada (preencha com "sim")'] },
    ],
  },
  {
    category: 'Outros',
    fields: [
      { label: 'Tipo de Venda', csvColumns: ['Tipo de venda', 'Venda realizada - tipo'] },
      { label: 'Motivo de Perda', csvColumns: ['Motivo de perda'] },
      { label: 'Info Etapa', csvColumns: ['Informações da etapa'] },
    ],
  },
  {
    category: 'Fontes',
    fields: [
      { label: 'Lead Fonte', csvColumns: ['Lead: Fonte', 'Fonte'] },
      { label: 'Contato Fonte', csvColumns: ['Contato: Fonte'] },
    ],
  },
  {
    category: 'UTM',
    fields: [
      { label: 'UTM Source', csvColumns: ['Lead: utm_source', 'utm_source', 'utm source'] },
      { label: 'UTM Medium', csvColumns: ['Lead: utm_medium', 'utm_medium'] },
      { label: 'UTM Campaign', csvColumns: ['Lead: utm_campaign', 'utm_campaign'] },
      { label: 'UTM Content', csvColumns: ['Lead: utm_content', 'utm_content'] },
      { label: 'UTM Term', csvColumns: ['Lead: utm_term', 'utm_term'] },
    ],
  },
];

export function FieldMappingReference() {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <Collapsible open={open} onOpenChange={setOpen} className="mt-4 border rounded-lg">
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Mapeamento de campos
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Passe o cursor sobre cada campo para ver quais colunas do CSV/Excel são aceitas.
            </p>
            {fieldMappingInfo.map((group) => (
              <div key={group.category}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.category}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {group.fields.map((field) => (
                    <Tooltip key={field.label}>
                      <TooltipTrigger asChild>
                        <div>
                          <Badge
                            variant="outline"
                            className="cursor-help gap-1 text-xs font-normal"
                          >
                            {field.label}
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-semibold text-xs mb-1">Colunas aceitas no CSV:</p>
                        <ul className="text-xs space-y-0.5">
                          {field.csvColumns.map((col) => (
                            <li key={col} className="font-mono">{col}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  );
}
