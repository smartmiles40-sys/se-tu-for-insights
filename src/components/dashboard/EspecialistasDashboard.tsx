import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EspecialistasDashboardProps {
  negocios: Negocio[];
}

interface EspecialistaStats {
  nome: string;
  reunioesRecebidas: number;
  vendasRealizadas: number;
  taxaFechamento: number;
  receitaGerada: number;
  ticketMedio: number;
}

export function EspecialistasDashboard({ negocios }: EspecialistasDashboardProps) {
  const especialistaStats = useMemo((): EspecialistaStats[] => {
    const vendedores = [...new Set(negocios.map(n => n.vendedor).filter((v): v is string => !!v))];
    
    return vendedores.map(vendedor => {
      const vendedorNegocios = negocios.filter(n => n.vendedor === vendedor);
      const reunioesRecebidas = vendedorNegocios.filter(n => n.reuniao_realizada).length;
      const vendas = vendedorNegocios.filter(n => n.venda_aprovada);
      const vendasRealizadas = vendas.length;
      const taxaFechamento = reunioesRecebidas > 0 ? (vendasRealizadas / reunioesRecebidas) * 100 : 0;
      const receitaGerada = vendas.reduce((sum, n) => sum + (n.total || 0), 0);
      const ticketMedio = vendasRealizadas > 0 ? receitaGerada / vendasRealizadas : 0;
      
      return {
        nome: vendedor,
        reunioesRecebidas,
        vendasRealizadas,
        taxaFechamento,
        receitaGerada,
        ticketMedio,
      };
    }).sort((a, b) => b.receitaGerada - a.receitaGerada);
  }, [negocios]);

  const maxReceita = Math.max(...especialistaStats.map(e => e.receitaGerada), 1);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getTaxaBadge = (taxa: number) => {
    if (taxa >= 40) return <Badge variant="outline" className="bg-success/20 text-success-foreground">Excelente</Badge>;
    if (taxa >= 25) return <Badge variant="outline" className="bg-accent/20 text-accent-foreground">Bom</Badge>;
    if (taxa >= 15) return <Badge variant="outline" className="bg-warning/20 text-warning-foreground">Regular</Badge>;
    return <Badge variant="outline" className="bg-destructive/20 text-destructive-foreground">Baixo</Badge>;
  };

  return (
    <div className="dashboard-section">
      <h3 className="section-title">Performance Especialistas</h3>
      
      {especialistaStats.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado de especialista disponível
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Especialista</TableHead>
                <TableHead className="text-right">Reuniões</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-center">Taxa Fechamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {especialistaStats.map((esp) => (
                <TableRow key={esp.nome}>
                  <TableCell className="font-medium">{esp.nome}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR').format(esp.reunioesRecebidas)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-accent">
                    {new Intl.NumberFormat('pt-BR').format(esp.vendasRealizadas)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatCurrency(esp.receitaGerada)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(esp.ticketMedio)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(esp.receitaGerada / maxReceita) * 100} 
                        className="h-2 flex-1" 
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getTaxaBadge(esp.taxaFechamento)}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {esp.taxaFechamento.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
