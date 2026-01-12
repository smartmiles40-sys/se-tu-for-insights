import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { parseISO, getDaysInMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target } from 'lucide-react';

interface DailyRevenueData {
  total?: number | null;
  data_venda?: string | null;
  data_inicio?: string | null;
  venda_aprovada?: boolean | null;
}

interface DailyRevenueChartProps {
  data: DailyRevenueData[];
  month: number; // 1-12
  year: number;
  title?: string;
  metaExcelente?: number | null;
}

export function DailyRevenueChart({ data, month, year, title = "Faturamento por Dia", metaExcelente }: DailyRevenueChartProps) {
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
    
    // Fill in actual revenue data - filter for approved sales
    // Use data_venda if available, otherwise fall back to data_inicio
    data.forEach(item => {
      if (item.venda_aprovada && item.total) {
        const dateStr = item.data_venda || item.data_inicio;
        if (!dateStr) return;
        
        try {
          const date = parseISO(dateStr);
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

  const formatCurrencyFull = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const totalRevenue = useMemo(() => 
    chartData.reduce((acc, d) => acc + d.receita, 0), 
    [chartData]
  );

  const progressPercent = metaExcelente && metaExcelente > 0 
    ? Math.min((totalRevenue / metaExcelente) * 100, 100) 
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">Dia {label}</p>
          <p className="text-sm text-success">
            {formatCurrencyFull(data.receita)}
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

  // Calculate daily target if we have a monthly goal
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const dailyTarget = metaExcelente ? metaExcelente / daysInMonth : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title} - {monthNames[month - 1]} {year}
          </CardTitle>
          <div className="flex items-center gap-6">
            {/* Realizado */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Realizado</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrencyFull(totalRevenue)}
              </p>
            </div>
            
            {/* Meta Excelente */}
            {metaExcelente && metaExcelente > 0 && (
              <>
                <div className="h-10 w-px bg-border" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1 justify-end">
                    <Target className="h-3 w-3" />
                    Meta Excelente
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrencyFull(metaExcelente)}
                  </p>
                </div>
                
                {/* Progress */}
                <div className="h-10 w-px bg-border" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Progresso</p>
                  <p className={`text-2xl font-bold ${progressPercent >= 100 ? 'text-success' : progressPercent >= 70 ? 'text-yellow-400' : 'text-orange-400'}`}>
                    {progressPercent.toFixed(1)}%
                  </p>
                </div>
              </>
            )}
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
              {dailyTarget > 0 && (
                <ReferenceLine 
                  y={dailyTarget} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ 
                    value: `Meta diária: ${formatCurrency(dailyTarget)}`, 
                    position: 'insideTopRight',
                    fill: 'hsl(var(--primary))',
                    fontSize: 11
                  }}
                />
              )}
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