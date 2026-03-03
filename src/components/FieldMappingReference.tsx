import { Info, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const fieldMappingInfo = [
  {
    category: 'Estrutura do CSV (16 campos)',
    fields: [
      { label: 'Primeiro contato Lead', dbField: 'primeiro_contato', tipo: 'Data' },
      { label: 'ID', dbField: 'crm_id', tipo: 'Texto/Número' },
      { label: 'Nome', dbField: 'nome', tipo: 'Texto' },
      { label: 'Pessoa responsável', dbField: 'vendedor', tipo: 'Texto (Closer)' },
      { label: 'Pipeline de negócio', dbField: 'pipeline', tipo: 'Texto' },
      { label: 'Fase do negócio', dbField: 'fase', tipo: 'Texto' },
      { label: 'Data de início', dbField: 'data_inicio', tipo: 'Data' },
      { label: 'Quem fez o agendamento?', dbField: 'sdr', tipo: 'Texto (SDR)' },
      { label: 'Data do agendamento', dbField: 'data_agendamento', tipo: 'Data' },
      { label: 'Data da reunião realizada/Proposta enviada', dbField: 'data_reuniao_realizada', tipo: 'Data' },
      { label: 'DATA DO MQL', dbField: 'data_mql', tipo: 'Data' },
      { label: 'DATA DO SQL', dbField: 'data_sql', tipo: 'Data' },
      { label: 'Data da venda realizada', dbField: 'data_venda', tipo: 'Data' },
      { label: 'Data do No Show', dbField: 'data_noshow', tipo: 'Data' },
      { label: 'Setores', dbField: 'setores', tipo: 'Texto' },
      { label: 'Total', dbField: 'total', tipo: 'Valor (R$)' },
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
            Mapeamento de campos (v1.0)
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              O CSV deve conter exatamente esses 16 campos. Passe o cursor sobre cada campo para ver o campo correspondente no banco.
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
                        <p className="font-semibold text-xs mb-1">Campo no banco: <span className="font-mono">{field.dbField}</span></p>
                        <p className="text-xs text-muted-foreground">Tipo: {field.tipo}</p>
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
