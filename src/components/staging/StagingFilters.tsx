import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileUp, Webhook, X, ChevronDown, ChevronUp } from 'lucide-react';
import { StagingStatus } from '@/hooks/useStagingNegocios';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export type SourceFilter = 'all' | 'import_arquivo' | 'n8n';

export interface AdvancedFilters {
  pipeline?: string;
  vendedor?: string;
  sdr?: string;
  quemVendeu?: string;
  responsavelReuniao?: string;
  fase?: string;
  tipoVenda?: string;
  fonte?: string;
}

interface FilterOptions {
  pipelines: string[];
  vendedores: string[];
  sdrs: string[];
  quemVendeu: string[];
  responsavelReuniao: string[];
  fases: string[];
  tiposVenda: string[];
  fontes: string[];
}

interface StagingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StagingStatus | undefined;
  onStatusChange: (status: StagingStatus | undefined) => void;
  sourceFilter?: SourceFilter;
  onSourceChange?: (source: SourceFilter) => void;
  advancedFilters?: AdvancedFilters;
  onAdvancedFiltersChange?: (filters: AdvancedFilters) => void;
  filterOptions?: FilterOptions;
  counts: {
    pendente: number;
    aprovado: number;
    rejeitado: number;
  };
}

export function StagingFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sourceFilter = 'all',
  onSourceChange,
  advancedFilters = {},
  onAdvancedFiltersChange,
  filterOptions = { pipelines: [], vendedores: [], sdrs: [], quemVendeu: [], responsavelReuniao: [], fases: [], tiposVenda: [], fontes: [] },
  counts,
}: StagingFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions: { value: StagingStatus | undefined; label: string; count: number }[] = [
    { value: undefined, label: 'Todos', count: counts.pendente + counts.aprovado + counts.rejeitado },
    { value: 'pendente', label: 'Pendentes', count: counts.pendente },
    { value: 'aprovado', label: 'Aprovados', count: counts.aprovado },
    { value: 'rejeitado', label: 'Rejeitados', count: counts.rejeitado },
  ];

  const sourceOptions: { value: SourceFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Todas Origens', icon: null },
    { value: 'import_arquivo', label: 'Arquivo', icon: <FileUp className="h-3 w-3" /> },
    { value: 'n8n', label: 'n8n', icon: <Webhook className="h-3 w-3" /> },
  ];

  const activeFiltersCount = Object.values(advancedFilters).filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0;

  const handleClearFilters = () => {
    if (onAdvancedFiltersChange) {
      onAdvancedFiltersChange({});
    }
  };

  const FilterSelect = ({ 
    label, 
    value, 
    options, 
    onChange 
  }: { 
    label: string; 
    value?: string; 
    options: string[]; 
    onChange: (value: string | undefined) => void;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select
        value={value || 'all'}
        onValueChange={(val) => onChange(val === 'all' ? undefined : val)}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder={`Todos`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Status Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, vendedor ou pipeline..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {statusOptions.map((option) => (
            <Button
              key={option.label}
              variant={statusFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(option.value)}
              className="gap-2"
            >
              {option.label}
              <Badge
                variant="secondary"
                className={cn(
                  'ml-1 h-5 min-w-[20px] px-1.5',
                  statusFilter === option.value && 'bg-primary-foreground/20 text-primary-foreground'
                )}
              >
                {option.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Source Filter */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {onSourceChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Origem:</span>
            {sourceOptions.map((option) => (
              <Button
                key={option.value}
                variant={sourceFilter === option.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onSourceChange(option.value)}
                className="gap-1.5 h-7"
              >
                {option.icon}
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {/* Toggle Advanced Filters */}
        {onAdvancedFiltersChange && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros Avançados
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeFiltersCount}
              </Badge>
            )}
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>

      {/* Advanced Filters - Collapsible */}
      {onAdvancedFiltersChange && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent>
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              {/* Row 1: Pipeline, Vendedor, SDR, Quem Vendeu */}
              <div className="flex flex-wrap gap-4">
                <FilterSelect
                  label="Pipeline"
                  value={advancedFilters.pipeline}
                  options={filterOptions.pipelines}
                  onChange={(val) => onAdvancedFiltersChange({ ...advancedFilters, pipeline: val })}
                />
                <FilterSelect
                  label="Vendedor"
                  value={advancedFilters.vendedor}
                  options={filterOptions.vendedores}
                  onChange={(val) => onAdvancedFiltersChange({ ...advancedFilters, vendedor: val })}
                />
                <FilterSelect
                  label="SDR"
                  value={advancedFilters.sdr}
                  options={filterOptions.sdrs}
                  onChange={(val) => onAdvancedFiltersChange({ ...advancedFilters, sdr: val })}
                />
                <FilterSelect
                  label="Quem Vendeu"
                  value={advancedFilters.quemVendeu}
                  options={filterOptions.quemVendeu}
                  onChange={(val) => onAdvancedFiltersChange({ ...advancedFilters, quemVendeu: val })}
                />
              </div>

              {/* Row 2: Resp. Reunião, Fase, Tipo Venda, Fonte */}
              <div className="flex flex-wrap gap-4">
                <FilterSelect
                  label="Resp. Reunião"
                  value={advancedFilters.responsavelReuniao}
                  options={filterOptions.responsavelReuniao}
                  onChange={(val) => onAdvancedFiltersChange({ ...advancedFilters, responsavelReuniao: val })}
                />
                <FilterSelect
                  label="Fase"
                  value={advancedFilters.fase}
                  options={filterOptions.fases}
                  onChange={(val) => onAdvancedFiltersChange({ ...advancedFilters, fase: val })}
                />
                <FilterSelect
                  label="Tipo Venda"
                  value={advancedFilters.tipoVenda}
                  options={filterOptions.tiposVenda}
                  onChange={(val) => onAdvancedFiltersChange({ ...advancedFilters, tipoVenda: val })}
                />
                <FilterSelect
                  label="Fonte"
                  value={advancedFilters.fonte}
                  options={filterOptions.fontes}
                  onChange={(val) => onAdvancedFiltersChange({ ...advancedFilters, fonte: val })}
                />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    Limpar todos os filtros
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
