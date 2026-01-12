import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface DailyRevenueData {
  total?: number | null;
  data_venda?: string | null;
  venda_aprovada?: boolean | null;
}

interface DailyRevenueChartProps {
  data: DailyRevenueData[];
  title?: string;
}

export function DailyRevenueChart({ data, title = "Faturamento por Dia" }: DailyRevenueChartProps) {
  const chartData = useMemo(() => {
    const dailyData: Record<string, { day: string; date: string; receita: number; vendas: number }> = {};
    
    data.forEach(item => {
      if (item.venda_aprovada && item.data_venda && item.total) {
        try {
          const date = parseISO(item.data_venda);
          const dayKey = format(startOfDay(date), 'yyyy-MM-dd');
          const dayLabel = format(date, 'dd/MM', { locale: ptBR });
          
          if (!dailyData[dayKey]) {
            dailyData[dayKey] = { 
              day: dayLabel, 
              date: dayKey,
              receita: 0, 
              vendas: 0 
            };
          }
          
          dailyData[dayKey].receita += item.total;
          dailyData[dayKey].vendas += 1;
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // Last 30 days
      .map(([, d]) => d);
  }, [data]);

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
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-success">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-muted-foreground">
            {payload[0].payload.vendas} venda(s)
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Sem dados de faturamento
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-success">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">Total período</p>
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
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
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
                fill="url(#dailyRevenueGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
