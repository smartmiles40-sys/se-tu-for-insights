import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CommercialFunnelProps {
  negocios: Negocio[];
}

// Metas ideais fixas conforme especificação
const IDEAL_RATES = {
  leadsToMql: 50,
  mqlToSql: 60,
  sqlToVendas: 25,
};

interface FunnelStage {
  name: string;
  value: number;
  conversionRate: number | null;
  idealRate: number | null;
  isAboveIdeal: boolean | null;
}

export function CommercialFunnel({ negocios }: CommercialFunnelProps) {
  const funnelData = useMemo((): FunnelStage[] => {
    const leads = negocios.length;
    const mql = negocios.filter(n => n.mql).length;
    const sql = negocios.filter(n => n.sql_qualificado || n.reuniao_agendada).length;
    const vendas = negocios.filter(n => n.venda_aprovada).length;

    // Cálculo das taxas de conversão
    const leadsToMqlRate = leads > 0 ? (mql / leads) * 100 : 0;
    const mqlToSqlRate = mql > 0 ? (sql / mql) * 100 : 0;
    const sqlToVendasRate = sql > 0 ? (vendas / sql) * 100 : 0;

    return [
      { 
        name: 'Leads', 
        value: leads, 
        conversionRate: null, 
        idealRate: null,
        isAboveIdeal: null
      },
      { 
        name: 'MQL', 
        value: mql, 
        conversionRate: leadsToMqlRate, 
        idealRate: IDEAL_RATES.leadsToMql,
        isAboveIdeal: leadsToMqlRate >= IDEAL_RATES.leadsToMql
      },
      { 
        name: 'SQL / Reuniões', 
        value: sql, 
        conversionRate: mqlToSqlRate, 
        idealRate: IDEAL_RATES.mqlToSql,
        isAboveIdeal: mqlToSqlRate >= IDEAL_RATES.mqlToSql
      },
      { 
        name: 'Vendas Realizadas', 
        value: vendas, 
        conversionRate: sqlToVendasRate, 
        idealRate: IDEAL_RATES.sqlToVendas,
        isAboveIdeal: sqlToVendasRate >= IDEAL_RATES.sqlToVendas
      },
    ];
  }, [negocios]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getStatusIcon = (isAbove: boolean | null) => {
    if (isAbove === null) return null;
    if (isAbove) return <TrendingUp className="h-4 w-4 text-success" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const getStatusClass = (isAbove: boolean | null) => {
    if (isAbove === null) return '';
    return isAbove ? 'text-success' : 'text-destructive';
  };

  // Calcula a largura proporcional de cada barra
  const maxValue = Math.max(...funnelData.map(d => d.value), 1);

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
      <h3 className="text-xl font-display font-semibold text-foreground mb-6">
        Funil Comercial
      </h3>

      {/* Tabela analítica do funil */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Etapa
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Volume
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider w-48">
                Progressão
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Taxa Real
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Meta Ideal
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {funnelData.map((stage, index) => (
              <tr 
                key={stage.name} 
                className={cn(
                  'border-b border-border/50 transition-colors hover:bg-muted/30',
                  index === funnelData.length - 1 && 'bg-success/5'
                )}
              >
                <td className="py-4 px-4">
                  <span className="font-medium text-foreground">{stage.name}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-2xl font-display font-bold text-foreground">
                    {formatNumber(stage.value)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        index === 0 ? 'bg-primary' : 
                        stage.isAboveIdeal ? 'bg-success' : 'bg-warning'
                      )}
                      style={{ width: `${(stage.value / maxValue) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  {stage.conversionRate !== null ? (
                    <span className={cn('font-semibold', getStatusClass(stage.isAboveIdeal))}>
                      {formatPercent(stage.conversionRate)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  {stage.idealRate !== null ? (
                    <span className="text-muted-foreground">
                      ≥ {stage.idealRate}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center">
                    {getStatusIcon(stage.isAboveIdeal)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <span>Acima da meta</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-destructive" />
          <span>Abaixo da meta</span>
        </div>
      </div>
    </div>
  );
}
