import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Negocio } from '@/hooks/useNegocios';
import { getCurrentMonthBrazil, getCurrentYearBrazil, getCurrentDayBrazil } from '@/lib/dateUtils';

export interface PanoramaMetricaDef {
  key: string;
  label: string;
  metaDiaria: number;
  format?: 'number' | 'currency' | 'percent';
  /** If true, color logic is inverted: 0=green, >=meta=yellow, >meta=red */
  invertColor?: boolean;
  /** Function that computes the value for a given person on a given day */
  compute: (negocios: Negocio[], nome: string, dateStr: string) => number;
}

interface PanoramaDiarioNegociosProps {
  titulo: string;
  negocios: Negocio[];
  colaboradores: string[];
  metricas: PanoramaMetricaDef[];
  mes: number;
  ano: number;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function getBusinessDays(month: number, year: number): number {
  const total = getDaysInMonth(month, year);
  let count = 0;
  for (let d = 1; d <= total; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

function formatValue(value: number, format?: 'number' | 'currency' | 'percent'): string {
  if (format === 'currency') {
    if (value >= 1000) {
      return `R$${(value / 1000).toFixed(1)}k`;
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
  if (format === 'percent') {
    return `${value.toFixed(0)}%`;
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatMetaMensal(value: number, format?: 'number' | 'currency' | 'percent'): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
  if (format === 'percent') {
    return `${value.toFixed(0)}%`;
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function PanoramaDiarioNegocios({ titulo, negocios, colaboradores, metricas, mes, ano }: PanoramaDiarioNegociosProps) {
  const daysInMonth = useMemo(() => getDaysInMonth(mes, ano), [mes, ano]);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const businessDays = useMemo(() => getBusinessDays(mes, ano), [mes, ano]);

  const currentMes = getCurrentMonthBrazil();
  const currentAno = getCurrentYearBrazil();
  const currentDay = getCurrentDayBrazil();
  const isCurrentMonth = mes === currentMes && ano === currentAno;

  // Precompute all values
  const computedData = useMemo(() => {
    const result: Record<string, Record<string, Record<number, number>>> = {};
    colaboradores.forEach(colab => {
      result[colab] = {};
      metricas.forEach(m => {
        result[colab][m.key] = {};
        days.forEach(d => {
          const dateStr = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          result[colab][m.key][d] = m.compute(negocios, colab, dateStr);
        });
      });
    });
    return result;
  }, [negocios, colaboradores, metricas, days, mes, ano]);

  const getCellColor = (value: number, metaDiaria: number, invertColor?: boolean): string => {
    if (invertColor) {
      if (value === 0) return 'bg-emerald-500/20 text-emerald-400';
      if (value <= metaDiaria) return 'bg-yellow-500/20 text-yellow-400';
      return 'bg-red-500/20 text-red-400';
    }
    if (value === 0) return 'text-muted-foreground/40';
    if (metaDiaria <= 0) return 'text-foreground';
    if (value >= metaDiaria) return 'bg-emerald-500/20 text-emerald-400';
    if (value >= metaDiaria * 0.7) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getRowTotal = (colab: string, metricaKey: string): number => {
    const metricData = computedData[colab]?.[metricaKey] || {};
    return Object.values(metricData).reduce((sum, v) => sum + v, 0);
  };

  const getDayTotal = (metricaKey: string, day: number): number => {
    return colaboradores.reduce((sum, colab) => sum + (computedData[colab]?.[metricaKey]?.[day] || 0), 0);
  };

  const getMetaMensal = (m: PanoramaMetricaDef): number => {
    if (m.format === 'percent') return m.metaDiaria; // % metas are not multiplied
    return m.metaDiaria * businessDays;
  };

  const getAtingimento = (total: number, metaMensal: number, format?: 'number' | 'currency' | 'percent'): number => {
    if (format === 'percent') return total; // already a percentage
    if (metaMensal <= 0) return 0;
    return (total / metaMensal) * 100;
  };

  if (colaboradores.length === 0) {
    return (
      <Card className="dashboard-section">
        <CardHeader>
          <CardTitle className="section-title flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {titulo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8 text-sm">Nenhum colaborador cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-section">
      <CardHeader>
        <CardTitle className="section-title flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: '1200px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1a2e1a' }}>
                <th className="sticky left-0 z-20 px-2 py-2 text-left font-bold min-w-[130px] border-r border-border/30" style={{ backgroundColor: '#1a2e1a', color: '#eab308' }}>
                  ESPECIALISTA / SEÇÃO
                </th>
                <th className="sticky left-[130px] z-20 px-2 py-2 text-left font-bold min-w-[140px] border-r border-border/30" style={{ backgroundColor: '#1a2e1a', color: '#eab308' }}>
                  MÉTRICA
                </th>
                <th className="sticky left-[270px] z-20 px-2 py-2 text-center font-bold min-w-[60px] border-r border-border/30" style={{ backgroundColor: '#1a2e1a', color: '#eab308' }}>
                  META/DIA
                </th>
                {days.map(d => {
                  const dow = new Date(ano, mes - 1, d).getDay();
                  const isWeekend = dow === 0 || dow === 6;
                  const isToday = isCurrentMonth && d === currentDay;
                  return (
                    <th
                      key={d}
                      className={`px-0.5 py-1 text-center font-medium min-w-[34px] ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
                      style={{
                        backgroundColor: isWeekend ? '#1a2e1a' : '#1a2e1a',
                        color: '#eab308',
                        opacity: isWeekend ? 0.7 : 1,
                      }}
                    >
                      <div className="text-[10px] leading-tight">{DIAS_SEMANA[dow]}</div>
                      <div className="text-xs font-bold">{d}</div>
                    </th>
                  );
                })}
                <th className="px-2 py-2 text-center font-bold min-w-[70px] border-l border-border/30" style={{ backgroundColor: '#1a2e1a', color: '#eab308' }}>
                  TOTAL
                </th>
                <th className="px-2 py-2 text-center font-bold min-w-[70px]" style={{ backgroundColor: '#1a2e1a', color: '#eab308' }}>
                  META MÊS
                </th>
                <th className="px-2 py-2 text-center font-bold min-w-[60px]" style={{ backgroundColor: '#1a2e1a', color: '#eab308' }}>
                  % ATING.
                </th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.map((colab, colabIdx) => (
                metricas.map((metrica, metIdx) => {
                  const total = getRowTotal(colab, metrica.key);
                  const metaMensal = getMetaMensal(metrica);
                  const atingimento = getAtingimento(total, metaMensal, metrica.format);

                  return (
                    <tr
                      key={`${colab}-${metrica.key}`}
                      className={`
                        ${metIdx === metricas.length - 1 && colabIdx < colaboradores.length - 1 ? 'border-b-2 border-border' : 'border-b border-border/30'}
                      `}
                    >
                      {metIdx === 0 && (
                        <td
                          className="sticky left-0 z-10 bg-card px-2 py-1 font-bold text-foreground whitespace-nowrap text-sm border-r border-border/30 align-middle"
                          rowSpan={metricas.length}
                        >
                          {colab}
                        </td>
                      )}
                      <td className="sticky left-[130px] z-10 bg-card px-2 py-1 text-muted-foreground whitespace-nowrap border-r border-border/30">
                        {metrica.label}
                      </td>
                      <td className="sticky left-[270px] z-10 bg-card px-2 py-1 text-center font-mono text-muted-foreground border-r border-border/30">
                        {metrica.format === 'currency' ? `R$${(metrica.metaDiaria / 1000).toFixed(0)}k` : metrica.format === 'percent' ? `${metrica.metaDiaria}%` : metrica.metaDiaria}
                      </td>
                      {days.map(d => {
                        const val = computedData[colab]?.[metrica.key]?.[d] || 0;
                        const dow = new Date(ano, mes - 1, d).getDay();
                        const isWeekend = dow === 0 || dow === 6;
                        const isToday = isCurrentMonth && d === currentDay;
                        return (
                          <td
                            key={d}
                            className={`px-0.5 py-1 text-center font-mono text-[11px] border-r border-border/10 ${getCellColor(val, metrica.metaDiaria, metrica.invertColor)} ${isToday ? 'ring-1 ring-primary ring-inset' : ''}`}
                            style={isWeekend ? { backgroundColor: 'hsl(var(--muted) / 0.3)' } : undefined}
                          >
                            {val > 0 ? formatValue(val, metrica.format) : '–'}
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 text-center font-semibold text-foreground border-l border-border/30">
                        {formatValue(total, metrica.format)}
                      </td>
                      <td className="px-2 py-1 text-center font-mono text-muted-foreground">
                        {formatMetaMensal(metaMensal, metrica.format)}
                      </td>
                      <td className={`px-2 py-1 text-center font-semibold ${getCellColor(atingimento, 100)}`}>
                        {metrica.metaDiaria > 0 ? `${atingimento.toFixed(0)}%` : '–'}
                      </td>
                    </tr>
                  );
                })
              ))}
              {/* Totals */}
              {metricas.map((metrica, metIdx) => {
                const grandTotal = colaboradores.reduce((sum, c) => sum + getRowTotal(c, metrica.key), 0);
                const metaMensal = getMetaMensal(metrica) * colaboradores.length;
                const atingimento = metaMensal > 0 ? (grandTotal / metaMensal) * 100 : 0;

                return (
                  <tr
                    key={`total-${metrica.key}`}
                    className={`bg-muted/20 ${metIdx === 0 ? 'border-t-2 border-primary/30' : 'border-b border-border/30'}`}
                  >
                    {metIdx === 0 && (
                      <td
                        className="sticky left-0 z-10 bg-muted/20 px-2 py-1 font-bold text-foreground border-r border-border/30"
                        rowSpan={metricas.length}
                      >
                        TOTAL
                      </td>
                    )}
                    <td className="sticky left-[130px] z-10 bg-muted/20 px-2 py-1 text-muted-foreground font-medium whitespace-nowrap border-r border-border/30">
                      {metrica.label}
                    </td>
                    <td className="sticky left-[270px] z-10 bg-muted/20 px-2 py-1 border-r border-border/30" />
                    {days.map(d => {
                      const val = getDayTotal(metrica.key, d);
                      const isToday = isCurrentMonth && d === currentDay;
                      return (
                        <td key={d} className={`px-0.5 py-1 text-center font-mono text-[11px] font-semibold text-foreground ${isToday ? 'ring-1 ring-primary ring-inset' : ''}`}>
                          {val > 0 ? formatValue(val, metrica.format) : '–'}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-center font-bold text-foreground border-l border-border/30">
                      {formatValue(grandTotal, metrica.format)}
                    </td>
                    <td className="px-2 py-1 text-center font-mono text-muted-foreground">
                      {metrica.format !== 'percent' ? formatMetaMensal(metaMensal, metrica.format) : '–'}
                    </td>
                    <td className={`px-2 py-1 text-center font-semibold ${getCellColor(atingimento, 100)}`}>
                      {metrica.metaDiaria > 0 && metrica.format !== 'percent' ? `${atingimento.toFixed(0)}%` : '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
