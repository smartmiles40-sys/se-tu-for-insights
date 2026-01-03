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
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { NegocioFilters } from '@/hooks/useNegocios';

interface FilterBarProps {
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

export function FilterBar({ filters, onFiltersChange, options }: FilterBarProps) {
  const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof NegocioFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  return (
    <div className="filter-bar">
      {/* Date Range */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[140px] justify-start text-left font-normal',
                !filters.dataInicio && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dataInicio ? (
                format(new Date(filters.dataInicio), 'dd/MM/yyyy', { locale: ptBR })
              ) : (
                <span>Data início</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dataInicio ? new Date(filters.dataInicio) : undefined}
              onSelect={(date) => 
                updateFilter('dataInicio', date ? format(date, 'yyyy-MM-dd') : undefined)
              }
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">até</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[140px] justify-start text-left font-normal',
                !filters.dataFim && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dataFim ? (
                format(new Date(filters.dataFim), 'dd/MM/yyyy', { locale: ptBR })
              ) : (
                <span>Data fim</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dataFim ? new Date(filters.dataFim) : undefined}
              onSelect={(date) => 
                updateFilter('dataFim', date ? format(date, 'yyyy-MM-dd') : undefined)
              }
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* SDR Filter */}
      {options.sdrs.length > 0 && (
        <Select
          value={filters.sdr || 'all'}
          onValueChange={(v) => updateFilter('sdr', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="SDR" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos SDRs</SelectItem>
            {options.sdrs.map((sdr) => (
              <SelectItem key={sdr} value={sdr}>
                {sdr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Vendedor Filter */}
      {options.vendedores.length > 0 && (
        <Select
          value={filters.vendedor || 'all'}
          onValueChange={(v) => updateFilter('vendedor', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Vendedores</SelectItem>
            {options.vendedores.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Pipeline Filter */}
      {options.pipelines.length > 0 && (
        <Select
          value={filters.pipeline || 'all'}
          onValueChange={(v) => updateFilter('pipeline', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Pipelines</SelectItem>
            {options.pipelines.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* UTM Source Filter */}
      {options.utmSources.length > 0 && (
        <Select
          value={filters.utmSource || 'all'}
          onValueChange={(v) => updateFilter('utmSource', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="UTM Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Origens</SelectItem>
            {options.utmSources.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
