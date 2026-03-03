import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { X, ChevronDown, User, Users, UserCheck, Megaphone, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NegocioFilters } from '@/hooks/useNegocios';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const navLinks = [
  { path: '/sdr', label: 'SDRs', icon: Users },
  { path: '/especialistas', label: 'Especialistas', icon: UserCheck },
  { path: '/marketing', label: 'Marketing', icon: Megaphone },
];

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
    fontes: string[];
  };
  showFonte?: boolean;
  hidePipeline?: boolean;
  hideVendedor?: boolean;
  hideUtmSource?: boolean;
}

export function FilterBar({ filters, onFiltersChange, options, showFonte, hidePipeline, hideVendedor, hideUtmSource }: FilterBarProps) {
  const location = useLocation();
  
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

  const fromDate = filters.dataInicioFrom ? parseISO(filters.dataInicioFrom) : undefined;
  const toDate = filters.dataInicioTo ? parseISO(filters.dataInicioTo) : undefined;

  return (
    <div className="filter-bar">
      {/* Navigation Links */}
      <div className="flex items-center gap-1 mr-2 border-r border-border/50 pr-3">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <link.icon className="h-3.5 w-3.5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Date Range Filter - Data de Início */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[200px] justify-start text-left font-normal text-xs',
              (fromDate || toDate) && 'border-primary/50'
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
            {fromDate && toDate
              ? `${format(fromDate, 'dd/MM/yy')} - ${format(toDate, 'dd/MM/yy')}`
              : fromDate
                ? `A partir de ${format(fromDate, 'dd/MM/yy')}`
                : toDate
                  ? `Até ${format(toDate, 'dd/MM/yy')}`
                  : 'Data de início'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
          <div className="flex flex-col gap-2 p-3">
            <div className="text-xs font-medium text-muted-foreground">De:</div>
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(date) => {
                onFiltersChange({
                  ...filters,
                  dataInicioFrom: date ? format(date, 'yyyy-MM-dd') : undefined,
                });
              }}
              locale={ptBR}
              className={cn("p-1 pointer-events-auto")}
            />
            <div className="text-xs font-medium text-muted-foreground">Até:</div>
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={(date) => {
                onFiltersChange({
                  ...filters,
                  dataInicioTo: date ? format(date, 'yyyy-MM-dd') : undefined,
                });
              }}
              locale={ptBR}
              disabled={(date) => fromDate ? date < fromDate : false}
              className={cn("p-1 pointer-events-auto")}
            />
            {(fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({ ...filters, dataInicioFrom: undefined, dataInicioTo: undefined })}
                className="text-muted-foreground hover:text-destructive text-xs h-7"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpar datas
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

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
      {!hideVendedor && options.vendedores.length > 0 && (
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
      {!hidePipeline && options.pipelines.length > 0 && (
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
      {!hideUtmSource && options.utmSources.length > 0 && (
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

      {/* Fonte Filter */}
      {showFonte && options.fontes && options.fontes.length > 0 && (
        <Select
          value={filters.fonte || 'all'}
          onValueChange={(v) => updateFilter('fonte', v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">Todas Fontes</SelectItem>
            {options.fontes.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
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
