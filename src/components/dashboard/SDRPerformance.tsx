import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { getTodayBrazil } from '@/lib/dateUtils';

interface SDRPerformanceProps {
  negocios: Negocio[];
}

interface SDRStats {
  nome: string;
  agendamentosTotais: number;
  agendamentosAteData: number;
  fechouVenda: number;
  faturamentoGerado: number;
  reunioesRealizadas: number;
  noShow: number;
  noShowPercent: number;
  comparecimento: number;
  mql: number;
  totalLeads: number;
  leadMql: number;
}

export function SDRPerformance({ negocios }: SDRPerformanceProps) {
  const today = getTodayBrazil();

  const sdrStats = useMemo((): SDRStats[] => {
    const sdrs = [...new Set(negocios.map(n => n.sdr).filter((s): s is string => !!s && s.trim() !== ''))];

    return sdrs.map(sdr => {
      const sdrNegocios = negocios.filter(n => n.sdr === sdr);
      const totalLeads = sdrNegocios.length;
      const agendamentosTotais = sdrNegocios.filter(n => n.data_agendamento).length;
      const agendamentosAteData = sdrNegocios.filter(n => n.data_agendamento && n.data_agendamento <= today).length;
      const reunioesRealizadas = sdrNegocios.filter(n => n.data_reuniao_realizada).length;
      const noShow = sdrNegocios.filter(n => n.data_noshow).length;
      const fechouVenda = sdrNegocios.filter(n => n.data_venda).length;
      const faturamentoGerado = sdrNegocios.filter(n => n.data_venda).reduce((sum, n) => sum + (n.total || 0), 0);
      const mql = sdrNegocios.filter(n => n.data_mql).length;

      return {
        nome: sdr,
        agendamentosTotais,
        agendamentosAteData,
        fechouVenda,
        faturamentoGerado,
        reunioesRealizadas,
        noShow,
        noShowPercent: agendamentosTotais > 0 ? (noShow / agendamentosTotais) * 100 : 0,
        comparecimento: reunioesRealizadas,
        mql,
        totalLeads,
        leadMql: totalLeads > 0 ? (mql / totalLeads) * 100 : 0,
      };
    }).sort((a, b) => b.faturamentoGerado - a.faturamentoGerado);
  }, [negocios, today]);

  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getNoShowStatus = (taxa: number) => {
    if (taxa <= 15) return { icon: CheckCircle, class: 'text-success', label: 'Ótimo' };
    if (taxa <= 25) return { icon: AlertTriangle, class: 'text-warning', label: 'Atenção' };
    return { icon: AlertTriangle, class: 'text-destructive', label: 'Crítico' };
  };

  if (sdrStats.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
        <h3 className="text-xl font-display font-semibold text-foreground mb-4">Performance SDRs</h3>
        <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
      </div>
    );
  }

  const totais = sdrStats.reduce((acc, s) => ({
    agendamentosTotais: acc.agendamentosTotais + s.agendamentosTotais,
    agendamentosAteData: acc.agendamentosAteData + s.agendamentosAteData,
    fechouVenda: acc.fechouVenda + s.fechouVenda,
    faturamentoGerado: acc.faturamentoGerado + s.faturamentoGerado,
    reunioesRealizadas: acc.reunioesRealizadas + s.reunioesRealizadas,
    noShow: acc.noShow + s.noShow,
    comparecimento: acc.comparecimento + s.comparecimento,
    mql: acc.mql + s.mql,
    totalLeads: acc.totalLeads + s.totalLeads,
  }), { agendamentosTotais: 0, agendamentosAteData: 0, fechouVenda: 0, faturamentoGerado: 0, reunioesRealizadas: 0, noShow: 0, comparecimento: 0, mql: 0, totalLeads: 0 });

  const headers = ['SDR', 'Agend. Totais', 'Agend. até Hoje', 'Vendas', 'Faturamento', 'Reuniões', 'No-Show', 'No-Show %', 'Comparec.', 'MQL', 'Leads', 'Lead→MQL', 'Status'];

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
      <div className="mb-6">
        <h3 className="text-xl font-display font-semibold text-foreground">Performance SDRs — Quem fez o agendamento</h3>
        <p className="text-sm text-muted-foreground mt-1">Indicadores calculados pelo campo "Quem fez o agendamento?"</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {headers.map(h => (
                <th key={h} className={cn(
                  "py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider",
                  h === 'SDR' ? 'text-left' : 'text-right',
                  h === 'Status' && 'text-center'
                )}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sdrStats.map((s, index) => {
              const status = getNoShowStatus(s.noShowPercent);
              const StatusIcon = status.icon;
              return (
                <tr key={s.nome} className={cn('border-b border-border/50 transition-colors hover:bg-muted/30', index === 0 && 'bg-success/5')}>
                  <td className="py-3 px-3">
                    <span className="font-medium text-foreground">{s.nome}</span>
                    {index === 0 && <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">Top</span>}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-primary">{formatNumber(s.agendamentosTotais)}</td>
                  <td className="py-3 px-3 text-right font-semibold">{formatNumber(s.agendamentosAteData)}</td>
                  <td className="py-3 px-3 text-right font-semibold">{formatNumber(s.fechouVenda)}</td>
                  <td className="py-3 px-3 text-right font-semibold text-success">{formatCurrency(s.faturamentoGerado)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(s.reunioesRealizadas)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(s.noShow)}</td>
                  <td className={cn("py-3 px-3 text-right font-medium", s.noShowPercent > 20 ? 'text-destructive' : 'text-success')}>{formatPercent(s.noShowPercent)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(s.comparecimento)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(s.mql)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(s.totalLeads)}</td>
                  <td className="py-3 px-3 text-right">{formatPercent(s.leadMql)}</td>
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
              <td className="py-3 px-3 text-right text-primary">{formatNumber(totais.agendamentosTotais)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.agendamentosAteData)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.fechouVenda)}</td>
              <td className="py-3 px-3 text-right text-success">{formatCurrency(totais.faturamentoGerado)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.reunioesRealizadas)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.noShow)}</td>
              <td className="py-3 px-3 text-right">{formatPercent(totais.agendamentosTotais > 0 ? (totais.noShow / totais.agendamentosTotais) * 100 : 0)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.comparecimento)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.mql)}</td>
              <td className="py-3 px-3 text-right">{formatNumber(totais.totalLeads)}</td>
              <td className="py-3 px-3 text-right">{formatPercent(totais.totalLeads > 0 ? (totais.mql / totais.totalLeads) * 100 : 0)}</td>
              <td className="py-3 px-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
