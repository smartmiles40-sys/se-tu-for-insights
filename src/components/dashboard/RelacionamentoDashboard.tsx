import { useClientesRelacionamento, useClientesStats } from '@/hooks/useClientesRelacionamento';
import { KPICardWithSparkline } from '@/components/dashboard/KPICardWithSparkline';
import { LoyaltyMetrics } from '@/components/dashboard/LoyaltyMetrics';
import { ClienteRankingTable } from '@/components/dashboard/ClienteRankingTable';
import { ClienteDistributionChart } from '@/components/dashboard/ClienteDistributionChart';
import { DollarSign, Users, Repeat, TrendingUp, UserCheck, Heart } from 'lucide-react';
import { Loader2, AlertTriangle } from 'lucide-react';

export function RelacionamentoDashboard() {
  const { data: clientes, isLoading } = useClientesRelacionamento();
  const stats = useClientesStats(clientes);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
  const formatNumber = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientes || clientes.length === 0) {
    return (
      <div className="bi-card p-16 text-center">
        <AlertTriangle className="h-16 w-16 text-slate-500 mx-auto mb-6" />
        <h3 className="text-2xl font-semibold mb-3 text-slate-200">Nenhum dado de relacionamento</h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Importe o CSV de relacionamento através da opção "Importar Dados" no menu lateral.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICardWithSparkline title="LTV Médio" value={formatCurrency(stats.ltvMedio)} icon={DollarSign} color="cyan" sparklineData={[]} />
        <KPICardWithSparkline title="Receita Ativos" value={formatCurrency(stats.receitaAtivos)} icon={TrendingUp} color="green" sparklineData={[]} />
        <KPICardWithSparkline title="Ticket Médio" value={formatCurrency(stats.ticketMedio)} icon={DollarSign} color="yellow" sparklineData={[]} />
        <KPICardWithSparkline title="Taxa Recompra" value={`${stats.taxaRecompra.toFixed(1)}%`} icon={Repeat} color="magenta" sparklineData={[]} />
        <KPICardWithSparkline title="Clientes Ativos" value={formatNumber(stats.clientesAtivos)} icon={UserCheck} color="orange" sparklineData={[]} />
        <KPICardWithSparkline title="Recorrentes" value={formatNumber(stats.clientesRecorrentes)} icon={Heart} color="cyan" sparklineData={[]} />
      </div>

      {/* Receita de Base indicator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bi-card">
          <h3 className="bi-card-title mb-3">Receita de Base</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <span className="text-sm text-slate-300">Receita de Recorrentes</span>
              <span className="text-lg font-bold text-emerald-400">{formatCurrency(stats.receitaRecorrentes)}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <span className="text-sm text-slate-300">Receita de Novos</span>
              <span className="text-lg font-bold text-yellow-400">{formatCurrency(stats.receitaNovos)}</span>
            </div>
            {stats.receitaRecorrentes + stats.receitaNovos > 0 && (
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full"
                  style={{ width: `${(stats.receitaRecorrentes / (stats.receitaRecorrentes + stats.receitaNovos)) * 100}%` }}
                />
              </div>
            )}
            <div className="text-xs text-slate-400 text-center">
              {((stats.receitaRecorrentes / (stats.receitaRecorrentes + stats.receitaNovos || 1)) * 100).toFixed(1)}% da receita vem de clientes recorrentes
            </div>
          </div>
        </div>

        {/* Loyalty Metrics */}
        <LoyaltyMetrics stats={stats} clientes={clientes} />
      </div>

      {/* Charts */}
      <ClienteDistributionChart clientes={clientes} stats={stats} />

      {/* Ranking */}
      <ClienteRankingTable clientes={clientes} />
    </div>
  );
}
