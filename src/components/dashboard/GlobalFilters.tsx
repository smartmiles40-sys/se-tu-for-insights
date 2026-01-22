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
import { CalendarIcon, X, ChevronDown, User, Users, UserCheck, Megaphone } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { NegocioFilters } from '@/hooks/useNegocios';
import { NavLink, useLocation } from 'react-router-dom';

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

  const handleTipoVendaToggle = (tipo: string, checked: boolean) => {
    const current = filters.tiposVenda || [];
    if (checked) {
      updateFilter('tiposVenda', [...current, tipo]);
    } else {
      updateFilter('tiposVenda', current.filter(t => t !== tipo));
    }
  };

  const location = useLocation();
  
  const navLinks = [
    { path: '/sdr', label: 'SDRs', icon: Users },
    { path: '/especialistas', label: 'Especialistas', icon: UserCheck },
    { path: '/marketing', label: 'Marketing', icon: Megaphone },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
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

      {/* Date Range */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'w-[130px] justify-start text-left font-normal h-8',
                !filters.dataInicio && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {filters.dataInicio ? (
                format(new Date(filters.dataInicio), 'dd/MM/yyyy', { locale: ptBR })
              ) : (
                <span className="text-xs">Data início</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
            <Calendar
              mode="single"
              selected={filters.dataInicio ? new Date(filters.dataInicio + 'T12:00:00') : undefined}
              onSelect={(date) => {
                if (date) {
                  updateFilter('dataInicio', format(date, 'yyyy-MM-dd'));
                } else {
                  updateFilter('dataInicio', undefined);
                }
              }}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-xs">até</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'w-[130px] justify-start text-left font-normal h-8',
                !filters.dataFim && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {filters.dataFim ? (
                format(new Date(filters.dataFim), 'dd/MM/yyyy', { locale: ptBR })
              ) : (
                <span className="text-xs">Data fim</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
            <Calendar
              mode="single"
              selected={filters.dataFim ? new Date(filters.dataFim + 'T12:00:00') : undefined}
              onSelect={(date) => {
                if (date) {
                  updateFilter('dataFim', format(date, 'yyyy-MM-dd'));
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

      {/* Vendedor Multi-Select */}
      {options.vendedores.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 justify-between min-w-[140px]',
                filters.vendedores && filters.vendedores.length > 0 && 'border-primary/50'
              )}
            >
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {filters.vendedores && filters.vendedores.length > 0
                    ? `${filters.vendedores.length} vendedor(es)`
                    : 'Vendedor'}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-popover border-border z-50" align="start">
            <div className="space-y-2">
              {options.vendedores.map((vendedor) => (
                <div key={vendedor} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vendedor-${vendedor}`}
                    checked={filters.vendedores?.includes(vendedor) || false}
                    onCheckedChange={(checked) => handleVendedorToggle(vendedor, checked === true)}
                  />
                  <label
                    htmlFor={`vendedor-${vendedor}`}
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
                  <X className="h-3 w-3 mr-1" />
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
          <SelectTrigger className="w-[140px] h-8 text-xs">
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

      {/* Lead Fonte Filter */}
      {options.leadFontes.length > 0 && (
        <Select
          value={filters.leadFonte || 'all'}
          onValueChange={(v) => updateFilter('leadFonte', v)}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Fonte Lead" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">Todas Fontes</SelectItem>
            {options.leadFontes.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Tipo de Venda Multi-Select */}
      {options.tiposVenda.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 justify-between min-w-[140px]',
                filters.tiposVenda && filters.tiposVenda.length > 0 && 'border-primary/50'
              )}
            >
              <span className="text-xs">
                {filters.tiposVenda && filters.tiposVenda.length > 0
                  ? `${filters.tiposVenda.length} tipo(s)`
                  : 'Tipo de Venda'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-popover border-border z-50" align="start">
            <div className="space-y-2">
              {options.tiposVenda.map((tipo) => (
                <div key={tipo} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tipo-${tipo}`}
                    checked={filters.tiposVenda?.includes(tipo) || false}
                    onCheckedChange={(checked) => handleTipoVendaToggle(tipo, checked === true)}
                  />
                  <label
                    htmlFor={`tipo-${tipo}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {tipo}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 text-muted-foreground hover:text-destructive"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Limpar</span>
        </Button>
      )}
    </div>
  );
}
