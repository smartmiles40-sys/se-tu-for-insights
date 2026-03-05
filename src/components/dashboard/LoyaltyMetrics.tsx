import { ClientesStats } from '@/hooks/useClientesRelacionamento';
import { ClienteRelacionamento } from '@/hooks/useClientesRelacionamento';
import { Heart, Repeat, Clock, DollarSign } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

interface LoyaltyMetricsProps {
  stats: ClientesStats;
  clientes: ClienteRelacionamento[];
}

export function LoyaltyMetrics({ stats, clientes }: LoyaltyMetricsProps) {
  // Tempo médio entre viagens (para clientes com 2+ viagens e ambas as datas)
  const tempoMedio = (() => {
    const comDatas = clientes.filter(c => c.quantidade_viagens > 1 && c.data_primeira_viagem && c.data_ultima_viagem);
    if (comDatas.length === 0) return 0;
    const totalDias = comDatas.reduce((s, c) => {
      const diff = differenceInDays(parseISO(c.data_ultima_viagem!), parseISO(c.data_primeira_viagem!));
      return s + (diff / (c.quantidade_viagens - 1));
    }, 0);
    return Math.round(totalDias / comDatas.length);
  })();

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  const metrics = [
    { label: 'Taxa de Recompra', value: `${stats.taxaRecompra.toFixed(1)}%`, icon: Repeat, color: 'text-emerald-400' },
    { label: 'Clientes com 2+ viagens', value: stats.clientesMais2Viagens.toString(), icon: Heart, color: 'text-pink-400' },
    { label: 'Tempo Médio entre Viagens', value: `${tempoMedio}d`, icon: Clock, color: 'text-cyan-400' },
    { label: 'Receita Média / Ativo', value: formatCurrency(stats.receitaMediaAtivo), icon: DollarSign, color: 'text-yellow-400' },
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
