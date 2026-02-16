import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface SDRPerformanceProps {
  negocios: Negocio[];
}

interface SDRStats {
  nome: string;
  leadsRecebidos: number;
  reunioesAgendadas: number;
  taxaAgendamento: number;
  reunioesRealizadas: number;
  noShows: number;
  taxaNoShow: number;
  taxaShowUp: number;
  faturamentoOriginado: number;
}

export function SDRPerformance({ negocios }: SDRPerformanceProps) {
  const sdrStats = useMemo((): SDRStats[] => {
    const sdrs = [...new Set(negocios.map(n => n.sdr).filter((s): s is string => !!s))];
    
    return sdrs.map(sdr => {
      const sdrNegocios = negocios.filter(n => n.sdr === sdr);
      const leadsRecebidos = sdrNegocios.length;
      const reunioesAgendadas = sdrNegocios.filter(n => n.reuniao_agendada).length;
      const reunioesRealizadas = sdrNegocios.filter(n => n.reuniao_realizada).length;
      
      // No-show: apenas se NÃO realizou reunião depois
      const noShows = sdrNegocios.filter(n => n.data_noshow !== null && n.data_noshow !== undefined && !n.data_reuniao_realizada).length;
      
      const taxaAgendamento = leadsRecebidos > 0 ? (reunioesAgendadas / leadsRecebidos) * 100 : 0;
      const taxaNoShow = reunioesAgendadas > 0 ? (noShows / reunioesAgendadas) * 100 : 0;
      const taxaShowUp = reunioesAgendadas > 0 ? (reunioesRealizadas / reunioesAgendadas) * 100 : 0;
      
      // Faturamento: vendas realizadas dos leads agendados por este SDR
      const faturamentoOriginado = sdrNegocios
        .filter(n => n.venda_aprovada)
        .reduce((sum, n) => sum + (n.total || 0), 0);
      
      return {
        nome: sdr,
        leadsRecebidos,
        reunioesAgendadas,
        taxaAgendamento,
        reunioesRealizadas,
        noShows,
        taxaNoShow,
        taxaShowUp,
        faturamentoOriginado,
      };
    }).sort((a, b) => b.faturamentoOriginado - a.faturamentoOriginado);
  }, [negocios]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getNoShowStatus = (taxa: number) => {
    if (taxa <= 15) return { icon: CheckCircle, class: 'text-success', label: 'Ótimo' };
    if (taxa <= 25) return { icon: AlertTriangle, class: 'text-warning', label: 'Atenção' };
    return { icon: AlertTriangle, class: 'text-destructive', label: 'Crítico' };
  };

  if (sdrStats.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
        <h3 className="text-xl font-display font-semibold text-foreground mb-4">
          Performance SDRs — Qualificação
        </h3>
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado de SDR disponível
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
      <div className="mb-6">
        <h3 className="text-xl font-display font-semibold text-foreground">
          Performance SDRs — Qualificação
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Avaliação de qualidade da agenda e impacto financeiro
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                SDR
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Leads
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Agendadas
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                % Agend.
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Realizadas
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                % No-Show
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                % Show-Up
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Faturamento
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sdrStats.map((sdr, index) => {
              const status = getNoShowStatus(sdr.taxaNoShow);
              const StatusIcon = status.icon;
              
              return (
                <tr 
                  key={sdr.nome} 
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-muted/30',
                    index === 0 && 'bg-success/5'
                  )}
                >
                  <td className="py-4 px-4">
                    <span className="font-medium text-foreground">{sdr.nome}</span>
                    {index === 0 && (
                      <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                        Top
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-medium">
                    {formatNumber(sdr.leadsRecebidos)}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-primary">
                    {formatNumber(sdr.reunioesAgendadas)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {formatPercent(sdr.taxaAgendamento)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {formatNumber(sdr.reunioesRealizadas)}
                  </td>
                  <td className={cn('py-4 px-4 text-right font-medium', status.class)}>
                    {formatPercent(sdr.taxaNoShow)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {formatPercent(sdr.taxaShowUp)}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-success">
                    {formatCurrency(sdr.faturamentoOriginado)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className={cn('flex items-center justify-center gap-1', status.class)}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-xs">{status.label}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
