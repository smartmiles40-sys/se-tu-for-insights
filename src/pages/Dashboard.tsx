import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ExecutiveKPIs } from '@/components/dashboard/ExecutiveKPIs';
import { GlobalFilters } from '@/components/dashboard/GlobalFilters';
import { CommercialFunnel } from '@/components/dashboard/CommercialFunnel';
import { SDRPerformance } from '@/components/dashboard/SDRPerformance';
import { EspecialistasPerformance } from '@/components/dashboard/EspecialistasPerformance';
import { useNegocios, useFilterOptions, NegocioFilters } from '@/hooks/useNegocios';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  const [filters, setFilters] = useState<NegocioFilters>({});
  
  // Fetch all data first to get filter options
  const { data: allNegocios, isLoading: loadingAll } = useNegocios();
  const filterOptions = useFilterOptions(allNegocios);
  
  // Fetch filtered data
  const { data: negocios, isLoading } = useNegocios(filters);

  // Estatísticas executivas calculadas
  const executiveStats = useMemo(() => {
    if (!negocios || negocios.length === 0) {
      return {
        receitaTotal: 0,
        vendasRealizadas: 0,
        reunioesRealizadas: 0,
        taxaAgendamento: 0,
        taxaNoShow: 0,
        taxaShowUp: 0,
        totalLeads: 0,
      };
    }

    const totalLeads = negocios.length;
    const reunioesAgendadas = negocios.filter(n => n.reuniao_agendada).length;
    const reunioesRealizadas = negocios.filter(n => n.reuniao_realizada).length;
    
    // No-show: agendada mas não realizada
    const noShows = negocios.filter(n => n.reuniao_agendada && !n.reuniao_realizada).length;
    
    const vendas = negocios.filter(n => n.venda_aprovada);
    const vendasRealizadas = vendas.length;
    const receitaTotal = vendas.reduce((sum, n) => sum + (n.total || 0), 0);

    const taxaAgendamento = totalLeads > 0 ? (reunioesAgendadas / totalLeads) * 100 : 0;
    const taxaNoShow = reunioesAgendadas > 0 ? (noShows / reunioesAgendadas) * 100 : 0;
    const taxaShowUp = reunioesAgendadas > 0 ? (reunioesRealizadas / reunioesAgendadas) * 100 : 0;

    return {
      receitaTotal,
      vendasRealizadas,
      reunioesRealizadas,
      taxaAgendamento,
      taxaNoShow,
      taxaShowUp,
      totalLeads,
    };
  }, [negocios]);

  if (isLoading || loadingAll) {
    return (
      <DashboardLayout title="Dashboard Executivo" subtitle="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const hasData = negocios && negocios.length > 0;

  return (
    <DashboardLayout 
      title="Dashboard Executivo" 
      subtitle={hasData ? `${negocios.length} negócios analisados` : 'Painel de Controle Comercial'}
    >
      <div className="space-y-8">
        {/* Filtros Globais */}
        <GlobalFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
          options={filterOptions}
        />

        {!hasData ? (
          <div className="bg-card rounded-xl p-16 shadow-sm border border-border/50 text-center">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-2xl font-display font-semibold text-foreground mb-3">
              Nenhum dado encontrado
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Importe os dados do CRM através da opção "Importar Dados" no menu lateral para visualizar o dashboard.
            </p>
          </div>
        ) : (
          <>
            {/* KPIs Executivos - Poucos, grandes, decisórios */}
            <ExecutiveKPIs stats={executiveStats} />

            {/* Funil Comercial - Analítico */}
            <CommercialFunnel negocios={negocios} />

            {/* Abas SDR e Especialistas - Nunca misturar */}
            <Tabs defaultValue="sdr" className="w-full">
              <TabsList className="grid w-full max-w-lg grid-cols-2 mb-6">
                <TabsTrigger value="sdr" className="text-base">
                  SDRs — Qualificação
                </TabsTrigger>
                <TabsTrigger value="especialistas" className="text-base">
                  Especialistas — Fechamento
                </TabsTrigger>
              </TabsList>
              <TabsContent value="sdr">
                <SDRPerformance negocios={negocios} />
              </TabsContent>
              <TabsContent value="especialistas">
                <EspecialistasPerformance negocios={negocios} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
