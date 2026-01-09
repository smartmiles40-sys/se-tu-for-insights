import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface FunnelHorizontalProps {
  negocios: Negocio[];
}

const IDEAL_RATES = {
  leadsToMql: 50,
  mqlToSql: 60,
  sqlToVendas: 25,
};

export function FunnelHorizontal({ negocios }: FunnelHorizontalProps) {
  const funnelData = useMemo(() => {
    const leads = negocios.length;
    const mql = negocios.filter(n => n.mql).length;
    const sql = negocios.filter(n => n.sql_qualificado || n.reuniao_agendada).length;
    const vendas = negocios.filter(n => n.venda_aprovada).length;

    const leadsToMqlRate = leads > 0 ? (mql / leads) * 100 : 0;
    const mqlToSqlRate = mql > 0 ? (sql / mql) * 100 : 0;
    const sqlToVendasRate = sql > 0 ? (vendas / sql) * 100 : 0;

    return [
      { 
        name: 'LEADS', 
        value: leads, 
        rate: null, 
        ideal: null,
        color: 'text-slate-100'
      },
      { 
        name: 'MQL', 
        value: mql, 
        rate: leadsToMqlRate, 
        ideal: IDEAL_RATES.leadsToMql,
        color: 'text-slate-100'
      },
      { 
        name: 'SQL', 
        value: sql, 
        rate: mqlToSqlRate, 
        ideal: IDEAL_RATES.mqlToSql,
        color: 'text-slate-100'
      },
      { 
        name: 'VENDAS', 
        value: vendas, 
        rate: sqlToVendasRate, 
        ideal: IDEAL_RATES.sqlToVendas,
        color: 'text-slate-100'
      },
    ];
  }, [negocios]);

  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

  return (
    <div className="bi-card">
      <h3 className="bi-card-title mb-6">Funil Comercial</h3>
      
      <div className="flex items-start justify-between">
        {funnelData.map((stage, index) => {
          const isAboveIdeal = stage.ideal ? stage.rate! >= stage.ideal : true;
          
          return (
            <div key={stage.name} className="flex items-start flex-1">
              {/* Stage Content */}
              <div className="flex-1 text-center">
                {/* Big Number */}
                <div className="text-4xl font-bold text-slate-100 mb-1">
                  {formatNumber(stage.value)}
                </div>
                
                {/* Label */}
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  {stage.name}
                </div>
                
                {/* Conversion Rate */}
                {stage.rate !== null && (
                  <div className="space-y-0.5">
                    <div className={cn(
                      'text-lg font-bold',
                      isAboveIdeal ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {stage.rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500">
                      (meta: {stage.ideal}%)
                    </div>
                  </div>
                )}
              </div>
              
              {/* Arrow Connector */}
              {index < funnelData.length - 1 && (
                <div className="flex items-center justify-center px-2 pt-4">
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Visual Funnel Bar */}
      <div className="mt-6 flex items-end gap-1 h-16">
        {funnelData.map((stage, index) => {
          const maxValue = funnelData[0].value || 1;
          const heightPercent = (stage.value / maxValue) * 100;
          const isAboveIdeal = stage.ideal ? stage.rate! >= stage.ideal : true;
          
          const bgColor = stage.rate === null 
            ? 'bg-cyan-500' 
            : isAboveIdeal 
              ? 'bg-emerald-500' 
              : 'bg-red-500';
          
          return (
            <div 
              key={stage.name}
              className="flex-1 relative group"
            >
              <div 
                className={cn(
                  'w-full rounded-t transition-all duration-500',
                  bgColor,
                  'opacity-80 group-hover:opacity-100'
                )}
                style={{ 
                  height: `${Math.max(heightPercent, 8)}%`,
                  minHeight: '8px'
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
