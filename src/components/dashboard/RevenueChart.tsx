import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RevenueChartProps {
  negocios: Negocio[];
  title?: string;
}

export function RevenueChart({ negocios, title = "Receita ao Longo do Tempo" }: RevenueChartProps) {
  const chartData = useMemo(() => {
    // Group by month
    const monthlyData: Record<string, { month: string; receita: number; vendas: number }> = {};
    
    negocios.forEach(n => {
      if (n.venda_aprovada && n.data_inicio) {
        try {
          const date = parseISO(n.data_inicio);
          const monthKey = format(startOfMonth(date), 'yyyy-MM');
          const monthLabel = format(date, 'MMM/yy', { locale: ptBR });
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthLabel, receita: 0, vendas: 0 };
          }
          
          monthlyData[monthKey].receita += n.total || 0;
          monthlyData[monthKey].vendas += 1;
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);
  }, [negocios]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);

  if (chartData.length === 0) {
    return (
      <div className="noc-panel">
        <div className="noc-panel-header">
          <h3 className="noc-panel-title">{title}</h3>
        </div>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          Sem dados de receita
        </div>
      </div>
    );
  }

  return (
    <div className="noc-panel">
      <div className="noc-panel-header">
        <h3 className="noc-panel-title">{title}</h3>
      </div>
      
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [formatCurrency(value), 'Receita']}
            />
            <Area
              type="monotone"
              dataKey="receita"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}