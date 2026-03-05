import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { useColaboradores } from '@/hooks/useColaboradores';
import { cn } from '@/lib/utils';
import { Award, AlertTriangle, CheckCircle } from 'lucide-react';

interface EspecialistasPerformanceProps {
  negocios: Negocio[];
}

interface CloserStats {
  nome: string;
  faturamento: number;
  vendas: number;
  reunioesMarcadas: number;
  reunioesRealizadas: number;
  noShow: number;
  taxaNoShow: number;
  taxaComparecimento: number;
  taxaConversao: number;
  mql: number;
  mqlVenda: number;
  ticketMedio: number;
}

export function EspecialistasPerformance({ negocios }: EspecialistasPerformanceProps) {
  const { data: colaboradoresEsp } = useColaboradores('especialista');

  const closerStats = useMemo((): CloserStats[] => {
    if (!colaboradoresEsp || colaboradoresEsp.length === 0) return [];

    const espNames = colaboradoresEsp.map(c => c.nome);

    return espNames.map(vendedor => {
      const vNegocios = negocios.filter(n => n.vendedor && n.vendedor.toLowerCase().includes(vendedor.toLowerCase()));

      const faturamento = vNegocios.filter(n => n.data_venda).reduce((sum, n) => sum + (n.total || 0), 0);
      const vendas = vNegocios.filter(n => n.data_venda).length;
      const reunioesMarcadas = vNegocios.filter(n => n.data_agendamento).length;
      const reunioesRealizadas = vNegocios.filter(n => n.data_reuniao_realizada).length;
      const noShow = vNegocios.filter(n => n.data_noshow).length;
      const mql = vNegocios.filter(n => n.data_mql).length;

      return {
        nome: vendedor,
        faturamento,
        vendas,
        reunioesMarcadas,
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
  }, [negocios, colaboradoresEsp]);

  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getConversaoStatus = (taxa: number) => {
    if (taxa >= 40) return { icon: Award, class: 'text-success', label: 'Excelente' };
    if (taxa >= 25) return { icon: CheckCircle, class: 'text-success', label: 'Bom' };
    if (taxa >= 15) return { icon: AlertTriangle, class: 'text-warning', label: 'Regular' };
    return { icon: AlertTriangle, class: 'text-destructive', label: 'Baixo' };
  };

  if (closerStats.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
        <h3 className="text-xl font-display font-semibold text-foreground mb-4">Performance Closers</h3>
        <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
      </div>
    );
  }

  const totais = closerStats.reduce((acc, c) => ({
    faturamento: acc.faturamento + c.faturamento,
    vendas: acc.vendas + c.vendas,
    reunioesMarcadas: acc.reunioesMarcadas + c.reunioesMarcadas,
    reunioesRealizadas: acc.reunioesRealizadas + c.reunioesRealizadas,
    noShow: acc.noShow + c.noShow,
    mql: acc.mql + c.mql,
  }), { faturamento: 0, vendas: 0, reunioesMarcadas: 0, reunioesRealizadas: 0, noShow: 0, mql: 0 });

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
      <div className="mb-6">
        <h3 className="text-xl font-display font-semibold text-foreground">Performance Closers — Pessoa responsável</h3>
        <p className="text-sm text-muted-foreground mt-1">Todos os indicadores calculados pelo campo "Pessoa responsável"</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Closer', 'Faturamento', 'Vendas', 'Reuniões Marcadas', 'Realizadas', 'No-Show', '% No-Show', '% Comp.', '% Conv.', 'MQL', 'MQL→Venda', 'Ticket Médio', 'Status'].map(h => (
                <th key={h} className={cn(
                  "py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider",
                  h === 'Closer' ? 'text-left' : 'text-right',
                  h === 'Status' && 'text-center'
                )}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {closerStats.map((c, index) => {
              const status = getConversaoStatus(c.taxaConversao);
              const StatusIcon = status.icon;
              return (
                <tr key={c.nome} className={cn('border-b border-border/50 transition-colors hover:bg-muted/30', index === 0 && 'bg-success/5')}>
                  <td className="py-3 px-3">
                    <span className="font-medium text-foreground">{c.nome}</span>
                    {index === 0 && <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">Top</span>}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-success">{formatCurrency(c.faturamento)}</td>
                  <td className="py-3 px-3 text-right font-semibold text-primary">{formatNumber(c.vendas)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(c.reunioesMarcadas)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(c.reunioesRealizadas)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(c.noShow)}</td>
                  <td className={cn("py-3 px-3 text-right font-medium", c.taxaNoShow > 20 ? 'text-destructive' : 'text-success')}>{formatPercent(c.taxaNoShow)}</td>
                  <td className={cn("py-3 px-3 text-right font-medium", c.taxaComparecimento >= 80 ? 'text-success' : 'text-warning')}>{formatPercent(c.taxaComparecimento)}</td>
                  <td className={cn("py-3 px-3 text-right font-medium", status.class)}>{formatPercent(c.taxaConversao)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(c.mql)}</td>
                  <td className="py-3 px-3 text-right">{formatPercent(c.mqlVenda)}</td>
                  <td className="py-3 px-3 text-right">{formatCurrency(c.ticketMedio)}</td>
                  <td className="py-3 px-3 text-center">
                    <div className={cn('flex items-center justify-center gap-1', status.class)}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-xs">{status.label}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 font-semibold">
              <td className="py-3 px-3">TOTAL</td>
              <td className="py-3 px-3 text-right text-success">{formatCurrency(totais.faturamento)}</td>
              <td className="py-3 px-3 text-right text-primary">{formatNumber(totais.vendas)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.reunioesMarcadas)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.reunioesRealizadas)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.noShow)}</td>
              <td className="py-3 px-3 text-right">{formatPercent(totais.reunioesMarcadas > 0 ? (totais.noShow / totais.reunioesMarcadas) * 100 : 0)}</td>
              <td className="py-3 px-3 text-right">{formatPercent(totais.reunioesMarcadas > 0 ? (totais.reunioesRealizadas / totais.reunioesMarcadas) * 100 : 0)}</td>
              <td className="py-3 px-3 text-right">{formatPercent(totais.reunioesRealizadas > 0 ? (totais.vendas / totais.reunioesRealizadas) * 100 : 0)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.mql)}</td>
              <td className="py-3 px-3 text-right">{formatPercent(totais.mql > 0 ? (totais.vendas / totais.mql) * 100 : 0)}</td>
              <td className="py-3 px-3 text-right">{formatCurrency(totais.vendas > 0 ? totais.faturamento / totais.vendas : 0)}</td>
              <td className="py-3 px-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
