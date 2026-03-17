import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentMonthBrazil, getCurrentYearBrazil } from '@/lib/dateUtils';

export interface PanoramaMetrica {
  key: string;
  label: string;
  metaDiaria: number;
  format?: 'number' | 'currency' | 'percent';
}

interface PanoramaDiarioProps {
  titulo: string;
  metricas: PanoramaMetrica[];
  colaboradorField: string; // column name in CSV that identifies the person
}

interface DailyData {
  [colaborador: string]: {
    [metricaKey: string]: {
      [day: number]: number;
    };
  };
}

const MESES = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if ((ch === ',' || ch === ';') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function formatValue(value: number, format?: 'number' | 'currency' | 'percent'): string {
  if (format === 'currency') {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
  if (format === 'percent') {
    return `${value.toFixed(0)}%`;
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function PanoramaDiario({ titulo, metricas, colaboradorField }: PanoramaDiarioProps) {
  const [mes, setMes] = useState(String(getCurrentMonthBrazil()));
  const [ano, setAno] = useState(String(getCurrentYearBrazil()));
  const [data, setData] = useState<DailyData>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const daysInMonth = useMemo(() => getDaysInMonth(Number(mes), Number(ano)), [mes, ano]);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const colaboradores = useMemo(() => Object.keys(data).sort(), [data]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length < 2) {
          toast({ variant: 'destructive', title: 'CSV vazio', description: 'O arquivo não contém dados.' });
          return;
        }

        const headers = rows[0].map(h => h.toLowerCase().trim());
        const nameIdx = headers.findIndex(h => 
          h.includes('nome') || h.includes('sdr') || h.includes('especialista') || h.includes('closer') || h.includes(colaboradorField.toLowerCase())
        );
        const metricaIdx = headers.findIndex(h => h.includes('metrica') || h.includes('métrica') || h.includes('indicador'));
        const dayIndices: { day: number; idx: number }[] = [];

        headers.forEach((h, idx) => {
          const dayMatch = h.match(/^(\d{1,2})$/);
          if (dayMatch) {
            dayIndices.push({ day: parseInt(dayMatch[1]), idx });
          }
          // Also try "dia 1", "dia 2", etc.
          const dayMatch2 = h.match(/^dia\s*(\d{1,2})$/);
          if (dayMatch2) {
            dayIndices.push({ day: parseInt(dayMatch2[1]), idx });
          }
        });

        if (nameIdx === -1) {
          toast({ variant: 'destructive', title: 'Coluna não encontrada', description: `Não foi possível encontrar a coluna de nome/colaborador.` });
          return;
        }

        if (dayIndices.length === 0) {
          toast({ variant: 'destructive', title: 'Colunas de dias não encontradas', description: 'O CSV deve ter colunas numéricas (1, 2, 3... ou Dia 1, Dia 2...).' });
          return;
        }

        const newData: DailyData = {};
        const metricaKeys = metricas.map(m => m.key.toLowerCase());
        const metricaLabels = metricas.map(m => m.label.toLowerCase());

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length <= nameIdx) continue;
          
          const nome = row[nameIdx]?.trim();
          if (!nome) continue;

          let metricaKey = metricas[0]?.key || '';
          if (metricaIdx !== -1 && row[metricaIdx]) {
            const rawMetrica = row[metricaIdx].trim().toLowerCase();
            const foundIdx = metricaLabels.findIndex(ml => rawMetrica.includes(ml) || ml.includes(rawMetrica));
            if (foundIdx !== -1) {
              metricaKey = metricas[foundIdx].key;
            } else {
              const foundKeyIdx = metricaKeys.findIndex(mk => rawMetrica.includes(mk) || mk.includes(rawMetrica));
              if (foundKeyIdx !== -1) {
                metricaKey = metricas[foundKeyIdx].key;
              }
            }
          }

          if (!newData[nome]) {
            newData[nome] = {};
            metricas.forEach(m => { newData[nome][m.key] = {}; });
          }

          dayIndices.forEach(({ day, idx }) => {
            if (idx < row.length) {
              const val = parseFloat(row[idx]?.replace(/[R$%.,\s]/g, (match) => {
                if (match === ',') return '.';
                if (match === '.') return '';
                return '';
              }) || '0');
              if (!isNaN(val)) {
                if (!newData[nome][metricaKey]) newData[nome][metricaKey] = {};
                newData[nome][metricaKey][day] = val;
              }
            }
          });
        }

        setData(newData);
        toast({ title: 'CSV importado!', description: `${Object.keys(newData).length} colaboradores carregados.` });
      } catch (err) {
        toast({ variant: 'destructive', title: 'Erro ao ler CSV', description: String(err) });
      }
    };
    reader.readAsText(file, 'UTF-8');
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [metricas, colaboradorField, toast]);

  const getCellColor = (value: number, metaDiaria: number): string => {
    if (value === 0) return 'bg-muted/30 text-muted-foreground/50';
    if (value >= metaDiaria) return 'bg-emerald-500/20 text-emerald-400';
    if (value >= metaDiaria * 0.7) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getRowTotal = (colaborador: string, metricaKey: string): number => {
    const metricData = data[colaborador]?.[metricaKey] || {};
    return Object.values(metricData).reduce((sum, v) => sum + v, 0);
  };

  const getDayTotal = (metricaKey: string, day: number): number => {
    return colaboradores.reduce((sum, colab) => {
      return sum + (data[colab]?.[metricaKey]?.[day] || 0);
    }, 0);
  };

  return (
    <Card className="dashboard-section">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="section-title flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {titulo}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {colaboradores.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Faça upload de um arquivo CSV para visualizar o panorama diário</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Formato: Nome, Métrica, 1, 2, 3, ... 31
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-10 bg-card px-2 py-1.5 text-left font-medium text-muted-foreground min-w-[120px]">
                    Colaborador
                  </th>
                  <th className="sticky left-[120px] z-10 bg-card px-2 py-1.5 text-left font-medium text-muted-foreground min-w-[130px]">
                    Métrica
                  </th>
                  {days.map(d => (
                    <th key={d} className="px-1 py-1.5 text-center font-medium text-muted-foreground min-w-[36px]">
                      {d}
                    </th>
                  ))}
                  <th className="px-2 py-1.5 text-center font-semibold text-foreground min-w-[50px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.map((colab, colabIdx) => (
                  metricas.map((metrica, metIdx) => (
                    <tr
                      key={`${colab}-${metrica.key}`}
                      className={`
                        ${metIdx === metricas.length - 1 && colabIdx < colaboradores.length - 1 ? 'border-b-2 border-border' : 'border-b border-border/50'}
                      `}
                    >
                      {metIdx === 0 && (
                        <td
                          className="sticky left-0 z-10 bg-card px-2 py-1 font-semibold text-foreground whitespace-nowrap"
                          rowSpan={metricas.length}
                        >
                          {colab}
                        </td>
                      )}
                      <td className="sticky left-[120px] z-10 bg-card px-2 py-1 text-muted-foreground whitespace-nowrap">
                        {metrica.label}
                      </td>
                      {days.map(d => {
                        const val = data[colab]?.[metrica.key]?.[d] || 0;
                        return (
                          <td
                            key={d}
                            className={`px-1 py-1 text-center font-mono text-[11px] ${getCellColor(val, metrica.metaDiaria)}`}
                          >
                            {val > 0 ? formatValue(val, metrica.format) : '–'}
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 text-center font-semibold text-foreground">
                        {formatValue(getRowTotal(colab, metrica.key), metrica.format)}
                      </td>
                    </tr>
                  ))
                ))}
                {/* Totals row */}
                {metricas.map((metrica, metIdx) => (
                  <tr
                    key={`total-${metrica.key}`}
                    className={`bg-muted/20 ${metIdx === 0 ? 'border-t-2 border-primary/30' : 'border-b border-border/50'}`}
                  >
                    {metIdx === 0 && (
                      <td
                        className="sticky left-0 z-10 bg-muted/20 px-2 py-1 font-bold text-foreground"
                        rowSpan={metricas.length}
                      >
                        TOTAL
                      </td>
                    )}
                    <td className="sticky left-[120px] z-10 bg-muted/20 px-2 py-1 text-muted-foreground font-medium whitespace-nowrap">
                      {metrica.label}
                    </td>
                    {days.map(d => {
                      const val = getDayTotal(metrica.key, d);
                      return (
                        <td key={d} className="px-1 py-1 text-center font-mono text-[11px] font-semibold text-foreground">
                          {val > 0 ? formatValue(val, metrica.format) : '–'}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-center font-bold text-foreground">
                      {formatValue(
                        colaboradores.reduce((sum, c) => sum + getRowTotal(c, metrica.key), 0),
                        metrica.format
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
