import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { StagingStatus } from '@/hooks/useStagingNegocios';
import { cn } from '@/lib/utils';

interface StagingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StagingStatus | undefined;
  onStatusChange: (status: StagingStatus | undefined) => void;
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
  counts,
}: StagingFiltersProps) {
  const statusOptions: { value: StagingStatus | undefined; label: string; count: number }[] = [
    { value: undefined, label: 'Todos', count: counts.pendente + counts.aprovado + counts.rejeitado },
    { value: 'pendente', label: 'Pendentes', count: counts.pendente },
    { value: 'aprovado', label: 'Aprovados', count: counts.aprovado },
    { value: 'rejeitado', label: 'Rejeitados', count: counts.rejeitado },
  ];

  return (
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
  );
}
