import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

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
      { name: 'Leads', value: leads, rate: null, ideal: null },
      { name: 'MQL', value: mql, rate: leadsToMqlRate, ideal: IDEAL_RATES.leadsToMql },
      { name: 'SQL', value: sql, rate: mqlToSqlRate, ideal: IDEAL_RATES.mqlToSql },
      { name: 'Vendas', value: vendas, rate: sqlToVendasRate, ideal: IDEAL_RATES.sqlToVendas },
    ];
  }, [negocios]);

  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

  return (
    <div className="bi-card">
      <h3 className="bi-card-title mb-4">Funil Comercial</h3>
      
      <div className="flex items-center justify-between gap-2">
        {funnelData.map((stage, index) => {
          const isAboveIdeal = stage.ideal ? stage.rate! >= stage.ideal : true;
          
          return (
            <div key={stage.name} className="flex items-center flex-1">
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-slate-100">
                  {formatNumber(stage.value)}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
                  {stage.name}
                </div>
                {stage.rate !== null && (
                  <div className={cn(
                    'text-xs font-semibold mt-1',
                    isAboveIdeal ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {stage.rate.toFixed(1)}%
                    <span className="text-slate-500 font-normal ml-1">
                      (meta: {stage.ideal}%)
                    </span>
                  </div>
                )}
              </div>
              
              {index < funnelData.length - 1 && (
                <ArrowRight className="h-4 w-4 text-slate-600 mx-2 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
