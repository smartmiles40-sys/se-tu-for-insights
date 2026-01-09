import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { NOCKPICard } from '@/components/dashboard/NOCKPICard';
import { GlobalFilters } from '@/components/dashboard/GlobalFilters';
import { VisualFunnel } from '@/components/dashboard/VisualFunnel';
import { CriticalRatesPanel } from '@/components/dashboard/CriticalRatesPanel';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ConversionTrendChart } from '@/components/dashboard/ConversionTrendChart';
import { SDRAnalytics } from '@/components/dashboard/SDRAnalytics';
import { EspecialistasAnalytics } from '@/components/dashboard/EspecialistasAnalytics';
import { useNegocios, useFilterOptions, NegocioFilters } from '@/hooks/useNegocios';
import { Loader2, AlertTriangle, DollarSign, Target, Calendar, TrendingUp, Users, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  const [filters, setFilters] = useState<NegocioFilters>({});
  
  const { data: allNegocios, isLoading: loadingAll } = useNegocios();
  const filterOptions = useFilterOptions(allNegocios);
  const { data: negocios, isLoading } = useNegocios(filters);

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
    const noShows = negocios.filter(n => n.reuniao_agendada && !n.reuniao_realizada).length;
    const vendas = negocios.filter(n => n.venda_aprovada);
    const vendasRealizadas = vendas.length;
    const receitaTotal = vendas.reduce((sum, n) => sum + (n.total || 0), 0);

    const taxaAgendamento = totalLeads > 0 ? (reunioesAgendadas / totalLeads) * 100 : 0;
    const taxaNoShow = reunioesAgendadas > 0 ? (noShows / reunioesAgendadas) * 100 : 0;
    const taxaShowUp = reunioesAgendadas > 0 ? (reunioesRealizadas / reunioesAgendadas) * 100 : 0;

    return { receitaTotal, vendasRealizadas, reunioesRealizadas, taxaAgendamento, taxaNoShow, taxaShowUp, totalLeads };
  }, [negocios]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

  if (isLoading || loadingAll) {
    return (
      <DashboardLayout title="Torre de Controle" subtitle="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const hasData = negocios && negocios.length > 0;

  return (
    <DashboardLayout 
      title="Torre de Controle" 
      subtitle={hasData ? `${negocios.length} negócios analisados` : 'Painel de Comando Comercial'}
    >
      <div className="space-y-6">
        <GlobalFilters filters={filters} onFiltersChange={setFilters} options={filterOptions} />

        {!hasData ? (
          <div className="noc-panel p-16 text-center">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-2xl font-display font-semibold mb-3">Nenhum dado encontrado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Importe os dados do CRM através da opção "Importar Dados" no menu lateral.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="home" className="rounded-lg font-semibold text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">HOME</TabsTrigger>
              <TabsTrigger value="sdr" className="rounded-lg font-semibold text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">SDRS</TabsTrigger>
              <TabsTrigger value="especialistas" className="rounded-lg font-semibold text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">ESPECIALISTAS</TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-6">
              {/* KPIs Grandes - Clean Card Design */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <NOCKPICard 
                  title="Faturamento" 
                  value={formatCurrency(executiveStats.receitaTotal)} 
                  icon={DollarSign} 
                  status="good" 
                />
                <NOCKPICard 
                  title="Vendas" 
                  value={formatNumber(executiveStats.vendasRealizadas)} 
                  icon={Target} 
                  status="neutral" 
                />
                <NOCKPICard 
                  title="Reuniões" 
                  value={formatNumber(executiveStats.reunioesRealizadas)} 
                  icon={Calendar} 
                  status="neutral" 
                />
                <NOCKPICard 
                  title="% Agendamento" 
                  value={`${executiveStats.taxaAgendamento.toFixed(1)}%`} 
                  icon={TrendingUp} 
                  status={executiveStats.taxaAgendamento >= 50 ? 'good' : executiveStats.taxaAgendamento >= 30 ? 'warning' : 'critical'} 
                  idealValue="≥50%" 
                />
                <NOCKPICard 
                  title="% No-Show" 
                  value={`${executiveStats.taxaNoShow.toFixed(1)}%`} 
                  icon={XCircle} 
                  status={executiveStats.taxaNoShow <= 15 ? 'good' : executiveStats.taxaNoShow <= 25 ? 'warning' : 'critical'} 
                  idealValue="≤20%" 
                />
                <NOCKPICard 
                  title="% Show-Up" 
                  value={`${executiveStats.taxaShowUp.toFixed(1)}%`} 
                  icon={Users} 
                  status={executiveStats.taxaShowUp >= 80 ? 'good' : executiveStats.taxaShowUp >= 60 ? 'warning' : 'critical'} 
                  idealValue="≥80%" 
                />
              </div>

              {/* Taxas Críticas */}
              <CriticalRatesPanel negocios={negocios} />

              {/* Funil + Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VisualFunnel negocios={negocios} />
                <RevenueChart negocios={negocios} />
              </div>

              <ConversionTrendChart negocios={negocios} />
            </TabsContent>

            <TabsContent value="sdr">
              <SDRAnalytics negocios={negocios} />
            </TabsContent>

            <TabsContent value="especialistas">
              <EspecialistasAnalytics negocios={negocios} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
