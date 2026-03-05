import { useMemo } from 'react';
import { useNegocios } from '@/hooks/useNegocios';

export interface ClienteRelacionamento {
  nome_cliente: string;
  valor_total_cliente: number;
  quantidade_compras: number;
  data_primeira_compra: string | null;
  data_ultima_compra: string | null;
  ticket_medio: number;
  tempo_entre_compras: number | null; // days
}

export interface ClientesStats {
  ltvMedio: number;
  receitaTotal: number;
  ticketMedio: number;
  taxaRecompra: number;
  clientesAtivos: number;
  clientesRecorrentes: number;
  totalClientes: number;
  clientesMais2Compras: number;
  receitaMediaAtivo: number;
  receitaRecorrentes: number;
  receitaNovos: number;
  tempoMedioEntreCompras: number;
}

export function useClientesRelacionamento() {
  const { data: negocios, isLoading } = useNegocios();

  const clientes = useMemo((): ClienteRelacionamento[] => {
    if (!negocios || negocios.length === 0) return [];

    // Only consider records with data_venda (confirmed sales)
    const vendas = negocios.filter(n => n.data_venda && n.nome);

    // Group by client name (nome field = "Contato: Primeiro nome")
    const grouped: Record<string, { total: number; count: number; dates: string[] }> = {};

    for (const v of vendas) {
      const name = (v.nome || '').trim();
      if (!name) continue;

      if (!grouped[name]) {
        grouped[name] = { total: 0, count: 0, dates: [] };
      }
      grouped[name].total += v.total || 0;
      grouped[name].count += 1;
      grouped[name].dates.push(v.data_venda!);
    }

    return Object.entries(grouped)
      .map(([nome, data]) => {
        const sortedDates = data.dates.sort();
        const primeira = sortedDates[0];
        const ultima = sortedDates[sortedDates.length - 1];

        let tempoEntreCompras: number | null = null;
        if (data.count > 1 && primeira && ultima) {
          const diffMs = new Date(ultima).getTime() - new Date(primeira).getTime();
          tempoEntreCompras = Math.round(diffMs / (1000 * 60 * 60 * 24));
        }

        return {
          nome_cliente: nome,
          valor_total_cliente: data.total,
          quantidade_compras: data.count,
          data_primeira_compra: primeira,
          data_ultima_compra: ultima,
          ticket_medio: data.count > 0 ? data.total / data.count : 0,
          tempo_entre_compras: tempoEntreCompras,
        };
      })
      .sort((a, b) => b.valor_total_cliente - a.valor_total_cliente);
  }, [negocios]);

  return { data: clientes, isLoading };
}

export function useClientesStats(clientes: ClienteRelacionamento[] | undefined): ClientesStats {
  if (!clientes || clientes.length === 0) {
    return {
      ltvMedio: 0, receitaTotal: 0, ticketMedio: 0, taxaRecompra: 0,
      clientesAtivos: 0, clientesRecorrentes: 0, totalClientes: 0,
      clientesMais2Compras: 0, receitaMediaAtivo: 0, receitaRecorrentes: 0,
      receitaNovos: 0, tempoMedioEntreCompras: 0,
    };
  }

  const total = clientes.length;
  const recorrentes = clientes.filter(c => c.quantidade_compras > 1);
  const mais2 = clientes.filter(c => c.quantidade_compras > 2);
  const novos = clientes.filter(c => c.quantidade_compras <= 1);

  const somaValor = clientes.reduce((s, c) => s + c.valor_total_cliente, 0);
  const somaCompras = clientes.reduce((s, c) => s + c.quantidade_compras, 0);
  const receitaRecorrentes = recorrentes.reduce((s, c) => s + c.valor_total_cliente, 0);
  const receitaNovos = novos.reduce((s, c) => s + c.valor_total_cliente, 0);

  // Tempo médio entre compras (only clients with 2+ purchases)
  const comTempo = clientes.filter(c => c.tempo_entre_compras !== null && c.tempo_entre_compras > 0);
  const tempoMedio = comTempo.length > 0
    ? Math.round(comTempo.reduce((s, c) => s + c.tempo_entre_compras!, 0) / comTempo.length)
    : 0;

  return {
    ltvMedio: total > 0 ? somaValor / total : 0,
    receitaTotal: somaValor,
    ticketMedio: somaCompras > 0 ? somaValor / somaCompras : 0,
    taxaRecompra: total > 0 ? (recorrentes.length / total) * 100 : 0,
    clientesAtivos: total, // all clients with purchases are "active"
    clientesRecorrentes: recorrentes.length,
    totalClientes: total,
    clientesMais2Compras: mais2.length,
    receitaMediaAtivo: total > 0 ? somaValor / total : 0,
    receitaRecorrentes,
    receitaNovos,
    tempoMedioEntreCompras: tempoMedio,
  };
}
