import { useMemo } from 'react';
import { Negocio, NegocioFilters } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';

interface FunnelHorizontalProps {
  negocios: Negocio[];
  filters?: NegocioFilters;
}

const IDEAL_RATES = {
  leadsToMql: 50,
  mqlToSql: 60,
  sqlToVendas: 25,
};

const FUNNEL_COLORS = [
  { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-rose-500' },
  { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-amber-500' },
  { bg: 'bg-lime-500', border: 'border-lime-600', text: 'text-lime-500' },
  { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-500' },
];

export function FunnelHorizontal({ negocios, filters }: FunnelHorizontalProps) {
  // Helper to check if date is in period
  const isInPeriod = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false;
    if (!filters?.dataInicio || !filters?.dataFim) return true;
    return dateStr >= filters.dataInicio && dateStr <= filters.dataFim;
  };

  const funnelData = useMemo(() => {
    // Leads: contagem total de registros (todos os IDs)
    const leads = negocios.length;
    
    // MQL: COUNT(data_mql preenchida)
    const mql = negocios.filter(n => n.data_mql !== null).length;
    
    // SQL: COUNT(data_sql preenchida)
    const sql = negocios.filter(n => n.data_sql !== null).length;
    
    // Vendas: COUNT(data_venda preenchida)
    const vendas = negocios.filter(n => n.data_venda !== null).length;

    const leadsToMqlRate = leads > 0 ? (mql / leads) * 100 : 0;
    const mqlToSqlRate = mql > 0 ? (sql / mql) * 100 : 0;
    const sqlToVendasRate = sql > 0 ? (vendas / sql) * 100 : 0;

    return [
      { name: 'Leads', value: leads, rate: null, ideal: null, width: 100 },
      { name: 'MQL', value: mql, rate: leadsToMqlRate, ideal: IDEAL_RATES.leadsToMql, width: 80 },
      { name: 'SQL', value: sql, rate: mqlToSqlRate, ideal: IDEAL_RATES.mqlToSql, width: 60 },
      { name: 'Vendas', value: vendas, rate: sqlToVendasRate, ideal: IDEAL_RATES.sqlToVendas, width: 40 },
    ];
  }, [negocios, filters]);

  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

  return (
    <div className="bi-card h-full flex flex-col">
      <h3 className="bi-card-title mb-4">Funil Comercial</h3>
      
      <div className="flex gap-8 flex-1">
        {/* Funnel Visual */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          {funnelData.map((stage, index) => {
            const colors = FUNNEL_COLORS[index];
            
            return (
              <div 
                key={stage.name}
                className="relative transition-all duration-500 hover:scale-105"
                style={{ width: `${stage.width}%` }}
              >
                {/* Trapezoid shape using clip-path */}
                <div 
                  className={cn(
                    'h-[72px] flex items-center justify-center relative',
                    colors.bg
                  )}
                  style={{
                    clipPath: index === funnelData.length - 1 
                      ? 'polygon(10% 0%, 90% 0%, 50% 100%, 50% 100%)' 
                      : 'polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)',
                  }}
                >
                  <div className="text-center z-10">
                    <span className="text-xl font-bold text-white drop-shadow-md">
                      {formatNumber(stage.value)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Labels and Rates */}
        <div className="flex flex-col justify-around py-2 min-w-[140px]">
          {funnelData.map((stage, index) => {
            const colors = FUNNEL_COLORS[index];
            const isAboveIdeal = stage.ideal ? stage.rate! >= stage.ideal : true;
            
            return (
              <div key={stage.name} className="flex items-center gap-3">
                {/* Color indicator */}
                <div className={cn('w-3 h-3 rounded-full', colors.bg)} />
                
                <div>
                  <div className={cn('text-sm font-semibold', colors.text)}>
                    {stage.name}
                  </div>
                  {stage.rate !== null && (
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        'text-sm font-bold',
                        isAboveIdeal ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {stage.rate.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-500">
                        (meta: {stage.ideal}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
