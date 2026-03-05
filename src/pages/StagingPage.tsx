import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StagingTable } from '@/components/staging/StagingTable';
import { StagingFilters, SourceFilter, AdvancedFilters } from '@/components/staging/StagingFilters';
import { StagingActions } from '@/components/staging/StagingActions';
import { StagingPagination } from '@/components/staging/StagingPagination';
import { useStagingNegocios, StagingStatus } from '@/hooks/useStagingNegocios';
import { FileSpreadsheet, Clock, CheckCircle, XCircle, Heart, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useState as useStateAlias } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const PAGE_SIZE = 200;

export default function StagingPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StagingStatus | undefined>('pendente');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: allData, isLoading } = useStagingNegocios();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingRelacionamento, setDeletingRelacionamento] = useStateAlias(false);

  const handleDeleteRelacionamento = async () => {
    setDeletingRelacionamento(true);
    try {
      const { error } = await supabase
        .from('clientes_relacionamento')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['clientes_relacionamento'] });
      toast({ title: 'Dados excluídos', description: 'Os dados de relacionamento foram removidos com sucesso.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir os dados de relacionamento.' });
    } finally {
      setDeletingRelacionamento(false);
    }
  };
  
  // Extract unique filter options from data
  const filterOptions = useMemo(() => {
    if (!allData) return { 
      pipelines: [], 
      vendedores: [], 
      sdrs: [], 
      quemVendeu: [], 
      responsavelReuniao: [], 
      fases: [], 
      tiposVenda: [], 
      fontes: [] 
    };
    
    const pipelines = [...new Set(allData.map(d => d.pipeline).filter(Boolean))] as string[];
    const vendedores = [...new Set(allData.map(d => d.vendedor).filter(Boolean))] as string[];
    const sdrs = [...new Set(allData.map(d => d.sdr).filter(Boolean))] as string[];
    const quemVendeu = [...new Set(allData.map(d => d.quem_vendeu).filter(Boolean))] as string[];
    const responsavelReuniao = [...new Set(allData.map(d => d.responsavel_reuniao).filter(Boolean))] as string[];
    const fases = [...new Set(allData.map(d => d.fase).filter(Boolean))] as string[];
    const tiposVenda = [...new Set(allData.map(d => d.tipo_venda).filter(Boolean))] as string[];
    const fontes = [...new Set(allData.map(d => d.lead_fonte).filter(Boolean))] as string[];
    
    return {
      pipelines: pipelines.sort(),
      vendedores: vendedores.sort(),
      sdrs: sdrs.sort(),
      quemVendeu: quemVendeu.sort(),
      responsavelReuniao: responsavelReuniao.sort(),
      fases: fases.sort(),
      tiposVenda: tiposVenda.sort(),
      fontes: fontes.sort(),
    };
  }, [allData]);
  
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
    
    // Advanced filters
    if (advancedFilters.pipeline) {
      result = result.filter(d => d.pipeline === advancedFilters.pipeline);
    }
    
    if (advancedFilters.vendedor) {
      result = result.filter(d => d.vendedor === advancedFilters.vendedor);
    }
    
    if (advancedFilters.sdr) {
      result = result.filter(d => d.sdr === advancedFilters.sdr);
    }
    
    if (advancedFilters.quemVendeu) {
      result = result.filter(d => d.quem_vendeu === advancedFilters.quemVendeu);
    }
    
    if (advancedFilters.responsavelReuniao) {
      result = result.filter(d => d.responsavel_reuniao === advancedFilters.responsavelReuniao);
    }
    
    if (advancedFilters.fase) {
      result = result.filter(d => d.fase === advancedFilters.fase);
    }
    
    if (advancedFilters.tipoVenda) {
      result = result.filter(d => d.tipo_venda === advancedFilters.tipoVenda);
    }
    
    if (advancedFilters.fonte) {
      result = result.filter(d => d.lead_fonte === advancedFilters.fonte);
    }
    
    return result;
  }, [allData, statusFilter, sourceFilter, search, advancedFilters]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, currentPage]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [statusFilter, sourceFilter, search, advancedFilters]);

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                <FileSpreadsheet className="h-7 w-7" />
                Gerenciar Dados
              </h1>
              <p className="text-muted-foreground mt-1">
                Revise e aprove dados importados via arquivo ou recebidos do n8n antes de entrarem no dashboard.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" disabled={deletingRelacionamento}>
                  {deletingRelacionamento ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                  Excluir Relacionamento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir dados de relacionamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todos os dados importados na tabela de relacionamento serão permanentemente removidos. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteRelacionamento} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              advancedFilters={advancedFilters}
              onAdvancedFiltersChange={setAdvancedFilters}
              filterOptions={filterOptions}
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
