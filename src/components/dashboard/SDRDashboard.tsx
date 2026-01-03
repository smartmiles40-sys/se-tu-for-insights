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

interface SDRDashboardProps {
  negocios: Negocio[];
}

interface SDRStats {
  nome: string;
  negociosRecebidos: number;
  reunioesAgendadas: number;
  reunioesRealizadas: number;
  noShows: number;
  taxaNoShow: number;
  taxaConversao: number;
}

export function SDRDashboard({ negocios }: SDRDashboardProps) {
  const sdrStats = useMemo((): SDRStats[] => {
    const sdrs = [...new Set(negocios.map(n => n.sdr).filter((s): s is string => !!s))];
    
    return sdrs.map(sdr => {
      const sdrNegocios = negocios.filter(n => n.sdr === sdr);
      const negociosRecebidos = sdrNegocios.length;
      const reunioesAgendadas = sdrNegocios.filter(n => n.reuniao_agendada).length;
      const reunioesRealizadas = sdrNegocios.filter(n => n.reuniao_realizada).length;
      const noShows = sdrNegocios.filter(n => n.no_show).length;
      const taxaNoShow = reunioesAgendadas > 0 ? (noShows / reunioesAgendadas) * 100 : 0;
      const taxaConversao = negociosRecebidos > 0 ? (reunioesAgendadas / negociosRecebidos) * 100 : 0;
      
      return {
        nome: sdr,
        negociosRecebidos,
        reunioesAgendadas,
        reunioesRealizadas,
        noShows,
        taxaNoShow,
        taxaConversao,
      };
    }).sort((a, b) => b.reunioesAgendadas - a.reunioesAgendadas);
  }, [negocios]);

  const maxAgendadas = Math.max(...sdrStats.map(s => s.reunioesAgendadas), 1);

  const getNoShowBadge = (taxa: number) => {
    if (taxa <= 10) return <Badge variant="outline" className="bg-success/20 text-success-foreground">Excelente</Badge>;
    if (taxa <= 20) return <Badge variant="outline" className="bg-warning/20 text-warning-foreground">Atenção</Badge>;
    return <Badge variant="outline" className="bg-destructive/20 text-destructive-foreground">Crítico</Badge>;
  };

  return (
    <div className="dashboard-section">
      <h3 className="section-title">Performance SDRs</h3>
      
      {sdrStats.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhum dado de SDR disponível
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">SDR</TableHead>
                <TableHead className="text-right">Negócios</TableHead>
                <TableHead className="text-right">Agendadas</TableHead>
                <TableHead className="text-right">Realizadas</TableHead>
                <TableHead className="text-right">No-Show</TableHead>
                <TableHead>Taxa Conversão</TableHead>
                <TableHead className="text-center">Status No-Show</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdrStats.map((sdr) => (
                <TableRow key={sdr.nome}>
                  <TableCell className="font-medium">{sdr.nome}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR').format(sdr.negociosRecebidos)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {new Intl.NumberFormat('pt-BR').format(sdr.reunioesAgendadas)}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR').format(sdr.reunioesRealizadas)}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {sdr.noShows} ({sdr.taxaNoShow.toFixed(1)}%)
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(sdr.reunioesAgendadas / maxAgendadas) * 100} 
                        className="h-2 flex-1" 
                      />
                      <span className="text-sm font-medium w-14 text-right">
                        {sdr.taxaConversao.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getNoShowBadge(sdr.taxaNoShow)}
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
