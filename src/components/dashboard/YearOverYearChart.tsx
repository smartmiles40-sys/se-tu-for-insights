import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Pencil, Check } from 'lucide-react';

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

interface MonthData {
  month: string;
  year2025: number;
  year2026: number;
}

const DEFAULT_DATA: MonthData[] = MONTHS.map((m) => ({
  month: m,
  year2025: 0,
  year2026: 0,
}));

export function YearOverYearChart() {
  const [data, setData] = useState<MonthData[]>(() => {
    try {
      const saved = localStorage.getItem('yoy-chart-data');
      return saved ? JSON.parse(saved) : DEFAULT_DATA;
    } catch {
      return DEFAULT_DATA;
    }
  });
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    localStorage.setItem('yoy-chart-data', JSON.stringify(data));
    setEditing(false);
  };

  const handleChange = (index: number, field: 'year2025' | 'year2026', value: string) => {
    const parsed = parseFloat(value.replace(',', '.')) || 0;
    setData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: parsed };
      return next;
    });
  };

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

  const total2025 = useMemo(() => data.reduce((s, d) => s + d.year2025, 0), [data]);
  const total2026 = useMemo(() => data.reduce((s, d) => s + d.year2026, 0), [data]);
  const growthPercent = total2025 > 0 ? ((total2026 - total2025) / total2025) * 100 : 0;

  const renderTooltip = (props: { active?: boolean; payload?: any[]; label?: string }) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrencyFull(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comparativo Anual — 2025 vs 2026
          </CardTitle>
          <div className="flex items-center gap-6">
            {/* Totals */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">2025</p>
              <p className="text-xl font-bold text-chart-2">{formatCurrencyFull(total2025)}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">2026</p>
              <p className="text-xl font-bold text-primary">{formatCurrencyFull(total2026)}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Crescimento</p>
              <p className={`text-xl font-bold ${growthPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(1)}%
              </p>
            </div>
            {/* Edit button */}
            <Button
              variant={editing ? 'default' : 'outline'}
              size="sm"
              onClick={editing ? handleSave : () => setEditing(true)}
              className="h-8"
            >
              {editing ? <Check className="h-4 w-4 mr-1" /> : <Pencil className="h-4 w-4 mr-1" />}
              {editing ? 'Salvar' : 'Editar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Mês</th>
                  <th className="text-right py-2 text-chart-2 font-medium">2025</th>
                  <th className="text-right py-2 text-primary font-medium">2026</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.month} className="border-b border-border/30">
                    <td className="py-1.5 text-foreground font-medium">{row.month}</td>
                    <td className="py-1.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        defaultValue={row.year2025 || ''}
                        onBlur={(e) => handleChange(i, 'year2025', e.target.value)}
                      />
                    </td>
                    <td className="py-1.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        defaultValue={row.year2026 || ''}
                        onBlur={(e) => handleChange(i, 'year2026', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={4}>
                <defs>
                  <linearGradient id="yoy2025Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="yoy2026Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
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
                <Tooltip content={renderTooltip} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="year2025"
                  name="2025"
                  fill="url(#yoy2025Gradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="year2026"
                  name="2026"
                  fill="url(#yoy2026Gradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
