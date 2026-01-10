import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';

interface RankingTableProps {
  negocios: Negocio[];
  type: 'sdr' | 'especialista';
  limit?: number;
  compact?: boolean;
}

export function RankingTable({ negocios, type, limit = 5, compact = false }: RankingTableProps) {
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
    <div className={cn("bi-card", compact && "p-2")}>
      <h3 className={cn("bi-card-title mb-4", compact && "mb-2 text-xs")}>{title}</h3>
      
      <div className="overflow-x-auto">
        <table className={cn("w-full", compact ? "text-xs" : "text-sm")}>
          <thead>
            <tr className={cn("text-slate-500 uppercase tracking-wider", compact ? "text-[10px]" : "text-xs")}>
              <th className={cn("text-left font-medium", compact ? "pb-1.5" : "pb-3")}>Rank</th>
              <th className={cn("text-left font-medium", compact ? "pb-1.5" : "pb-3")}>{type === 'sdr' ? 'SDR' : 'Especialista'}</th>
              <th className={cn("text-left font-medium", compact ? "pb-1.5" : "pb-3")}>Conv.</th>
              <th className={cn("text-left font-medium", compact ? "pb-1.5" : "pb-3")}>Receita</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {rankingData.map((item, index) => (
              <tr key={item.name} className="hover:bg-slate-800/30">
                <td className={compact ? "py-1.5" : "py-2.5"}>
                  <span className={cn(
                    'inline-flex items-center justify-center rounded text-xs font-bold',
                    compact ? 'w-5 h-5' : 'w-6 h-6',
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-700/50 text-slate-400'
                  )}>
                    {index + 1}
                  </span>
                </td>
                <td className={cn("text-slate-200 font-medium", compact ? "py-1.5" : "py-2.5")}>
                  {compact ? (item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name) : item.name}
                </td>
                <td className={compact ? "py-1.5" : "py-2.5"}>
                  <span className={cn(
                    'font-semibold',
                    item.taxa >= 25 ? 'text-emerald-400' : item.taxa >= 15 ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {item.taxa.toFixed(1)}%
                  </span>
                </td>
                <td className={cn("text-cyan-400 font-semibold", compact ? "py-1.5" : "py-2.5")}>
                  {formatCurrency(item.receita)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
