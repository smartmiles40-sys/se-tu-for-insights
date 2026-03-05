import { ClienteRelacionamento } from '@/hooks/useClientesRelacionamento';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';

interface ClienteRankingTableProps {
  clientes: ClienteRelacionamento[];
  limit?: number;
}

export function ClienteRankingTable({ clientes, limit = 15 }: ClienteRankingTableProps) {
  const sorted = [...clientes].sort((a, b) => b.valor_total_cliente - a.valor_total_cliente).slice(0, limit);
  const maxVal = sorted[0]?.valor_total_cliente || 1;
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="bi-card">
      <h3 className="bi-card-title mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-400" />
        Top Clientes por Receita
      </h3>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700/50">
              <TableHead className="text-xs w-8">#</TableHead>
              <TableHead className="text-xs">Cliente</TableHead>
              <TableHead className="text-xs text-right">Receita</TableHead>
              <TableHead className="text-xs text-right">Viagens</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c, i) => (
              <TableRow key={c.id} className="border-slate-800/50">
                <TableCell className="text-xs font-bold text-slate-400">{i + 1}</TableCell>
                <TableCell className="text-xs font-medium text-slate-200">{c.nome_cliente}</TableCell>
                <TableCell className="text-xs text-right font-bold text-emerald-400">{formatCurrency(c.valor_total_cliente)}</TableCell>
                <TableCell className="text-xs text-right text-slate-300">{c.quantidade_viagens}</TableCell>
                <TableCell>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'}`}>
                    {c.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-1.5 rounded-full" style={{ width: `${(c.valor_total_cliente / maxVal) * 100}%` }} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
