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
import { CalendarIcon, X, Filter, User } from 'lucide-react';
import { format } from 'date-fns';
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
  const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  // Combine SDRs and Vendedores for "Responsável" filter
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
      // Check if the value is an SDR or Vendedor and set appropriately
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
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Filtros Globais
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Período - Data de início */}
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
                  <span>De</span>
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
                  <span>Até</span>
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

        <div className="h-6 w-px bg-border" />

        {/* Responsável - Combined SDR + Vendedor filter */}
        {responsaveis.length > 0 && (
          <Select
            value={currentResponsavel}
            onValueChange={handleResponsavelChange}
          >
            <SelectTrigger className="w-[180px]">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Responsáveis</SelectItem>
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

        {/* Origem do Lead */}
        {options.leadFontes.length > 0 && (
          <Select
            value={filters.leadFonte || 'all'}
            onValueChange={(v) => updateFilter('leadFonte', v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Origens</SelectItem>
              {options.leadFontes.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Limpar Filtros */}
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
    </div>
  );
}
