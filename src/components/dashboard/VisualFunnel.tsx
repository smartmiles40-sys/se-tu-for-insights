import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';
import { ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';

interface VisualFunnelProps {
  negocios: Negocio[];
}

const IDEAL_RATES = {
  leadsToMql: 50,
  mqlToSql: 60,
  sqlToVendas: 25,
};

export function VisualFunnel({ negocios }: VisualFunnelProps) {
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
        name: 'Leads', 
        value: leads, 
        rate: null,
        ideal: null,
        width: 100 
      },
      { 
        name: 'MQL', 
        value: mql, 
        rate: leadsToMqlRate,
        ideal: IDEAL_RATES.leadsToMql,
        width: 85 
      },
      { 
        name: 'SQL / Reuniões', 
        value: sql, 
        rate: mqlToSqlRate,
        ideal: IDEAL_RATES.mqlToSql,
        width: 65 
      },
      { 
        name: 'Vendas', 
        value: vendas, 
        rate: sqlToVendasRate,
        ideal: IDEAL_RATES.sqlToVendas,
        width: 45 
      },
    ];
  }, [negocios]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  return (
    <div className="noc-panel">
      <div className="noc-panel-header">
        <h3 className="noc-panel-title">Funil Comercial</h3>
      </div>

      <div className="flex flex-col items-center space-y-2">
        {funnelData.map((stage, index) => {
          const isAboveIdeal = stage.ideal ? stage.rate! >= stage.ideal : true;
          const statusClass = stage.rate === null 
            ? 'bg-primary' 
            : isAboveIdeal 
              ? 'bg-success' 
              : 'bg-destructive';

          return (
            <div key={stage.name} className="w-full">
              {/* Funnel stage */}
              <div 
                className="mx-auto transition-all duration-500"
                style={{ width: `${stage.width}%` }}
              >
                <div 
                  className={cn(
                    'relative py-4 px-6 rounded-lg text-center',
                    statusClass
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-white/80">
                      {stage.name}
                    </span>
                    <span className="text-2xl font-display font-bold text-white">
                      {formatNumber(stage.value)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conversion arrow */}
              {index < funnelData.length - 1 && (
                <div className="flex items-center justify-center py-2">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    {funnelData[index + 1].rate !== null && (
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          'text-sm font-semibold',
                          funnelData[index + 1].rate! >= funnelData[index + 1].ideal! 
                            ? 'text-success' 
                            : 'text-destructive'
                        )}>
                          {funnelData[index + 1].rate!.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          (meta: ≥{funnelData[index + 1].ideal}%)
                        </span>
                        {funnelData[index + 1].rate! >= funnelData[index + 1].ideal! ? (
                          <TrendingUp className="h-3 w-3 text-success" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}