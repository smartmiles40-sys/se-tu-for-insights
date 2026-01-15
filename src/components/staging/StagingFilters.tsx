import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, FileUp, Webhook } from 'lucide-react';
import { StagingStatus } from '@/hooks/useStagingNegocios';
import { cn } from '@/lib/utils';

export type SourceFilter = 'all' | 'import_arquivo' | 'n8n';

interface StagingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StagingStatus | undefined;
  onStatusChange: (status: StagingStatus | undefined) => void;
  sourceFilter?: SourceFilter;
  onSourceChange?: (source: SourceFilter) => void;
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

  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
