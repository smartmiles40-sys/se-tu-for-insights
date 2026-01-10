import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';

interface OrigemPerformanceProps {
  negocios: Negocio[];
  compact?: boolean;
}

const COLORS = ['#22d3ee', '#facc15', '#f472b6', '#34d399', '#fb923c'];

export function OrigemPerformance({ negocios, compact = false }: OrigemPerformanceProps) {
  const data = useMemo(() => {
    const origemMap: Record<string, { origem: string; leads: number; vendas: number; receita: number }> = {};
    
    negocios.forEach(n => {
      const origem = n.lead_fonte || n.utm_source || 'Direto';
      if (!origemMap[origem]) {
        origemMap[origem] = { origem, leads: 0, vendas: 0, receita: 0 };
      }
      origemMap[origem].leads += 1;
      if (n.venda_aprovada) {
        origemMap[origem].vendas += 1;
        origemMap[origem].receita += n.total || 0;
      }
    });

    return Object.values(origemMap)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 5)
      .map(o => ({
        ...o,
        conversao: o.leads > 0 ? (o.vendas / o.leads) * 100 : 0,
        nomeShort: o.origem.length > 12 ? o.origem.substring(0, 12) + '...' : o.origem,
      }));
  }, [negocios]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className={cn("bi-card h-full flex flex-col", compact && "p-2")}>
      <h3 className={cn("bi-card-title mb-3", compact && "mb-2 text-xs")}>Performance por Origem</h3>
      
      {/* Investment Summary */}
      <div className={cn("grid grid-cols-2 gap-2 mb-4", compact && "mb-2")}>
        <div className={cn("bg-slate-800/50 rounded-lg p-3 border border-slate-700/50", compact && "p-2")}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className={cn("text-xs text-slate-400 uppercase", compact && "text-[10px]")}>Meta Ads</span>
          </div>
          <div className={cn("font-bold text-blue-400", compact ? "text-sm" : "text-lg")}>R$ 0</div>
          {!compact && <div className="text-xs text-slate-500">Investimento</div>}
        </div>
        <div className={cn("bg-slate-800/50 rounded-lg p-3 border border-slate-700/50", compact && "p-2")}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className={cn("text-xs text-slate-400 uppercase", compact && "text-[10px]")}>Google Ads</span>
          </div>
          <div className={cn("font-bold text-red-400", compact ? "text-sm" : "text-lg")}>R$ 0</div>
          {!compact && <div className="text-xs text-slate-500">Investimento</div>}
        </div>
      </div>
      
      <div className="space-y-3 flex-1">
        {data.map((item, index) => {
          const maxReceita = data[0]?.receita || 1;
          const widthPercent = (item.receita / maxReceita) * 100;
          
          return (
            <div key={item.origem} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium truncate max-w-[140px]" title={item.origem}>
                  {item.origem}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs">
                    {item.leads} leads
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {formatCurrency(item.receita)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.max(widthPercent, 2)}%`,
                    backgroundColor: COLORS[index % COLORS.length]
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
