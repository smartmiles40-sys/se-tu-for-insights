import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileUp, Webhook, X } from 'lucide-react';
import { StagingStatus } from '@/hooks/useStagingNegocios';
import { cn } from '@/lib/utils';

export type SourceFilter = 'all' | 'import_arquivo' | 'n8n';

export interface AdvancedFilters {
  pipeline?: string;
  vendedor?: string;
  sdr?: string;
}

interface FilterOptions {
  pipelines: string[];
  vendedores: string[];
  sdrs: string[];
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
  filterOptions = { pipelines: [], vendedores: [], sdrs: [] },
  counts,
}: StagingFiltersProps) {
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

  const hasActiveFilters = advancedFilters.pipeline || advancedFilters.vendedor || advancedFilters.sdr;

  const handleClearFilters = () => {
    if (onAdvancedFiltersChange) {
      onAdvancedFiltersChange({});
    }
  };

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

      {/* Source and Advanced Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Source Filter */}
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

        {/* Advanced Filters */}
        {onAdvancedFiltersChange && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Pipeline Filter */}
            <Select
              value={advancedFilters.pipeline || 'all'}
              onValueChange={(value) => 
                onAdvancedFiltersChange({
                  ...advancedFilters,
                  pipeline: value === 'all' ? undefined : value
                })
              }
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Pipelines</SelectItem>
                {filterOptions.pipelines.map((pipeline) => (
                  <SelectItem key={pipeline} value={pipeline}>
                    {pipeline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Vendedor Filter */}
            <Select
              value={advancedFilters.vendedor || 'all'}
              onValueChange={(value) => 
                onAdvancedFiltersChange({
                  ...advancedFilters,
                  vendedor: value === 'all' ? undefined : value
                })
              }
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Vendedores</SelectItem>
                {filterOptions.vendedores.map((vendedor) => (
                  <SelectItem key={vendedor} value={vendedor}>
                    {vendedor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* SDR Filter */}
            <Select
              value={advancedFilters.sdr || 'all'}
              onValueChange={(value) => 
                onAdvancedFiltersChange({
                  ...advancedFilters,
                  sdr: value === 'all' ? undefined : value
                })
              }
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="SDR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos SDRs</SelectItem>
                {filterOptions.sdrs.map((sdr) => (
                  <SelectItem key={sdr} value={sdr}>
                    {sdr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
