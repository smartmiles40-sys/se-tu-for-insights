import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

interface MarketingAnalyticsProps {
  negocios: Negocio[];
}

export function MarketingAnalytics({ negocios }: MarketingAnalyticsProps) {
  const origemData = useMemo(() => {
    const origemStats: Record<string, {
      origem: string;
      leads: number;
      reunioes: number;
      vendas: number;
      receita: number;
      conversao: number;
    }> = {};

    negocios.forEach(n => {
      const origem = n.lead_fonte || n.utm_source || 'Não identificado';
      
      if (!origemStats[origem]) {
        origemStats[origem] = {
          origem,
          leads: 0,
          reunioes: 0,
          vendas: 0,
          receita: 0,
          conversao: 0,
        };
      }

      origemStats[origem].leads += 1;
      if (n.reuniao_realizada) origemStats[origem].reunioes += 1;
      if (n.data_venda) {
        origemStats[origem].vendas += 1;
        origemStats[origem].receita += n.total || 0;
      }
    });

    return Object.values(origemStats)
      .map(o => ({
        ...o,
        conversao: o.leads > 0 ? (o.vendas / o.leads) * 100 : 0,
      }))
      .sort((a, b) => b.receita - a.receita);
  }, [negocios]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--chart-5))',
    'hsl(var(--muted-foreground))',
  ];

  if (origemData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="noc-panel">
          <div className="noc-panel-header">
            <h3 className="noc-panel-title">Marketing — Decisão de Investimento</h3>
          </div>
          <p className="text-muted-foreground text-center py-8">
            Nenhum dado de origem disponível
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="noc-panel p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Origens</p>
          <p className="text-2xl font-display font-bold">{origemData.length}</p>
        </div>
        <div className="noc-panel p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Melhor Origem</p>
          <p className="text-lg font-display font-bold text-success truncate">{origemData[0]?.origem}</p>
        </div>
        <div className="noc-panel p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Receita</p>
          <p className="text-lg font-display font-bold text-success">{formatCurrency(origemData[0]?.receita || 0)}</p>
        </div>
        <div className="noc-panel p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Maior Conversão</p>
          <p className="text-lg font-display font-bold text-primary">
            {Math.max(...origemData.map(o => o.conversao)).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Origin */}
        <div className="noc-panel">
          <div className="noc-panel-header">
            <h3 className="noc-panel-title">Receita por Canal</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={origemData.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="origem" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  width={100}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Bar dataKey="receita" radius={[0, 4, 4, 0]}>
                  {origemData.slice(0, 8).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion by Origin */}
        <div className="noc-panel">
          <div className="noc-panel-header">
            <h3 className="noc-panel-title">Conversão por Canal</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={origemData.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 'dataMax']}
                />
                <YAxis 
                  type="category" 
                  dataKey="origem" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  width={100}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversão']}
                />
                <Bar dataKey="conversao" radius={[0, 4, 4, 0]}>
                  {origemData.slice(0, 8).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.conversao >= 25 ? 'hsl(var(--success))' : 'hsl(var(--warning))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="noc-panel">
        <div className="noc-panel-header">
          <h3 className="noc-panel-title">Detalhamento por Origem</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Origem
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Leads
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reuniões
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vendas
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Receita
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Conversão
                </th>
              </tr>
            </thead>
            <tbody>
              {origemData.map((origem, index) => (
                <tr 
                  key={origem.origem} 
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-muted/30',
                    index === 0 && 'bg-success/10'
                  )}
                >
                  <td className="py-3 px-4 font-medium">{origem.origem}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(origem.leads)}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(origem.reunioes)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">
                    {formatNumber(origem.vendas)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-success">
                    {formatCurrency(origem.receita)}
                  </td>
                  <td className={cn(
                    'py-3 px-4 text-right font-semibold',
                    origem.conversao >= 25 ? 'text-success' : 'text-warning'
                  )}>
                    {origem.conversao.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}