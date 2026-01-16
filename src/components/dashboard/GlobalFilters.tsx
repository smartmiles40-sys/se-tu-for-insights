import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, X, User, Package } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { NegocioFilters } from '@/hooks/useNegocios';

interface GlobalFiltersProps {
  filters: NegocioFilters;
  onFiltersChange: (filters: NegocioFilters) => void;
  options: {
    sdrs: string[];
    vendedores: string[];
    pipelines: string[];
    utmSources: string[];
    leadFontes: string[];
    tiposVenda: string[];
  };
}

export function GlobalFilters({ filters, onFiltersChange, options }: GlobalFiltersProps) {
  const hasFilters = Object.entries(filters).some(([_, v]) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== '';
  });

  const responsaveis = [...new Set([...options.sdrs, ...options.vendedores])].sort();

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof NegocioFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  const handleResponsavelChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({
        ...filters,
        sdr: undefined,
        vendedor: undefined,
      });
    } else {
      const isSDR = options.sdrs.includes(value);
      const isVendedor = options.vendedores.includes(value);
      
      onFiltersChange({
        ...filters,
        sdr: isSDR ? value : undefined,
        vendedor: isVendedor ? value : undefined,
      });
    }
  };

  const currentResponsavel = filters.sdr || filters.vendedor || 'all';

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      {/* Período */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 w-[110px] justify-start text-left font-normal bg-slate-800 border-slate-600 hover:bg-slate-700',
                !filters.dataInicio && 'text-slate-400'
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {filters.dataInicio ? (
                format(new Date(filters.dataInicio + 'T12:00:00'), 'dd/MM/yy', { locale: ptBR })
              ) : (
                <span>De</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
            <Calendar
              mode="single"
              selected={filters.dataInicio ? new Date(filters.dataInicio) : undefined}
              onSelect={(date) => {
                if (date) {
                  const firstDay = startOfMonth(date);
                  updateFilter('dataInicio', format(firstDay, 'yyyy-MM-dd'));
                } else {
                  updateFilter('dataInicio', undefined);
                }
              }}
              locale={ptBR}
              className="bg-slate-800 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-slate-500 text-sm">até</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 w-[110px] justify-start text-left font-normal bg-slate-800 border-slate-600 hover:bg-slate-700',
                !filters.dataFim && 'text-slate-400'
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {filters.dataFim ? (
                format(new Date(filters.dataFim + 'T12:00:00'), 'dd/MM/yy', { locale: ptBR })
              ) : (
                <span>Até</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600" align="start">
            <Calendar
              mode="single"
              selected={filters.dataFim ? new Date(filters.dataFim) : undefined}
              onSelect={(date) => {
                if (date) {
                  const lastDay = endOfMonth(date);
                  updateFilter('dataFim', format(lastDay, 'yyyy-MM-dd'));
                } else {
                  updateFilter('dataFim', undefined);
                }
              }}
              locale={ptBR}
              className="bg-slate-800 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="h-5 w-px bg-slate-600" />

      {/* Responsável */}
      {responsaveis.length > 0 && (
        <Select
          value={currentResponsavel}
          onValueChange={handleResponsavelChange}
        >
          <SelectTrigger className="h-8 w-[150px] bg-slate-800 border-slate-600 text-sm">
            <User className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">Todos</SelectItem>
            {responsaveis.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Pipeline */}
      {options.pipelines.length > 0 && (
        <Select
          value={filters.pipeline || 'all'}
          onValueChange={(v) => updateFilter('pipeline', v)}
        >
          <SelectTrigger className="h-8 w-[140px] bg-slate-800 border-slate-600 text-sm">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">Todos Pipelines</SelectItem>
            {options.pipelines.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Origem */}
      {options.leadFontes.length > 0 && (
        <Select
          value={filters.leadFonte || 'all'}
          onValueChange={(v) => updateFilter('leadFonte', v)}
        >
          <SelectTrigger className="h-8 w-[140px] bg-slate-800 border-slate-600 text-sm">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">Todas Origens</SelectItem>
            {options.leadFontes.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Tipo de Venda - Multi-select */}
      {options.tiposVenda.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 min-w-[140px] justify-start bg-slate-800 border-slate-600 hover:bg-slate-700 text-sm',
                filters.tiposVenda && filters.tiposVenda.length > 0 && 'border-primary/50'
              )}
            >
              <Package className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              {filters.tiposVenda && filters.tiposVenda.length > 0
                ? `${filters.tiposVenda.length} tipo${filters.tiposVenda.length > 1 ? 's' : ''}`
                : 'Tipo de Venda'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 bg-slate-800 border-slate-600" align="start">
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-medium mb-2">Selecione os tipos:</div>
              {options.tiposVenda.map((tipo) => (
                <div key={tipo} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tipo-${tipo}`}
                    checked={filters.tiposVenda?.includes(tipo) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.tiposVenda || [];
                      if (checked) {
                        onFiltersChange({ ...filters, tiposVenda: [...current, tipo] });
                      } else {
                        const updated = current.filter(t => t !== tipo);
                        onFiltersChange({ 
                          ...filters, 
                          tiposVenda: updated.length > 0 ? updated : undefined 
                        });
                      }
                    }}
                    className="border-slate-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label 
                    htmlFor={`tipo-${tipo}`} 
                    className="text-sm text-slate-300 cursor-pointer flex-1"
                  >
                    {tipo}
                  </label>
                </div>
              ))}
              {filters.tiposVenda && filters.tiposVenda.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, tiposVenda: undefined })}
                  className="w-full mt-2 h-7 text-xs text-slate-400 hover:text-red-400"
                >
                  Limpar seleção
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Limpar */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 text-slate-400 hover:text-red-400"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
