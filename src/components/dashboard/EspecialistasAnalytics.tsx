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
  Cell,
  ReferenceLine
} from 'recharts';
import { isComercial } from '@/lib/pipelines';

interface EspecialistasAnalyticsProps {
  negocios: Negocio[];
  filters?: NegocioFilters;
}

interface EspecialistaStats {
  nome: string;
  reunioesRecebidas: number;
  vendasRealizadas: number;
  taxaConversao: number;
  faturamento: number;
  ticketMedio: number;
}

export function EspecialistasAnalytics({ negocios, filters }: EspecialistasAnalyticsProps) {
  const isInPeriod = (dateStr: string | null | undefined): boolean => {
    return !!dateStr;
  };

  const { especialistaStats, mediaConversao, mediaFaturamento } = useMemo(() => {
    // Especialistas Analytics: apenas Comercial 1 - Se tu for eu vou
    const negociosComercial = negocios.filter(n => isComercial(n.pipeline));
    const vendedores = [...new Set(negociosComercial.map(n => n.vendedor).filter((v): v is string => !!v))];
    
    const stats = vendedores.map(vendedor => {
      const vendedorNegocios = negociosComercial.filter(n => n.vendedor === vendedor);
      
      // Reuniões: por data_reuniao_realizada
      const reunioesRecebidas = vendedorNegocios.filter(n => 
        n.reuniao_realizada && isInPeriod(n.data_reuniao_realizada)
      ).length;
      
      // Vendas e faturamento: por data_venda
      const vendas = vendedorNegocios.filter(n => 
        n.data_venda && isInPeriod(n.data_venda)
      );
      const vendasRealizadas = vendas.length;
      const taxaConversao = reunioesRecebidas > 0 ? (vendasRealizadas / reunioesRecebidas) * 100 : 0;
      const faturamento = vendas.reduce((sum, n) => sum + (n.total || 0), 0);
      const ticketMedio = vendasRealizadas > 0 ? faturamento / vendasRealizadas : 0;
      
      return {
        nome: vendedor,
        reunioesRecebidas,
        vendasRealizadas,
        taxaConversao,
        faturamento,
        ticketMedio,
      };
    }).sort((a, b) => b.faturamento - a.faturamento);

    const totalConversao = stats.reduce((sum, s) => sum + s.taxaConversao, 0);
    const totalFaturamento = stats.reduce((sum, s) => sum + s.faturamento, 0);
    
    return {
      especialistaStats: stats,
      mediaConversao: stats.length > 0 ? totalConversao / stats.length : 0,
      mediaFaturamento: stats.length > 0 ? totalFaturamento / stats.length : 0,
    };
  }, [negocios, filters]);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);

  const getConversaoStatus = (taxa: number) => {
    if (taxa >= 40) return { icon: Award, class: 'text-success', label: 'Excelente' };
    if (taxa >= 25) return { icon: CheckCircle, class: 'text-success', label: 'Bom' };
    if (taxa >= 15) return { icon: AlertTriangle, class: 'text-warning', label: 'Regular' };
    return { icon: AlertTriangle, class: 'text-destructive', label: 'Baixo' };
  };

  if (especialistaStats.length === 0) {
    return (
      <div className="noc-panel">
        <div className="noc-panel-header">
          <h3 className="noc-panel-title">Especialistas — Fechamento</h3>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado de especialista disponível
        </p>
      </div>
    );
  }

  const chartDataConversao = especialistaStats.map(s => ({
    nome: s.nome.length > 12 ? s.nome.substring(0, 12) + '...' : s.nome,
    taxa: s.taxaConversao,
  })).sort((a, b) => b.taxa - a.taxa);

  const chartDataFaturamento = especialistaStats.map(s => ({
    nome: s.nome.length > 12 ? s.nome.substring(0, 12) + '...' : s.nome,
    valor: s.faturamento,
  })).sort((a, b) => b.valor - a.valor);

  // Totals
  const totais = especialistaStats.reduce((acc, esp) => ({
    reunioes: acc.reunioes + esp.reunioesRecebidas,
    vendas: acc.vendas + esp.vendasRealizadas,
    faturamento: acc.faturamento + esp.faturamento,
  }), { reunioes: 0, vendas: 0, faturamento: 0 });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="noc-panel p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Especialistas</p>
          <p className="text-2xl font-display font-bold">{especialistaStats.length}</p>
        </div>
        <div className="noc-panel p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conversão Média</p>
          <p className={cn(
            'text-2xl font-display font-bold',
            mediaConversao >= 25 ? 'text-success' : 'text-warning'
          )}>
            {mediaConversao.toFixed(1)}%
          </p>
        </div>
        <div className="noc-panel p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Vendas</p>
          <p className="text-2xl font-display font-bold text-primary">{formatNumber(totais.vendas)}</p>
        </div>
        <div className="noc-panel p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Receita</p>
          <p className="text-2xl font-display font-bold text-success">{formatCurrency(totais.faturamento)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking by Conversão */}
        <div className="noc-panel">
          <div className="noc-panel-header">
            <h3 className="noc-panel-title">Ranking por Conversão</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataConversao.slice(0, 8)} layout="vertical">
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
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversão']}
                />
                <ReferenceLine 
                  x={25} 
                  stroke="hsl(var(--success))" 
                  strokeDasharray="5 5"
                />
                <Bar dataKey="taxa" radius={[0, 4, 4, 0]}>
                  {chartDataConversao.slice(0, 8).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.taxa >= 25 ? 'hsl(var(--success))' : 'hsl(var(--warning))'} 
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
            <h3 className="noc-panel-title">Ranking por Faturamento</h3>
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
                <ReferenceLine 
                  x={mediaFaturamento} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="5 5"
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
          <h3 className="noc-panel-title">Detalhamento Especialistas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Especialista
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reuniões
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vendas
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  % Conversão
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Faturamento
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ticket Médio
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {especialistaStats.map((esp, index) => {
                const status = getConversaoStatus(esp.taxaConversao);
                const StatusIcon = status.icon;
                
                return (
                  <tr 
                    key={esp.nome} 
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-muted/30',
                      index === 0 && 'bg-success/10'
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium">{esp.nome}</span>
                      {index === 0 && (
                        <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                          Top
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">{formatNumber(esp.reunioesRecebidas)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">
                      {formatNumber(esp.vendasRealizadas)}
                    </td>
                    <td className={cn('py-3 px-4 text-right font-medium', status.class)}>
                      {esp.taxaConversao.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-success">
                      {formatCurrency(esp.faturamento)}
                    </td>
                    <td className="py-3 px-4 text-right">{formatCurrency(esp.ticketMedio)}</td>
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
            <tfoot>
              <tr className="bg-muted/50 font-semibold">
                <td className="py-3 px-4">TOTAL</td>
                <td className="py-3 px-4 text-right">{formatNumber(totais.reunioes)}</td>
                <td className="py-3 px-4 text-right text-primary">{formatNumber(totais.vendas)}</td>
                <td className="py-3 px-4 text-right">
                  {(totais.reunioes > 0 ? (totais.vendas / totais.reunioes) * 100 : 0).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right text-success">{formatCurrency(totais.faturamento)}</td>
                <td className="py-3 px-4 text-right">
                  {formatCurrency(totais.vendas > 0 ? totais.faturamento / totais.vendas : 0)}
                </td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}