import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlobalFilters } from '@/components/dashboard/GlobalFilters';
import { KPICardWithSparkline } from '@/components/dashboard/KPICardWithSparkline';
import { FunnelHorizontal } from '@/components/dashboard/FunnelHorizontal';
import { RankingTable } from '@/components/dashboard/RankingTable';
import { OrigemPerformance } from '@/components/dashboard/OrigemPerformance';
import { SDRAnalytics } from '@/components/dashboard/SDRAnalytics';
import { EspecialistasAnalytics } from '@/components/dashboard/EspecialistasAnalytics';
import { MetaProgress } from '@/components/dashboard/MetaProgress';
import { useNegocios, useFilterOptions, NegocioFilters } from '@/hooks/useNegocios';
import { useMetaGlobal } from '@/hooks/useMetas';
import { Loader2, AlertTriangle, DollarSign, Target, Calendar, TrendingUp, Users, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  // Default filters: current month (1st day to today)
  const getDefaultFilters = (): NegocioFilters => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      dataInicio: format(firstDayOfMonth, 'yyyy-MM-dd'),
      dataFim: format(today, 'yyyy-MM-dd'),
    };
  };

  const [filters, setFilters] = useState<NegocioFilters>(getDefaultFilters);
  
  // Get current month/year for meta
  const currentMonth = filters.dataInicio ? new Date(filters.dataInicio).getMonth() + 1 : new Date().getMonth() + 1;
  const currentYear = filters.dataInicio ? new Date(filters.dataInicio).getFullYear() : new Date().getFullYear();
  
  const { data: allNegocios, isLoading: loadingAll } = useNegocios();
  const filterOptions = useFilterOptions(allNegocios);
  const { data: negocios, isLoading } = useNegocios(filters);
  const { data: metaGlobal, isLoading: loadingMeta } = useMetaGlobal(currentMonth, currentYear);

  const executiveStats = useMemo(() => {
    if (!negocios || negocios.length === 0) {
      return {
        receitaTotal: 0,
        vendasRealizadas: 0,
        reunioesRealizadas: 0,
        taxaAgendamento: 0,
        taxaNoShow: 0,
        taxaShowUp: 0,
        taxaConversaoGeral: 0,
        totalLeads: 0,
        monthlyData: [],
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
    const taxaConversaoGeral = reunioesRealizadas > 0 ? (vendasRealizadas / reunioesRealizadas) * 100 : 0;

    // Monthly data for sparklines
    const monthlyMap: Record<string, { receita: number; vendas: number; leads: number }> = {};
    negocios.forEach(n => {
      if (n.data_inicio) {
        try {
          const date = parseISO(n.data_inicio);
          const monthKey = format(startOfMonth(date), 'yyyy-MM');
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { receita: 0, vendas: 0, leads: 0 };
          }
          monthlyMap[monthKey].leads += 1;
          if (n.venda_aprovada) {
            monthlyMap[monthKey].vendas += 1;
            monthlyMap[monthKey].receita += n.total || 0;
          }
        } catch (e) {}
      }
    });
    
    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        month: format(parseISO(key + '-01'), 'MMM', { locale: ptBR }),
        ...data,
        conversao: data.leads > 0 ? (data.vendas / data.leads) * 100 : 0,
      }));

    const reunioesAgendadasCount = reunioesAgendadas;

    return { 
      receitaTotal, 
      vendasRealizadas, 
      reunioesRealizadas, 
      reunioesAgendadas: reunioesAgendadasCount,
      taxaAgendamento, 
      taxaNoShow, 
      taxaShowUp, 
      taxaConversaoGeral,
      totalLeads,
      monthlyData,
    };
  }, [negocios]);

  // Prepare data for MetaProgress
  const realizadoData = useMemo(() => ({
    faturamento: executiveStats.receitaTotal,
    vendas: executiveStats.vendasRealizadas,
    reunioes: executiveStats.reunioesRealizadas,
    agendamentos: executiveStats.reunioesAgendadas,
  }), [executiveStats]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

  const formatCompactCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

  if (isLoading || loadingAll) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const hasData = negocios && negocios.length > 0;
  const sparklineReceita = executiveStats.monthlyData.map(d => d.receita);
  const sparklineVendas = executiveStats.monthlyData.map(d => d.vendas);
  const sparklineReuniao = executiveStats.monthlyData.map(d => d.leads);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Compact Filter Bar */}
        <GlobalFilters filters={filters} onFiltersChange={setFilters} options={filterOptions} />

        {!hasData ? (
          <div className="bi-card p-16 text-center">
            <AlertTriangle className="h-16 w-16 text-slate-500 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-3 text-slate-200">Nenhum dado encontrado</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Importe os dados do CRM através da opção "Importar Dados" no menu lateral.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-800/50 p-1 mb-4">
              <TabsTrigger value="home" className="rounded-md px-6 py-1.5 text-sm font-medium data-[state=active]:bg-slate-700 data-[state=active]:text-white">HOME</TabsTrigger>
              <TabsTrigger value="sdr" className="rounded-md px-6 py-1.5 text-sm font-medium data-[state=active]:bg-slate-700 data-[state=active]:text-white">SDRS</TabsTrigger>
              <TabsTrigger value="especialistas" className="rounded-md px-6 py-1.5 text-sm font-medium data-[state=active]:bg-slate-700 data-[state=active]:text-white">ESPECIALISTAS</TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-4 mt-0">
              {/* KPIs Row 1 - Main metrics with sparklines */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICardWithSparkline
                  title="Faturamento"
                  value={formatCurrency(executiveStats.receitaTotal)}
                  icon={DollarSign}
                  color="cyan"
                  sparklineData={sparklineReceita}
                />
                <KPICardWithSparkline
                  title="Vendas"
                  value={formatNumber(executiveStats.vendasRealizadas)}
                  icon={Target}
                  color="yellow"
                  sparklineData={sparklineVendas}
                />
                <KPICardWithSparkline
                  title="Total Leads"
                  value={formatNumber(executiveStats.totalLeads)}
                  icon={Users}
                  color="orange"
                  sparklineData={sparklineReuniao}
                />
                <KPICardWithSparkline
                  title="Reuniões"
                  value={formatNumber(executiveStats.reunioesRealizadas)}
                  icon={Calendar}
                  color="magenta"
                  sparklineData={sparklineReuniao}
                />
                <KPICardWithSparkline
                  title="Ticket Médio"
                  value={formatCurrency(executiveStats.vendasRealizadas > 0 ? executiveStats.receitaTotal / executiveStats.vendasRealizadas : 0)}
                  icon={TrendingUp}
                  color="green"
                  sparklineData={sparklineVendas}
                />
              </div>

              {/* KPIs Row 2 - Rates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bi-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">% Agendamento</span>
                    <TrendingUp className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className={`text-3xl font-bold ${executiveStats.taxaAgendamento >= 50 ? 'text-emerald-400' : executiveStats.taxaAgendamento >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {executiveStats.taxaAgendamento.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Meta: ≥50%</div>
                </div>
                
                <div className="bi-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">% No-Show</span>
                    <XCircle className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className={`text-3xl font-bold ${executiveStats.taxaNoShow <= 15 ? 'text-emerald-400' : executiveStats.taxaNoShow <= 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {executiveStats.taxaNoShow.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Meta: ≤20%</div>
                </div>
                
                <div className="bi-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">% Show-Up</span>
                    <Users className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className={`text-3xl font-bold ${executiveStats.taxaShowUp >= 80 ? 'text-emerald-400' : executiveStats.taxaShowUp >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
                    {executiveStats.taxaShowUp.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Meta: ≥80%</div>
                </div>

                <div className="bi-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">% Conversão Vendas</span>
                    <Target className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className={`text-3xl font-bold ${executiveStats.taxaConversaoGeral >= 25 ? 'text-emerald-400' : executiveStats.taxaConversaoGeral >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {executiveStats.taxaConversaoGeral.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Meta: ≥25%</div>
                </div>
              </div>


              {/* Main Grid - Funnel Left, Indicators Right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* Funnel - 2 columns */}
                <div className="lg:col-span-2 h-full">
                  <FunnelHorizontal negocios={negocios} />
                </div>

                {/* Indicadores - 1 column, stacked */}
                <div className="flex flex-col gap-2 h-full">
                  {/* Meta x Realizado */}
                  <div className="bi-card py-3 px-3 flex-1 flex flex-col">
                    <h3 className="bi-card-title mb-2 text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Meta x Realizado
                    </h3>
                    <div className="flex-1">
                      <MetaProgress meta={metaGlobal} realizado={realizadoData} />
                    </div>
                  </div>

                  {/* Indicadores de Performance */}
                  <div className="bi-card py-3 px-3 flex-1 flex flex-col">
                    <h3 className="bi-card-title mb-2 text-sm">Indicadores de Performance</h3>
                    <div className="space-y-2 flex-1 flex flex-col justify-around">
                      <div className="flex justify-between items-center bg-slate-800/50 rounded p-2.5 border border-slate-700/50">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">CPL</div>
                        </div>
                        <div className="text-base font-bold text-cyan-400">{formatCurrency(0)}</div>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/50 rounded p-2.5 border border-slate-700/50">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">CAC</div>
                        </div>
                        <div className="text-base font-bold text-orange-400">{formatCurrency(0)}</div>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/50 rounded p-2.5 border border-slate-700/50">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">ROAS</div>
                        </div>
                        <div className="text-base font-bold text-yellow-400">0x</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row - Chart and Origem */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Revenue Trend Chart */}
                <div className="bi-card">
                  <h3 className="bi-card-title mb-3">Tendência de Faturamento</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={executiveStats.monthlyData}>
                        <defs>
                          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickFormatter={formatCompactCurrency}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#f1f5f9' }}
                          formatter={(value: number) => [formatCurrency(value), 'Receita']}
                        />
                        <Area
                          type="monotone"
                          dataKey="receita"
                          stroke="#22d3ee"
                          strokeWidth={2}
                          fill="url(#revGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Origem Performance */}
                <OrigemPerformance negocios={negocios} />
              </div>

              {/* Rankings Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ranking Especialistas */}
                <RankingTable negocios={negocios} type="especialista" limit={4} />

                {/* Ranking SDRs */}
                <RankingTable negocios={negocios} type="sdr" limit={4} />
              </div>
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
