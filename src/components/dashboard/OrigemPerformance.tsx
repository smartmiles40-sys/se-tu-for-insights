import { useMemo } from 'react';
import { Negocio, NegocioFilters } from '@/hooks/useNegocios';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { isPreVendas, isComercial } from '@/lib/pipelines';

interface OrigemPerformanceProps {
  negocios: Negocio[];
  filters?: NegocioFilters;
}

const COLORS = ['#22d3ee', '#facc15', '#f472b6', '#34d399', '#fb923c'];

export function OrigemPerformance({ negocios, filters }: OrigemPerformanceProps) {
  // Helper to check if date is in period
  const isInPeriod = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false;
    if (!filters?.dataInicio || !filters?.dataFim) return true;
    return dateStr >= filters.dataInicio && dateStr <= filters.dataFim;
  };

  const data = useMemo(() => {
    // Separar por pipeline
    const negociosPreVendas = negocios.filter(n => isPreVendas(n.pipeline));
    const negociosComercial = negocios.filter(n => isComercial(n.pipeline));
    
    const origemMap: Record<string, { origem: string; leads: number; vendas: number; receita: number }> = {};
    
    // Leads: apenas Pré-Vendas, por primeiro_contato
    negociosPreVendas.forEach(n => {
      const origem = n.lead_fonte || n.utm_source || 'Direto';
      
      if (isInPeriod(n.primeiro_contato)) {
        if (!origemMap[origem]) {
          origemMap[origem] = { origem, leads: 0, vendas: 0, receita: 0 };
        }
        origemMap[origem].leads += 1;
      }
    });
    
    // Vendas e receita: apenas Comercial 1, por data_venda
    negociosComercial.forEach(n => {
      const origem = n.lead_fonte || n.utm_source || 'Direto';
      
      if (n.data_venda && isInPeriod(n.data_venda)) {
        if (!origemMap[origem]) {
          origemMap[origem] = { origem, leads: 0, vendas: 0, receita: 0 };
        }
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
  }, [negocios, filters]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="bi-card h-full flex flex-col">
      <h3 className="bi-card-title mb-3">Performance por Origem</h3>
      
      {/* Investment Summary */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-400 uppercase">Meta Ads</span>
          </div>
          <div className="text-lg font-bold text-blue-400">R$ 0</div>
          <div className="text-xs text-slate-500">Investimento</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-400 uppercase">Google Ads</span>
          </div>
          <div className="text-lg font-bold text-red-400">R$ 0</div>
          <div className="text-xs text-slate-500">Investimento</div>
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
