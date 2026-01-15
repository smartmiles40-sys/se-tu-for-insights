import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StagingTable } from '@/components/staging/StagingTable';
import { StagingFilters, SourceFilter } from '@/components/staging/StagingFilters';
import { StagingActions } from '@/components/staging/StagingActions';
import { StagingPagination } from '@/components/staging/StagingPagination';
import { useStagingNegocios, StagingStatus } from '@/hooks/useStagingNegocios';
import { FileSpreadsheet, Clock, CheckCircle, XCircle } from 'lucide-react';

const PAGE_SIZE = 50;

export default function StagingPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StagingStatus | undefined>('pendente');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: allData, isLoading } = useStagingNegocios();
  
  // Filter data based on current filters
  const filteredData = useMemo(() => {
    if (!allData) return [];
    
    let result = allData;
    
    if (statusFilter) {
      result = result.filter(d => d.status === statusFilter);
    }
    
    if (sourceFilter !== 'all') {
      result = result.filter(d => d.source === sourceFilter);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(d => 
        d.nome?.toLowerCase().includes(searchLower) ||
        d.vendedor?.toLowerCase().includes(searchLower) ||
        d.pipeline?.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [allData, statusFilter, sourceFilter, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, currentPage]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [statusFilter, sourceFilter, search]);

  // Calculate counts for filters (consider source filter)
  const counts = useMemo(() => {
    if (!allData) return { pendente: 0, aprovado: 0, rejeitado: 0 };
    
    let filtered = allData;
    if (sourceFilter !== 'all') {
      filtered = allData.filter(d => d.source === sourceFilter);
    }
    
    return {
      pendente: filtered.filter(d => d.status === 'pendente').length,
      aprovado: filtered.filter(d => d.status === 'aprovado').length,
      rejeitado: filtered.filter(d => d.status === 'rejeitado').length,
    };
  }, [allData, sourceFilter]);

  // Check if selected items are all pending (for showing approve/reject buttons)
  const selectedArePending = useMemo(() => {
    if (!allData || selectedIds.length === 0) return false;
    return selectedIds.every(id => {
      const record = allData.find(d => d.id === id);
      return record?.status === 'pendente';
    });
  }, [allData, selectedIds]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <FileSpreadsheet className="h-7 w-7" />
              Gerenciar Dados
            </h1>
            <p className="text-muted-foreground mt-1">
              Revise e aprove dados importados via arquivo ou recebidos do n8n antes de entrarem no dashboard.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{counts.pendente}</p>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{counts.aprovado}</p>
                    <p className="text-sm text-muted-foreground">Aprovados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{counts.rejeitado}</p>
                    <p className="text-sm text-muted-foreground">Rejeitados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Registros</CardTitle>
                <CardDescription>
                  Clique em uma célula para editar. Selecione registros pendentes para aprovar, rejeitar ou excluir.
                </CardDescription>
              </div>
              <StagingActions
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                showApproveReject={selectedArePending}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <StagingFilters
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              sourceFilter={sourceFilter}
              onSourceChange={setSourceFilter}
              counts={counts}
            />

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <StagingTable
                    data={paginatedData}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                  />
                </div>
                <StagingPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredData.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
