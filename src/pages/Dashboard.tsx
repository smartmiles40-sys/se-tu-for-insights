import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { SalesFunnel } from '@/components/dashboard/SalesFunnel';
import { SDRDashboard } from '@/components/dashboard/SDRDashboard';
import { EspecialistasDashboard } from '@/components/dashboard/EspecialistasDashboard';
import { useNegocios, useNegociosStats, useFilterOptions, NegocioFilters } from '@/hooks/useNegocios';
import { Loader2, TrendingUp, Users, Calendar, DollarSign, Target, Phone, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  const [filters, setFilters] = useState<NegocioFilters>({});
  
  // Fetch all data first to get filter options
  const { data: allNegocios, isLoading: loadingAll } = useNegocios();
  const filterOptions = useFilterOptions(allNegocios);
  
  // Fetch filtered data
  const { data: negocios, isLoading } = useNegocios(filters);
  const stats = useNegociosStats(negocios);

  if (isLoading || loadingAll) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Carregando...">
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
      subtitle={hasData ? `${stats.totalNegocios} negócios analisados` : 'Sem dados'}
    >
      <div className="space-y-6">
        {/* Filters */}
        <FilterBar 
          filters={filters} 
          onFiltersChange={setFilters} 
          options={filterOptions}
        />

        {!hasData ? (
          <div className="dashboard-section text-center py-16">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum dado encontrado
            </h3>
            <p className="text-muted-foreground">
              Importe dados do CRM para visualizar o dashboard.
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Negócios"
                value={stats.totalNegocios}
                icon={<TrendingUp className="h-5 w-5 text-primary" />}
              />
              <KPICard
                title="Reuniões Agendadas"
                value={stats.reunioesAgendadas}
                subtitle={`${stats.reunioesRealizadas} realizadas`}
                icon={<Calendar className="h-5 w-5 text-primary" />}
              />
              <KPICard
                title="Taxa No-Show"
                value={stats.taxaNoShow}
                format="percent"
                icon={<Phone className="h-5 w-5 text-destructive" />}
              />
              <KPICard
                title="Vendas Realizadas"
                value={stats.vendasRealizadas}
                icon={<Target className="h-5 w-5 text-accent" />}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              <KPICard
                title="Receita Total"
                value={stats.receitaTotal}
                format="currency"
                icon={<DollarSign className="h-5 w-5 text-success" />}
              />
              <KPICard
                title="Ticket Médio"
                value={stats.ticketMedio}
                format="currency"
              />
              <KPICard
                title="Taxa Conversão"
                value={stats.taxaConversao}
                format="percent"
                subtitle="Reunião → Venda"
              />
              <KPICard
                title="MQL → SQL"
                value={stats.sql}
                subtitle={`de ${stats.mql} MQLs`}
                icon={<Users className="h-5 w-5 text-primary" />}
              />
            </div>

            {/* Sales Funnel */}
            <SalesFunnel negocios={negocios} />

            {/* Tabs for SDR and Especialistas */}
            <Tabs defaultValue="sdr" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="sdr">SDRs</TabsTrigger>
                <TabsTrigger value="especialistas">Especialistas</TabsTrigger>
              </TabsList>
              <TabsContent value="sdr" className="mt-6">
                <SDRDashboard negocios={negocios} />
              </TabsContent>
              <TabsContent value="especialistas" className="mt-6">
                <EspecialistasDashboard negocios={negocios} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
