import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { useColaboradores } from '@/hooks/useColaboradores';
import { useMetas } from '@/hooks/useMetas';
import { MetasTargetBar, useEspecialistaMetaItems } from './MetasTargetBar';
import { getCurrentMonthBrazil, getCurrentYearBrazil } from '@/lib/dateUtils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getTodayBrazil } from '@/lib/dateUtils';
import { PanoramaDiario } from './PanoramaDiario';

interface EspecialistasDashboardProps {
  negocios: Negocio[];
  dataInicioFrom?: string;
}

interface EspecialistaStats {
  nome: string;
  faturamento: number;
  vendas: number;
  reunioesMarcadas: number;
  reunioesAteData: number;
  reunioesRealizadas: number;
  noShow: number;
  taxaNoShow: number;
  taxaComparecimento: number;
  taxaConversao: number;
  mql: number;
  mqlVenda: number;
  ticketMedio: number;
}

export function EspecialistasDashboard({ negocios, dataInicioFrom }: EspecialistasDashboardProps) {
  const today = getTodayBrazil();
  const { data: colaboradoresEsp } = useColaboradores('especialista');

  const currentMes = useMemo(() => {
    if (dataInicioFrom) return new Date(dataInicioFrom + 'T12:00:00').getMonth() + 1;
    return getCurrentMonthBrazil();
  }, [dataInicioFrom]);

  const currentAno = useMemo(() => {
    if (dataInicioFrom) return new Date(dataInicioFrom + 'T12:00:00').getFullYear();
    return getCurrentYearBrazil();
  }, [dataInicioFrom]);

  const { data: metas } = useMetas(currentMes, currentAno);
  const espMeta = useMemo(() => metas?.find(m => m.tipo === 'especialista' && !m.responsavel) || null, [metas]);

  const especialistaStats = useMemo((): EspecialistaStats[] => {
    if (!colaboradoresEsp || colaboradoresEsp.length === 0) return [];

    const espNames = colaboradoresEsp.map(c => c.nome);

    return espNames.map(vendedor => {
      const vn = negocios.filter(n => n.vendedor && n.vendedor.toLowerCase().includes(vendedor.toLowerCase()));
      const vendas = vn.filter(n => n.data_venda).length;
      const faturamento = vn.filter(n => n.data_venda).reduce((sum, n) => sum + (n.total || 0), 0);
      const reunioesMarcadas = vn.filter(n => n.data_agendamento).length;
      const reunioesAteData = vn.filter(n => n.data_agendamento && n.data_agendamento <= today).length;
      const reunioesRealizadas = vn.filter(n => n.data_reuniao_realizada).length;
      const noShow = vn.filter(n => n.data_noshow).length;
      const mql = vn.filter(n => n.data_mql).length;

      return {
        nome: vendedor,
        faturamento,
        vendas,
        reunioesMarcadas,
        reunioesAteData,
        reunioesRealizadas,
        noShow,
        taxaNoShow: reunioesMarcadas > 0 ? (noShow / reunioesMarcadas) * 100 : 0,
        taxaComparecimento: reunioesMarcadas > 0 ? (reunioesRealizadas / reunioesMarcadas) * 100 : 0,
        taxaConversao: reunioesRealizadas > 0 ? (vendas / reunioesRealizadas) * 100 : 0,
        mql,
        mqlVenda: mql > 0 ? (vendas / mql) * 100 : 0,
        ticketMedio: vendas > 0 ? faturamento / vendas : 0,
      };
    }).sort((a, b) => b.faturamento - a.faturamento);
  }, [negocios, today, colaboradoresEsp]);

  const espTotais = useMemo(() => {
    const t = especialistaStats.reduce((acc, c) => ({
      faturamento: acc.faturamento + c.faturamento,
      vendas: acc.vendas + c.vendas,
      reunioesRealizadas: acc.reunioesRealizadas + c.reunioesRealizadas,
      mql: acc.mql + c.mql,
    }), { faturamento: 0, vendas: 0, reunioesRealizadas: 0, mql: 0 });
    return { ...t, numEspecialistas: especialistaStats.length };
  }, [especialistaStats]);

  const espMetaItems = useEspecialistaMetaItems(espMeta, espTotais);

  const maxReceita = Math.max(...especialistaStats.map(e => e.faturamento), 1);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const getTaxaBadge = (taxa: number) => {
    if (taxa >= 40) return <Badge variant="outline" className="bg-success/20 text-success-foreground">Excelente</Badge>;
    if (taxa >= 25) return <Badge variant="outline" className="bg-accent/20 text-accent-foreground">Bom</Badge>;
    if (taxa >= 15) return <Badge variant="outline" className="bg-warning/20 text-warning-foreground">Regular</Badge>;
    return <Badge variant="outline" className="bg-destructive/20 text-destructive-foreground">Baixo</Badge>;
  };

  return (
    <div className="space-y-4">
      <MetasTargetBar tipo="especialista" items={espMetaItems} mes={currentMes} ano={currentAno} />
      <div className="dashboard-section">
        <h3 className="section-title">Performance Especialistas (Closers)</h3>

      {especialistaStats.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Closer</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Reuniões Marc.</TableHead>
                <TableHead className="text-right">Reun. até Hoje</TableHead>
                <TableHead className="text-right">Realizadas</TableHead>
                <TableHead className="text-right">No-Show</TableHead>
                <TableHead className="text-right">MQL</TableHead>
                <TableHead className="text-right">% Conv.</TableHead>
                <TableHead className="text-right">MQL→Venda</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {especialistaStats.map((esp) => (
                <TableRow key={esp.nome}>
                  <TableCell className="font-medium">{esp.nome}</TableCell>
                  <TableCell className="text-right font-semibold text-success">{formatCurrency(esp.faturamento)}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{new Intl.NumberFormat('pt-BR').format(esp.vendas)}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-BR').format(esp.reunioesMarcadas)}</TableCell>
                  <TableCell className="text-right font-semibold">{new Intl.NumberFormat('pt-BR').format(esp.reunioesAteData)}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-BR').format(esp.reunioesRealizadas)}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-BR').format(esp.noShow)}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('pt-BR').format(esp.mql)}</TableCell>
                  <TableCell className="text-right font-medium">{esp.taxaConversao.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{esp.mqlVenda.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(esp.ticketMedio)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={(esp.faturamento / maxReceita) * 100} className="h-2 flex-1" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getTaxaBadge(esp.taxaConversao)}
                    <span className="ml-1 text-xs text-muted-foreground">{esp.taxaConversao.toFixed(1)}%</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      </div>

      {/* Panorama Diário Especialistas */}
      <PanoramaDiario
        titulo="Panorama Diário — Especialistas"
        colaboradorField="especialista"
        metricas={[
          { key: 'reunioes', label: 'Reuniões Realizadas', metaDiaria: 3 },
          { key: 'vendas_qtd', label: 'Vendas qtd', metaDiaria: 1 },
          { key: 'vendas_rs', label: 'Vendas R$', metaDiaria: 15218, format: 'currency' },
          { key: 'taxa_conversao', label: 'Taxa de Conversão', metaDiaria: 25, format: 'percent' },
          { key: 'noshow', label: 'No-show', metaDiaria: 1 },
        ]}
      />
    </div>
  );
}
