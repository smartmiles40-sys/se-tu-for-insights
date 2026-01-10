import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';

interface RankingTableProps {
  negocios: Negocio[];
  type: 'sdr' | 'especialista';
  limit?: number;
}

export function RankingTable({ negocios, type, limit = 5 }: RankingTableProps) {
  const rankingData = useMemo(() => {
    if (type === 'sdr') {
      const sdrMap: Record<string, { name: string; agendamentos: number; leads: number; receita: number }> = {};
      
      negocios.forEach(n => {
        const sdr = n.sdr || 'Sem SDR';
        if (!sdrMap[sdr]) {
          sdrMap[sdr] = { name: sdr, agendamentos: 0, leads: 0, receita: 0 };
        }
        sdrMap[sdr].leads += 1;
        if (n.reuniao_agendada) sdrMap[sdr].agendamentos += 1;
        if (n.venda_aprovada) sdrMap[sdr].receita += n.total || 0;
      });

      return Object.values(sdrMap)
        .map(s => ({
          ...s,
          taxa: s.leads > 0 ? (s.agendamentos / s.leads) * 100 : 0,
        }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, limit);
    } else {
      const espMap: Record<string, { name: string; vendas: number; reunioes: number; receita: number }> = {};
      
      negocios.forEach(n => {
        const esp = n.vendedor || 'Sem Especialista';
        if (!espMap[esp]) {
          espMap[esp] = { name: esp, vendas: 0, reunioes: 0, receita: 0 };
        }
        if (n.reuniao_realizada) espMap[esp].reunioes += 1;
        if (n.venda_aprovada) {
          espMap[esp].vendas += 1;
          espMap[esp].receita += n.total || 0;
        }
      });

      return Object.values(espMap)
        .map(e => ({
          ...e,
          taxa: e.reunioes > 0 ? (e.vendas / e.reunioes) * 100 : 0,
        }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, limit);
    }
  }, [negocios, type, limit]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);

  const title = type === 'sdr' ? 'Ranking SDRs' : 'Ranking Especialistas';

  return (
    <div className="bi-card">
      <h3 className="bi-card-title mb-4">{title}</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-left pb-3 font-medium">Ranking</th>
              <th className="text-left pb-3 font-medium">{type === 'sdr' ? 'SDR' : 'Especialista'}</th>
              <th className="text-left pb-3 font-medium">Conversão</th>
              <th className="text-left pb-3 font-medium">Receita</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {rankingData.map((item, index) => (
              <tr key={item.name} className="hover:bg-slate-800/30">
                <td className="py-2.5">
                  <span className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold',
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-700/50 text-slate-400'
                  )}>
                    {index + 1}
                  </span>
                </td>
                <td className="py-2.5 text-slate-200 font-medium">{item.name}</td>
                <td className="py-2.5">
                  <span className={cn(
                    'font-semibold',
                    item.taxa >= 25 ? 'text-emerald-400' : item.taxa >= 15 ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {item.taxa.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 text-cyan-400 font-semibold">{formatCurrency(item.receita)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
