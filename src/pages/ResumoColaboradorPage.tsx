import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useColaboradores } from '@/hooks/useColaboradores';
import { useMetaGlobal } from '@/hooks/useMetas';
import { useNegocios } from '@/hooks/useNegocios';
import { Loader2, User, Users } from 'lucide-react';
import { getCurrentMonthBrazil, getCurrentYearBrazil } from '@/lib/dateUtils';

const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

interface IndicadorRow {
  nome: string;
  metaMin: number | null;
  metaSat: number | null;
  metaExc: number | null;
  resultado: number | null;
  peso: number;
  multiplicador: number | null;
  format: 'currency' | 'percent' | 'number';
}

function calcMultiplicador(resultado: number | null, min: number | null, sat: number | null, exc: number | null): number | null {
  if (resultado === null || min === null || sat === null || exc === null) return null;
  if (min === 0 && sat === 0 && exc === 0) return null;
  if (resultado < min) return 0;
  if (resultado >= exc) return 1.0;
  if (resultado >= sat) {
    // Linear interpolation between sat and exc -> 0.8 to 1.0
    const range = exc - sat;
    if (range <= 0) return 1.0;
    return 0.8 + ((resultado - sat) / range) * 0.2;
  }
  // Between min and sat -> 0.5 to 0.8
  const range = sat - min;
  if (range <= 0) return 0.8;
  return 0.5 + ((resultado - min) / range) * 0.3;
}

function formatValue(value: number | null, fmt: 'currency' | 'percent' | 'number'): string {
  if (value === null) return '---';
  if (fmt === 'currency') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (fmt === 'percent') return `${value.toFixed(1)}%`;
  return value.toLocaleString('pt-BR');
}

function getMultColor(mult: number | null): string {
  if (mult === null) return 'text-muted-foreground';
  if (mult >= 0.8) return 'text-green-400';
  if (mult >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
}

export default function ResumoColaboradorPage() {
  const [selectedMes, setSelectedMes] = useState(getCurrentMonthBrazil());
  const [selectedAno, setSelectedAno] = useState(getCurrentYearBrazil());
  const [viewMode, setViewMode] = useState<'individual' | 'time'>('individual');

  const { data: colaboradores, isLoading: loadingColab } = useColaboradores();
  const [selectedColaborador, setSelectedColaborador] = useState<string>('');

  const { data: metaGlobal, isLoading: loadingMeta } = useMetaGlobal(selectedMes, selectedAno);

  // Build date range for the selected month
  const dataInicio = `${selectedAno}-${String(selectedMes).padStart(2, '0')}-01`;
  const lastDay = new Date(selectedAno, selectedMes, 0).getDate();
  const dataFim = `${selectedAno}-${String(selectedMes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: negocios, isLoading: loadingNegocios } = useNegocios({});

  // Calculate results from negocios (Comercial 1 pipeline for sales)
  const results = useMemo(() => {
    if (!negocios) return { faturamento: 0, vendas: 0, reunioes: 0, conversao: 0, closersAtivos: 0, mediaCloser: 0 };

    const comercial1 = negocios.filter(n => n.pipeline === 'Comercial 1 - Se tu for eu vou');
    const vendas = comercial1.filter(n => n.data_venda && n.data_venda >= dataInicio && n.data_venda <= dataFim);
    const faturamento = vendas.reduce((sum, n) => sum + (n.total || 0), 0);
    const reunioes = comercial1.filter(n => n.data_reuniao_realizada && n.data_reuniao_realizada >= dataInicio && n.data_reuniao_realizada <= dataFim);
    const conversao = reunioes.length > 0 ? (vendas.length / reunioes.length) * 100 : 0;

    // Closers ativos = unique quem_vendeu with sales in the period
    const closers = new Set(vendas.map(n => n.quem_vendeu).filter(Boolean));
    const closersAtivos = closers.size || 1;
    const mediaCloser = faturamento / closersAtivos;

    return { faturamento, vendas: vendas.length, reunioes: reunioes.length, conversao, closersAtivos, mediaCloser };
  }, [negocios, dataInicio, dataFim]);

  const indicadores: IndicadorRow[] = useMemo(() => {
    const m = metaGlobal;
    return [
      {
        nome: 'Faturamento Global',
        metaMin: m?.meta_faturamento_minimo ?? null,
        metaSat: m?.meta_faturamento_satisfatorio ?? null,
        metaExc: m?.meta_faturamento_excelente ?? null,
        resultado: results.faturamento,
        peso: 40,
        multiplicador: calcMultiplicador(results.faturamento, m?.meta_faturamento_minimo ?? null, m?.meta_faturamento_satisfatorio ?? null, m?.meta_faturamento_excelente ?? null),
        format: 'currency',
      },
      {
        nome: 'Margem Global',
        metaMin: m?.meta_margem_minimo ?? null,
        metaSat: m?.meta_margem_satisfatorio ?? null,
        metaExc: m?.meta_margem_excelente ?? null,
        resultado: null, // Manual - not yet available
        peso: 20,
        multiplicador: null,
        format: 'percent',
      },
      {
        nome: 'Conversão',
        metaMin: m?.meta_conversao_minimo ?? null,
        metaSat: m?.meta_conversao_satisfatorio ?? null,
        metaExc: m?.meta_conversao_excelente ?? null,
        resultado: results.conversao,
        peso: 10,
        multiplicador: calcMultiplicador(results.conversao, m?.meta_conversao_minimo ?? null, m?.meta_conversao_satisfatorio ?? null, m?.meta_conversao_excelente ?? null),
        format: 'percent',
      },
      {
        nome: 'Média por Closer',
        metaMin: m?.meta_media_closer_minimo ?? null,
        metaSat: m?.meta_media_closer_satisfatorio ?? null,
        metaExc: m?.meta_media_closer_excelente ?? null,
        resultado: results.mediaCloser,
        peso: 20,
        multiplicador: calcMultiplicador(results.mediaCloser, m?.meta_media_closer_minimo ?? null, m?.meta_media_closer_satisfatorio ?? null, m?.meta_media_closer_excelente ?? null),
        format: 'currency',
      },
      {
        nome: 'Indicações por Especialista',
        metaMin: m?.meta_indicacoes_minimo ?? null,
        metaSat: m?.meta_indicacoes_satisfatorio ?? null,
        metaExc: m?.meta_indicacoes_excelente ?? null,
        resultado: null, // Manual - not yet available
        peso: 10,
        multiplicador: null,
        format: 'number',
      },
    ];
  }, [metaGlobal, results]);

  const totalPonderado = useMemo(() => {
    let total = 0;
    let pesoTotal = 0;
    indicadores.forEach(ind => {
      if (ind.multiplicador !== null) {
        total += ind.multiplicador * ind.peso;
        pesoTotal += ind.peso;
      }
    });
    return pesoTotal > 0 ? total / pesoTotal : null;
  }, [indicadores]);

  if (loadingColab || loadingMeta || loadingNegocios) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resumo do Colaborador</h1>
          <p className="text-muted-foreground">Visualização consolidada de resultado e desempenho</p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Collaborator Selector */}
          <Select value={selectedColaborador} onValueChange={setSelectedColaborador}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione colaborador" />
            </SelectTrigger>
            <SelectContent>
              {colaboradores?.map(c => (
                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${viewMode === 'individual' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}
            >
              <User className="h-4 w-4" />
              Meus Resultados
            </button>
            <button
              onClick={() => setViewMode('time')}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${viewMode === 'time' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}
            >
              <Users className="h-4 w-4" />
              Meu Time
            </button>
          </div>

          <div className="flex-1" />

          {/* Period selectors */}
          <Select value={selectedMes.toString()} onValueChange={(v) => setSelectedMes(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map(m => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAno.toString()} onValueChange={(v) => setSelectedAno(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(a => (
                <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="financeiro" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="financeiro">Resultado Financeiro</TabsTrigger>
            <TabsTrigger value="avaliacao">Avaliação</TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Indicadores do Mês (Camada 1) — {meses.find(m => m.value === selectedMes)?.label} {selectedAno}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Indicador</TableHead>
                      <TableHead className="text-center">Meta Min</TableHead>
                      <TableHead className="text-center">Meta Sat</TableHead>
                      <TableHead className="text-center">Meta Exc</TableHead>
                      <TableHead className="text-center">Resultado</TableHead>
                      <TableHead className="text-center">Peso</TableHead>
                      <TableHead className="text-center">Mult</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indicadores.map((ind) => (
                      <TableRow key={ind.nome}>
                        <TableCell className="font-medium">{ind.nome}</TableCell>
                        <TableCell className="text-center text-red-400">{formatValue(ind.metaMin, ind.format)}</TableCell>
                        <TableCell className="text-center text-yellow-400">{formatValue(ind.metaSat, ind.format)}</TableCell>
                        <TableCell className="text-center text-green-400">{formatValue(ind.metaExc, ind.format)}</TableCell>
                        <TableCell className="text-center font-semibold">
                          {formatValue(ind.resultado, ind.format)}
                        </TableCell>
                        <TableCell className="text-center">{ind.peso}%</TableCell>
                        <TableCell className={`text-center font-bold ${getMultColor(ind.multiplicador)}`}>
                          {ind.multiplicador !== null ? ind.multiplicador.toFixed(2) : '---'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total Row */}
                    <TableRow className="border-t-2 border-border">
                      <TableCell colSpan={5} className="font-bold text-right">Resultado Ponderado</TableCell>
                      <TableCell className="text-center font-bold">100%</TableCell>
                      <TableCell className={`text-center font-bold text-lg ${getMultColor(totalPonderado)}`}>
                        {totalPonderado !== null ? totalPonderado.toFixed(2) : '---'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Abaixo do mínimo (0)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Entre min e sat (0.5–0.8)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Acima do satisfatório (0.8–1.0)</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="avaliacao" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>Avaliação de desempenho em desenvolvimento.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
