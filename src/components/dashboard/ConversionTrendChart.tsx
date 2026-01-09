import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversionTrendChartProps {
  negocios: Negocio[];
}

export function ConversionTrendChart({ negocios }: ConversionTrendChartProps) {
  const chartData = useMemo(() => {
    // Group by month
    const monthlyData: Record<string, { 
      month: string; 
      leads: number; 
      vendas: number; 
      conversao: number;
    }> = {};
    
    negocios.forEach(n => {
      if (n.data_inicio) {
        try {
          const date = parseISO(n.data_inicio);
          const monthKey = format(startOfMonth(date), 'yyyy-MM');
          const monthLabel = format(date, 'MMM/yy', { locale: ptBR });
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthLabel, leads: 0, vendas: 0, conversao: 0 };
          }
          
          monthlyData[monthKey].leads += 1;
          if (n.venda_aprovada) {
            monthlyData[monthKey].vendas += 1;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    // Calculate conversion rates
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => ({
        ...data,
        conversao: data.leads > 0 ? (data.vendas / data.leads) * 100 : 0,
      }));
  }, [negocios]);

  if (chartData.length === 0) {
    return (
      <div className="noc-panel">
        <div className="noc-panel-header">
          <h3 className="noc-panel-title">Tendência de Conversão</h3>
        </div>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          Sem dados de tendência
        </div>
      </div>
    );
  }

  return (
    <div className="noc-panel">
      <div className="noc-panel-header">
        <h3 className="noc-panel-title">Tendência de Conversão</h3>
      </div>
      
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversão']}
            />
            <ReferenceLine 
              y={25} 
              stroke="hsl(var(--success))" 
              strokeDasharray="5 5" 
              label={{ 
                value: 'Meta 25%', 
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10 
              }} 
            />
            <Line
              type="monotone"
              dataKey="conversao"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}