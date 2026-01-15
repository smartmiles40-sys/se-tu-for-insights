import { useMemo } from 'react';
import { Negocio, NegocioFilters } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Award } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { isPreVendas } from '@/lib/pipelines';

interface SDRAnalyticsProps {
  negocios: Negocio[];
  filters?: NegocioFilters;
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

export function SDRAnalytics({ negocios, filters }: SDRAnalyticsProps) {
  // Helper to check if date is in period
  const isInPeriod = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false;
    if (!filters?.dataInicio || !filters?.dataFim) return true;
    return dateStr >= filters.dataInicio && dateStr <= filters.dataFim;
  };

  const sdrStats = useMemo((): SDRStats[] => {
    // SDR Analytics: apenas Pré-Vendas - Comercial
    const negociosPreVendas = negocios.filter(n => isPreVendas(n.pipeline));
    const sdrs = [...new Set(negociosPreVendas.map(n => n.sdr).filter((s): s is string => !!s))];
    
    return sdrs.map(sdr => {
      const sdrNegocios = negociosPreVendas.filter(n => n.sdr === sdr);
      
      // Leads: por primeiro_contato
      const leadsRecebidos = sdrNegocios.filter(n => isInPeriod(n.primeiro_contato)).length;
      
      // Agendamentos: por data_agendamento
      const reunioesAgendadas = sdrNegocios.filter(n => 
        n.reuniao_agendada && isInPeriod(n.data_agendamento || n.primeiro_contato)
      ).length;
      
      // Reuniões realizadas: por data_reuniao_realizada (no Pré-Vendas)
      const reunioesRealizadas = sdrNegocios.filter(n => 
        n.reuniao_realizada && isInPeriod(n.data_reuniao_realizada)
      ).length;
      
      // No-shows: COUNT(data_noshow IS NOT NULL) - presença de data indica no-show
      const noShows = sdrNegocios.filter(n => 
        n.data_noshow !== null && 
        n.data_noshow !== undefined &&
        isInPeriod(n.data_noshow)
      ).length;
      
      const taxaAgendamento = leadsRecebidos > 0 ? (reunioesAgendadas / leadsRecebidos) * 100 : 0;
      const taxaNoShow = reunioesAgendadas > 0 ? (noShows / reunioesAgendadas) * 100 : 0;
      const taxaShowUp = reunioesAgendadas > 0 ? (reunioesRealizadas / reunioesAgendadas) * 100 : 0;
      
      // Faturamento originado: vendas que vieram deste SDR (pode verificar em qualquer pipeline)
      const faturamentoOriginado = negocios
        .filter(n => n.sdr === sdr && n.venda_aprovada && isInPeriod(n.data_venda))
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
  }, [negocios, filters]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);

  const getNoShowStatus = (taxa: number) => {
    if (taxa <= 15) return { icon: CheckCircle, class: 'text-success', label: 'Ótimo' };
    if (taxa <= 25) return { icon: AlertTriangle, class: 'text-warning', label: 'Atenção' };
    return { icon: AlertTriangle, class: 'text-destructive', label: 'Crítico' };
  };

  if (sdrStats.length === 0) {
    return (
      <div className="noc-panel">
        <div className="noc-panel-header">
          <h3 className="noc-panel-title">SDRs — Qualificação</h3>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado de SDR disponível
        </p>
      </div>
    );
  }

  const chartDataAgendamento = sdrStats.map(s => ({
    nome: s.nome.length > 12 ? s.nome.substring(0, 12) + '...' : s.nome,
    taxa: s.taxaAgendamento,
  })).sort((a, b) => b.taxa - a.taxa);

  const chartDataFaturamento = sdrStats.map(s => ({
    nome: s.nome.length > 12 ? s.nome.substring(0, 12) + '...' : s.nome,
    valor: s.faturamentoOriginado,
  })).sort((a, b) => b.valor - a.valor);

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking by Agendamento */}
        <div className="noc-panel">
          <div className="noc-panel-header">
            <h3 className="noc-panel-title">Ranking por Agendamento</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataAgendamento.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis 
                  type="category" 
                  dataKey="nome" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  width={90}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa']}
                />
                <Bar dataKey="taxa" radius={[0, 4, 4, 0]}>
                  {chartDataAgendamento.slice(0, 8).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.taxa >= 50 ? 'hsl(var(--success))' : 'hsl(var(--warning))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking by Faturamento */}
        <div className="noc-panel">
          <div className="noc-panel-header">
            <h3 className="noc-panel-title">Faturamento Originado</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataFaturamento.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="nome" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  width={90}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="noc-panel">
        <div className="noc-panel-header">
          <h3 className="noc-panel-title">Detalhamento SDRs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  SDR
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Leads
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Agendadas
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  % Agend.
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Realizadas
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  % No-Show
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  % Show-Up
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Faturamento
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                      index === 0 && 'bg-success/10'
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium">{sdr.nome}</span>
                      {index === 0 && (
                        <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                          Top
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">{formatNumber(sdr.leadsRecebidos)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">
                      {formatNumber(sdr.reunioesAgendadas)}
                    </td>
                    <td className={cn(
                      'py-3 px-4 text-right font-medium',
                      sdr.taxaAgendamento >= 50 ? 'text-success' : 'text-warning'
                    )}>
                      {sdr.taxaAgendamento.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right">{formatNumber(sdr.reunioesRealizadas)}</td>
                    <td className={cn('py-3 px-4 text-right font-medium', status.class)}>
                      {sdr.taxaNoShow.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right">{sdr.taxaShowUp.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-right font-semibold text-success">
                      {formatCurrency(sdr.faturamentoOriginado)}
                    </td>
                    <td className="py-3 px-4 text-center">
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
    </div>
  );
}