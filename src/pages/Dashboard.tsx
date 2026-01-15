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
import { MetaProgressCompact } from '@/components/dashboard/MetaProgressCompact';
import { DailyRevenueChart } from '@/components/dashboard/DailyRevenueChart';
import { useNegocios, useFilterOptions, NegocioFilters } from '@/hooks/useNegocios';
import { useMetaGlobal } from '@/hooks/useMetas';
import { Loader2, AlertTriangle, DollarSign, Target, Calendar, TrendingUp, Users, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO, startOfMonth, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PIPELINE_PRE_VENDAS, PIPELINE_COMERCIAL, isPipelineValido, isPreVendas, isComercial } from '@/lib/pipelines';

export default function Dashboard() {
  // Default filters: current month (1st day to today)
  const getDefaultFilters = (): NegocioFilters => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed
    const day = today.getDate();
    
    // Use ISO format directly to avoid timezone issues
    const firstDayOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const todayFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return {
      dataInicio: firstDayOfMonth,
      dataFim: todayFormatted,
    };
  };

  const [filters, setFilters] = useState<NegocioFilters>(getDefaultFilters);
  
  // Get current month/year for meta - parse directly from string to avoid timezone issues
  const currentMonth = filters.dataInicio ? parseInt(filters.dataInicio.split('-')[1]) : new Date().getMonth() + 1;
  const currentYear = filters.dataInicio ? parseInt(filters.dataInicio.split('-')[0]) : new Date().getFullYear();
  
  const { data: allNegocios, isLoading: loadingAll } = useNegocios();
  const filterOptions = useFilterOptions(allNegocios);
  const { data: negocios, isLoading } = useNegocios(filters);
  const { data: metaGlobal, isLoading: loadingMeta } = useMetaGlobal(currentMonth, currentYear);

  // Helper function to check if a date is within the filter period
  const isInPeriod = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false;
    if (!filters.dataInicio || !filters.dataFim) return true;
    return dateStr >= filters.dataInicio && dateStr <= filters.dataFim;
  };

  const executiveStats = useMemo(() => {
    if (!negocios || negocios.length === 0) {
      return {
        receitaTotal: 0,
        vendasRealizadas: 0,
        reunioesRealizadas: 0,
        reunioesAgendadas: 0,
        taxaAgendamento: 0,
        taxaNoShow: 0,
        taxaShowUp: 0,
        taxaConversaoGeral: 0,
        totalLeads: 0,
        noShows: 0,
        monthlyData: [],
        // Métricas de cohort
        vendasDosLeadsDoPeriodo: 0,
        taxaConversaoLeadsDoPeriodo: 0,
        tempoMedioFechamento: 0,
      };
    }

    // REGRA DE NEGÓCIO: Filtrar por pipeline
    // - Pré-Vendas - Comercial: Leads, Agendamentos (SDR)
    // - Comercial 1 - Se tu for eu vou: Faturamento, Vendas, Reuniões Realizadas (Especialistas)

    // Separar negócios por pipeline
    const negociosPreVendas = negocios.filter(n => isPreVendas(n.pipeline));
    const negociosComercial = negocios.filter(n => isComercial(n.pipeline));
    const negociosValidos = negocios.filter(n => isPipelineValido(n.pipeline));

    // ========================================
    // CÁLCULOS COM FILTRO DE DATA POR MÉTRICA
    // Cada métrica usa sua própria data relevante
    // ========================================

    // TOTAL LEADS: contar por primeiro_contato no período
    const totalLeads = negociosValidos.filter(n => 
      isInPeriod(n.primeiro_contato)
    ).length;

    // REUNIÕES AGENDADAS: contar apenas pela presença de data_agendamento no período
    const reunioesAgendadas = negociosValidos.filter(n => 
      isInPeriod(n.data_agendamento)
    ).length;

    // REUNIÕES REALIZADAS: contar por data_reuniao_realizada no período
    const reunioesRealizadas = negociosValidos.filter(n => 
      n.reuniao_realizada === true && isInPeriod(n.data_reuniao_realizada)
    ).length;

    // NO-SHOWS: contar por data_noshow no período
    const noShows = negociosValidos.filter(n => 
      isInPeriod(n.data_noshow)
    ).length;

    // VENDAS: contar por data_venda no período (apenas pipeline Comercial)
    const vendasNoPeriodo = negociosComercial.filter(n => 
      n.venda_aprovada === true && isInPeriod(n.data_venda)
    );
    const vendasRealizadas = vendasNoPeriodo.length;
    const receitaTotal = vendasNoPeriodo.reduce((sum, n) => sum + (n.total || 0), 0);

    // ========================================
    // TAXAS - Fórmulas definidas pelo usuário
    // ========================================

    // 1️⃣ % Agendamento = reuniões agendadas / total leads (no período)
    const taxaAgendamento = totalLeads > 0 
      ? (reunioesAgendadas / totalLeads) * 100 
      : 0;

    // 2️⃣ % No-show = no-shows / reuniões agendadas (no período)
    const taxaNoShow = reunioesAgendadas > 0 
      ? (noShows / reunioesAgendadas) * 100 
      : 0;

    // 3️⃣ % Show-up = reuniões realizadas / reuniões agendadas (no período)
    const taxaShowUp = reunioesAgendadas > 0 
      ? (reunioesRealizadas / reunioesAgendadas) * 100 
      : 0;

    // Taxa de conversão: vendas / reuniões realizadas (no período)
    const taxaConversaoGeral = reunioesRealizadas > 0 
      ? (vendasRealizadas / reunioesRealizadas) * 100 
      : 0;

    // ANÁLISE DE COHORT simplificada
    const vendasDosLeadsDoPeriodo = negociosValidos.filter(n => n.venda_aprovada === true).length;
    const taxaConversaoLeadsDoPeriodo = totalLeads > 0 
      ? (vendasDosLeadsDoPeriodo / totalLeads) * 100 
      : 0;

    // TEMPO MÉDIO DE FECHAMENTO: apenas Comercial com vendas
    const vendasComDatas = negociosComercial.filter(n => 
      n.venda_aprovada === true && n.primeiro_contato && n.data_venda
    );
    let tempoMedioFechamento = 0;
    if (vendasComDatas.length > 0) {
      const totalDias = vendasComDatas.reduce((sum, n) => {
        try {
          const inicio = parseISO(n.primeiro_contato!);
          const fim = parseISO(n.data_venda!);
          return sum + differenceInDays(fim, inicio);
        } catch {
          return sum;
        }
      }, 0);
      tempoMedioFechamento = Math.round(totalDias / vendasComDatas.length);
    }

    // Monthly data for sparklines - cada pipeline contribui para sua métrica
    const monthlyMap: Record<string, { receita: number; vendas: number; leads: number; reunioes: number }> = {};
    
    // Leads: ambos pipelines (Pré-Vendas e Comercial)
    negociosValidos.forEach(n => {
      if (n.primeiro_contato) {
        try {
          const date = parseISO(n.primeiro_contato);
          const monthKey = format(startOfMonth(date), 'yyyy-MM');
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { receita: 0, vendas: 0, leads: 0, reunioes: 0 };
          }
          monthlyMap[monthKey].leads += 1;
        } catch (e) {}
      }
    });
    
    // Vendas, receita e reuniões: apenas Comercial 1
    negociosComercial.forEach(n => {
      if (n.venda_aprovada && n.data_venda) {
        try {
          const date = parseISO(n.data_venda);
          const monthKey = format(startOfMonth(date), 'yyyy-MM');
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { receita: 0, vendas: 0, leads: 0, reunioes: 0 };
          }
          monthlyMap[monthKey].vendas += 1;
          monthlyMap[monthKey].receita += n.total || 0;
        } catch (e) {}
      }

      if (n.reuniao_realizada && n.data_reuniao_realizada) {
        try {
          const date = parseISO(n.data_reuniao_realizada);
          const monthKey = format(startOfMonth(date), 'yyyy-MM');
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { receita: 0, vendas: 0, leads: 0, reunioes: 0 };
          }
          monthlyMap[monthKey].reunioes += 1;
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

    return { 
      receitaTotal, 
      vendasRealizadas, 
      reunioesRealizadas, 
      reunioesAgendadas,
      noShows,
      taxaAgendamento, 
      taxaNoShow, 
      taxaShowUp, 
      taxaConversaoGeral,
      totalLeads,
      monthlyData,
      // Cohort
      vendasDosLeadsDoPeriodo,
      taxaConversaoLeadsDoPeriodo,
      tempoMedioFechamento,
    };
  }, [negocios, filters]);

  // Prepare data for MetaProgress
  const realizadoData = useMemo(() => ({
    faturamento: executiveStats.receitaTotal,
    vendas: executiveStats.taxaConversaoGeral, // Use conversion rate (percentage), not sales count
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
  const sparklineLeads = executiveStats.monthlyData.map(d => d.leads);
  const sparklineReunioes = executiveStats.monthlyData.map((d: any) => d.reunioes || 0);

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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-800/50 p-1">
                <TabsTrigger value="home" className="rounded-md px-6 py-1.5 text-sm font-medium data-[state=active]:bg-slate-700 data-[state=active]:text-white">HOME</TabsTrigger>
                <TabsTrigger value="sdr" className="rounded-md px-6 py-1.5 text-sm font-medium data-[state=active]:bg-slate-700 data-[state=active]:text-white">SDRS</TabsTrigger>
                <TabsTrigger value="especialistas" className="rounded-md px-6 py-1.5 text-sm font-medium data-[state=active]:bg-slate-700 data-[state=active]:text-white">ESPECIALISTAS</TabsTrigger>
              </TabsList>
              <MetaProgressCompact meta={metaGlobal} realizado={realizadoData} />
            </div>

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
                  sparklineData={sparklineLeads}
                />
                <KPICardWithSparkline
                  title="Reuniões"
                  value={formatNumber(executiveStats.reunioesRealizadas)}
                  icon={Calendar}
                  color="magenta"
                  sparklineData={sparklineReunioes}
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
                  <div className="text-sm text-slate-300 mt-1">{formatNumber(executiveStats.reunioesAgendadas)} / {formatNumber(executiveStats.totalLeads)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Meta: ≥50%</div>
                </div>
                
                <div className="bi-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">% No-Show</span>
                    <XCircle className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className={`text-3xl font-bold ${executiveStats.taxaNoShow <= 15 ? 'text-emerald-400' : executiveStats.taxaNoShow <= 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {executiveStats.taxaNoShow.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-300 mt-1">{formatNumber(executiveStats.noShows)} / {formatNumber(executiveStats.reunioesAgendadas)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Meta: ≤20%</div>
                </div>
                
                <div className="bi-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">% Show-Up</span>
                    <Users className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className={`text-3xl font-bold ${executiveStats.taxaShowUp >= 80 ? 'text-emerald-400' : executiveStats.taxaShowUp >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
                    {executiveStats.taxaShowUp.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-300 mt-1">{formatNumber(executiveStats.reunioesRealizadas)} / {formatNumber(executiveStats.reunioesAgendadas)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Meta: ≥80%</div>
                </div>

                <div className="bi-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">% Conversão Vendas</span>
                    <Target className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className={`text-3xl font-bold ${executiveStats.taxaConversaoGeral >= 25 ? 'text-emerald-400' : executiveStats.taxaConversaoGeral >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {executiveStats.taxaConversaoGeral.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-300 mt-1">{formatNumber(executiveStats.vendasRealizadas)} / {formatNumber(executiveStats.reunioesRealizadas)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Meta: ≥25%</div>
                </div>
              </div>


              {/* Main Grid - Funnel Left, Indicators Right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* Funnel - 2 columns */}
                <div className="lg:col-span-2 h-full">
                  <FunnelHorizontal negocios={negocios} filters={filters} />
                </div>

                {/* Indicadores - 1 column, stacked */}
                <div className="flex flex-col gap-2 h-full">
                  {/* Indicadores de Custo */}
                  <div className="bi-card py-3 px-3 flex-1 flex flex-col">
                    <h3 className="bi-card-title mb-2 text-sm">Indicadores de Custo</h3>
                    <div className="space-y-2 flex-1 flex flex-col justify-around">
                      <div className="flex justify-between items-center bg-slate-800/50 rounded p-2.5 border border-slate-700/50">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">CPL</div>
                        </div>
                        <div className="text-base font-bold text-cyan-400">{formatCurrency(0)}</div>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/50 rounded p-2.5 border border-slate-700/50">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">Custo MQL</div>
                        </div>
                        <div className="text-base font-bold text-purple-400">{formatCurrency(0)}</div>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/50 rounded p-2.5 border border-slate-700/50">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">Custo Reunião</div>
                        </div>
                        <div className="text-base font-bold text-blue-400">{formatCurrency(0)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Indicadores de Performance */}
                  <div className="bi-card py-3 px-3 flex-1 flex flex-col">
                    <h3 className="bi-card-title mb-2 text-sm">Análise de Cohort</h3>
                    <div className="space-y-2 flex-1 flex flex-col justify-around">
                      <div className="flex justify-between items-center bg-slate-800/50 rounded p-2.5 border border-slate-700/50">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">Vendas dos Leads</div>
                          <div className="text-[10px] text-slate-500">Leads do período que converteram</div>
                        </div>
                        <div className="text-base font-bold text-emerald-400">{executiveStats.vendasDosLeadsDoPeriodo}</div>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/50 rounded p-2.5 border border-slate-700/50">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">% Conv. Leads</div>
                          <div className="text-[10px] text-slate-500">Taxa de conversão do cohort</div>
                        </div>
                        <div className={`text-base font-bold ${executiveStats.taxaConversaoLeadsDoPeriodo >= 10 ? 'text-emerald-400' : executiveStats.taxaConversaoLeadsDoPeriodo >= 5 ? 'text-yellow-400' : 'text-orange-400'}`}>
                          {executiveStats.taxaConversaoLeadsDoPeriodo.toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-slate-800/50 rounded p-2.5 border border-slate-700/50">
                        <div>
                          <div className="text-xs text-slate-400 uppercase">Tempo Médio</div>
                          <div className="text-[10px] text-slate-500">Dias até fechamento</div>
                        </div>
                        <div className="text-base font-bold text-pink-400">{executiveStats.tempoMedioFechamento}d</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row - Meta x Realizado and Origem */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Meta x Realizado */}
                <div className="bi-card">
                  <h3 className="bi-card-title mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Meta x Realizado
                  </h3>
                  <MetaProgress meta={metaGlobal} realizado={realizadoData} />
                </div>
                
                {/* Origem Performance */}
                <OrigemPerformance negocios={negocios} filters={filters} />
              </div>

              {/* Rankings Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ranking Especialistas */}
                <RankingTable negocios={negocios} type="especialista" limit={4} filters={filters} />

                {/* Ranking SDRs */}
                <RankingTable negocios={negocios} type="sdr" limit={4} filters={filters} />
              </div>

              {/* Daily Revenue Chart - apenas pipeline Comercial */}
              <DailyRevenueChart 
                data={(allNegocios || []).filter(n => isComercial(n.pipeline))} 
                month={currentMonth} 
                year={currentYear}
                metaExcelente={metaGlobal?.meta_faturamento_excelente}
              />
            </TabsContent>

            <TabsContent value="sdr">
              <SDRAnalytics negocios={negocios} filters={filters} />
            </TabsContent>

            <TabsContent value="especialistas">
              <EspecialistasAnalytics negocios={negocios} filters={filters} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
