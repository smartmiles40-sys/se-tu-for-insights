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
import { CalendarIcon, X, ChevronDown, User } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
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
  const hasFilters = Object.entries(filters).some(([key, v]) => {
    if (key === 'vendedores' || key === 'tiposVenda') {
      return Array.isArray(v) && v.length > 0;
    }
    return v !== undefined && v !== '';
  });

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof NegocioFilters, value: string | string[] | undefined) => {
    if (key === 'vendedores' || key === 'tiposVenda') {
      onFiltersChange({
        ...filters,
        [key]: Array.isArray(value) && value.length === 0 ? undefined : value,
      });
    } else {
      onFiltersChange({
        ...filters,
        [key]: value === 'all' ? undefined : value,
      });
    }
  };

  const handleVendedorToggle = (vendedor: string, checked: boolean) => {
    const current = filters.vendedores || [];
    if (checked) {
      updateFilter('vendedores', [...current, vendedor]);
    } else {
      updateFilter('vendedores', current.filter(v => v !== vendedor));
    }
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
          <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
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
              className="pointer-events-auto"
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
          <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
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
              className="pointer-events-auto"
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
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">Todos SDRs</SelectItem>
            {options.sdrs.map((sdr) => (
              <SelectItem key={sdr} value={sdr}>
                {sdr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Vendedor Multi-Select */}
      {options.vendedores.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[160px] justify-between',
                filters.vendedores && filters.vendedores.length > 0 && 'border-primary/50'
              )}
            >
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>
                  {filters.vendedores && filters.vendedores.length > 0
                    ? `${filters.vendedores.length} vendedor(es)`
                    : 'Vendedor'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-popover border-border z-50" align="start">
            <div className="space-y-2">
              {options.vendedores.map((vendedor) => (
                <div key={vendedor} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-vendedor-${vendedor}`}
                    checked={filters.vendedores?.includes(vendedor) || false}
                    onCheckedChange={(checked) => handleVendedorToggle(vendedor, checked === true)}
                  />
                  <label
                    htmlFor={`filter-vendedor-${vendedor}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {vendedor}
                  </label>
                </div>
              ))}
              {filters.vendedores && filters.vendedores.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilter('vendedores', [])}
                  className="w-full mt-2 text-muted-foreground hover:text-destructive text-xs h-7"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar seleção
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
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
          <SelectContent className="bg-popover border-border z-50">
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
          <SelectContent className="bg-popover border-border z-50">
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
