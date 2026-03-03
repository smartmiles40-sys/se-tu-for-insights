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
import { NavLink, useLocation } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GlobalFiltersProps {
  filters: NegocioFilters;
  onFiltersChange: (filters: NegocioFilters) => void;
  options: {
    sdrs: string[];
    vendedores: string[];
    quemVendeu: string[];
    pipelines: string[];
    utmSources: string[];
    leadFontes: string[];
    tiposVenda: string[];
  };
}

export function GlobalFilters({ filters, onFiltersChange, options }: GlobalFiltersProps) {
  const hasFilters = Object.entries(filters).some(([key, v]) => {
    if (key === 'vendedores' || key === 'tiposVenda' || key === 'quemVendeu') {
      return Array.isArray(v) && v.length > 0;
    }
    return v !== undefined && v !== '';
  });

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof NegocioFilters, value: string | string[] | undefined) => {
    if (key === 'vendedores' || key === 'tiposVenda' || key === 'quemVendeu') {
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
  const handleQuemVendeuToggle = (nome: string, checked: boolean) => {
    const current = filters.quemVendeu || [];
    if (checked) {
      updateFilter('quemVendeu', [...current, nome]);
    } else {
      updateFilter('quemVendeu', current.filter(v => v !== nome));
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

  const fromDate = filters.dataInicioFrom ? parseISO(filters.dataInicioFrom) : undefined;
  const toDate = filters.dataInicioTo ? parseISO(filters.dataInicioTo) : undefined;

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

      {/* Date Range Filter - Data de Início */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 justify-start text-left font-normal min-w-[180px]',
              (fromDate || toDate) && 'border-primary/50'
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">
              {fromDate && toDate
                ? `${format(fromDate, 'dd/MM/yy')} - ${format(toDate, 'dd/MM/yy')}`
                : fromDate
                  ? `A partir de ${format(fromDate, 'dd/MM/yy')}`
                  : toDate
                    ? `Até ${format(toDate, 'dd/MM/yy')}`
                    : 'Data de início'}
            </span>
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
                    ? `${filters.vendedores.length} especialista(s)`
                    : 'Especialista'}
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

      {/* Quem Vendeu Multi-Select */}
      {options.quemVendeu.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-8 justify-between min-w-[140px]',
                filters.quemVendeu && filters.quemVendeu.length > 0 && 'border-primary/50'
              )}
            >
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {filters.quemVendeu && filters.quemVendeu.length > 0
                    ? `${filters.quemVendeu.length} vendedor(es)`
                    : 'Quem Vendeu'}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-popover border-border z-50" align="start">
            <div className="space-y-2">
              {options.quemVendeu.map((nome) => (
                <div key={nome} className="flex items-center space-x-2">
                  <Checkbox
                    id={`quemvendeu-${nome}`}
                    checked={filters.quemVendeu?.includes(nome) || false}
                    onCheckedChange={(checked) => handleQuemVendeuToggle(nome, checked === true)}
                  />
                  <label
                    htmlFor={`quemvendeu-${nome}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {nome}
                  </label>
                </div>
              ))}
              {filters.quemVendeu && filters.quemVendeu.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilter('quemVendeu', [])}
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
