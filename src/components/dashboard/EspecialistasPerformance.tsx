import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { cn } from '@/lib/utils';
import { TrendingUp, AlertTriangle, CheckCircle, Award } from 'lucide-react';

interface EspecialistasPerformanceProps {
  negocios: Negocio[];
}

interface EspecialistaStats {
  nome: string;
  reunioesRecebidas: number;
  vendasRealizadas: number;
  taxaConversao: number;
  faturamento: number;
  ticketMedio: number;
}

export function EspecialistasPerformance({ negocios }: EspecialistasPerformanceProps) {
  const especialistaStats = useMemo((): EspecialistaStats[] => {
    const vendedores = [...new Set(negocios.map(n => n.vendedor).filter((v): v is string => !!v))];
    
    return vendedores.map(vendedor => {
      const vendedorNegocios = negocios.filter(n => n.vendedor === vendedor);
      
      // Reuniões recebidas = reuniões realizadas atribuídas a este especialista
      const reunioesRecebidas = vendedorNegocios.filter(n => n.reuniao_realizada).length;
      
      const vendas = vendedorNegocios.filter(n => n.data_venda !== null);
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

  const getConversaoStatus = (taxa: number) => {
    // Meta ideal SQL → Vendas: ≥25%
    if (taxa >= 40) return { icon: Award, class: 'text-success', label: 'Excelente' };
    if (taxa >= 25) return { icon: CheckCircle, class: 'text-success', label: 'Bom' };
    if (taxa >= 15) return { icon: AlertTriangle, class: 'text-warning', label: 'Regular' };
    return { icon: AlertTriangle, class: 'text-destructive', label: 'Baixo' };
  };

  if (especialistaStats.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
        <h3 className="text-xl font-display font-semibold text-foreground mb-4">
          Performance Especialistas — Fechamento
        </h3>
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado de especialista disponível
        </p>
      </div>
    );
  }

  // Calcular totais
  const totais = especialistaStats.reduce((acc, esp) => ({
    reunioes: acc.reunioes + esp.reunioesRecebidas,
    vendas: acc.vendas + esp.vendasRealizadas,
    faturamento: acc.faturamento + esp.faturamento,
  }), { reunioes: 0, vendas: 0, faturamento: 0 });

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
      <div className="mb-6">
        <h3 className="text-xl font-display font-semibold text-foreground">
          Performance Especialistas — Fechamento
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Avaliação de capacidade de fechamento e geração de receita
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Especialista
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Reuniões
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Vendas
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                % Conversão
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Faturamento
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Ticket Médio
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
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
                    index === 0 && 'bg-success/5'
                  )}
                >
                  <td className="py-4 px-4">
                    <span className="font-medium text-foreground">{esp.nome}</span>
                    {index === 0 && (
                      <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                        Top
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-medium">
                    {formatNumber(esp.reunioesRecebidas)}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-primary">
                    {formatNumber(esp.vendasRealizadas)}
                  </td>
                  <td className={cn('py-4 px-4 text-right font-medium', status.class)}>
                    {formatPercent(esp.taxaConversao)}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-success">
                    {formatCurrency(esp.faturamento)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {formatCurrency(esp.ticketMedio)}
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
          <tfoot>
            <tr className="bg-muted/50 font-semibold">
              <td className="py-4 px-4 text-foreground">TOTAL</td>
              <td className="py-4 px-4 text-right">{formatNumber(totais.reunioes)}</td>
              <td className="py-4 px-4 text-right text-primary">{formatNumber(totais.vendas)}</td>
              <td className="py-4 px-4 text-right">
                {formatPercent(totais.reunioes > 0 ? (totais.vendas / totais.reunioes) * 100 : 0)}
              </td>
              <td className="py-4 px-4 text-right text-success">{formatCurrency(totais.faturamento)}</td>
              <td className="py-4 px-4 text-right">
                {formatCurrency(totais.vendas > 0 ? totais.faturamento / totais.vendas : 0)}
              </td>
              <td className="py-4 px-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
