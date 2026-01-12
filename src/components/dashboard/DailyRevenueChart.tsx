import { useMemo } from 'react';
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
import { parseISO, getDaysInMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface DailyRevenueData {
  total?: number | null;
  data_venda?: string | null;
  venda_aprovada?: boolean | null;
}

interface DailyRevenueChartProps {
  data: DailyRevenueData[];
  month: number; // 1-12
  year: number;
  title?: string;
}

export function DailyRevenueChart({ data, month, year, title = "Faturamento por Dia" }: DailyRevenueChartProps) {
  const chartData = useMemo(() => {
    // Get number of days in the selected month
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    
    // Initialize all days with zero
    const dailyData: { day: number; label: string; receita: number; vendas: number }[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      dailyData.push({
        day: i,
        label: String(i),
        receita: 0,
        vendas: 0
      });
    }
    
    // Fill in actual revenue data
    data.forEach(item => {
      if (item.venda_aprovada && item.data_venda && item.total) {
        try {
          const date = parseISO(item.data_venda);
          const itemMonth = date.getMonth() + 1;
          const itemYear = date.getFullYear();
          
          // Only include data from the selected month/year
          if (itemMonth === month && itemYear === year) {
            const dayOfMonth = date.getDate();
            const dayIndex = dayOfMonth - 1;
            if (dayIndex >= 0 && dayIndex < dailyData.length) {
              dailyData[dayIndex].receita += item.total;
              dailyData[dayIndex].vendas += 1;
            }
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    return dailyData;
  }, [data, month, year]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);

  const totalRevenue = useMemo(() => 
    chartData.reduce((acc, d) => acc + d.receita, 0), 
    [chartData]
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">Dia {label}</p>
          <p className="text-sm text-success">
            {formatCurrency(data.receita)}
          </p>
          {data.vendas > 0 && (
            <p className="text-xs text-muted-foreground">
              {data.vendas} venda(s)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title} - {monthNames[month - 1]} {year}
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-success">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">Total do mês</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <defs>
                <linearGradient id="dailyRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.5}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="label" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="receita"
                radius={[2, 2, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.receita > 0 ? "url(#dailyRevenueGradient)" : "hsl(var(--muted) / 0.3)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
