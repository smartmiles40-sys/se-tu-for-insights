import { ClientesStats } from '@/hooks/useClientesRelacionamento';
import { Heart, Repeat, Clock, DollarSign } from 'lucide-react';

interface LoyaltyMetricsProps {
  stats: ClientesStats;
}

export function LoyaltyMetrics({ stats }: LoyaltyMetricsProps) {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  const metrics = [
    { label: 'Taxa de Recompra', value: `${stats.taxaRecompra.toFixed(1)}%`, icon: Repeat, color: 'text-emerald-400' },
    { label: 'Clientes com 2+ compras', value: stats.clientesMais2Compras.toString(), icon: Heart, color: 'text-pink-400' },
    { label: 'Tempo Médio entre Compras', value: `${stats.tempoMedioEntreCompras}d`, icon: Clock, color: 'text-cyan-400' },
    { label: 'Receita Média / Cliente', value: formatCurrency(stats.receitaMediaAtivo), icon: DollarSign, color: 'text-yellow-400' },
  ];

  return (
    <div className="bi-card">
      <h3 className="bi-card-title mb-3">Customer Loyalty Metrics</h3>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <m.icon className={`h-5 w-5 ${m.color}`} />
            <div>
              <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
              <div className="text-xs text-slate-400">{m.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
