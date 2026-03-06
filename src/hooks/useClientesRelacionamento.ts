import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClienteRelacionamento {
  nome_cliente: string;
  valor_total_cliente: number;
  quantidade_compras: number;
  data_primeira_compra: string | null;
  data_ultima_compra: string | null;
  ticket_medio: number;
  tempo_entre_compras: number | null;
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
  const { data, isLoading } = useQuery({
    queryKey: ['clientes_relacionamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes_relacionamento')
        .select('*')
        .order('valor_total_cliente', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Array<{
        nome_cliente: string;
        valor_total_cliente: number;
        quantidade_viagens: number;
        data_primeira_viagem: string | null;
        data_ultima_viagem: string | null;
        status: string;
        segmento: string | null;
      }>;
    },
  });

  // Aggregate by nome_cliente: sum valor, count rows, derive ticket médio
  const aggregated = new Map<string, {
    valor_total: number;
    count: number;
    data_primeira: string | null;
    data_ultima: string | null;
  }>();

  (data || []).forEach(c => {
    const existing = aggregated.get(c.nome_cliente);
    if (existing) {
      existing.valor_total += c.valor_total_cliente;
      existing.count += 1;
      if (c.data_primeira_viagem && (!existing.data_primeira || c.data_primeira_viagem < existing.data_primeira)) {
        existing.data_primeira = c.data_primeira_viagem;
      }
      if (c.data_ultima_viagem && (!existing.data_ultima || c.data_ultima_viagem > existing.data_ultima)) {
        existing.data_ultima = c.data_ultima_viagem;
      }
    } else {
      aggregated.set(c.nome_cliente, {
        valor_total: c.valor_total_cliente,
        count: 1,
        data_primeira: c.data_primeira_viagem,
        data_ultima: c.data_ultima_viagem,
      });
    }
  });

  const clientes: ClienteRelacionamento[] = Array.from(aggregated.entries()).map(([nome, agg]) => {
    let tempoEntreCompras: number | null = null;
    if (agg.count > 1 && agg.data_primeira && agg.data_ultima) {
      const diffMs = new Date(agg.data_ultima).getTime() - new Date(agg.data_primeira).getTime();
      tempoEntreCompras = Math.round(diffMs / (1000 * 60 * 60 * 24));
    }
    return {
      nome_cliente: nome,
      valor_total_cliente: agg.valor_total,
      quantidade_compras: agg.count,
      data_primeira_compra: agg.data_primeira,
      data_ultima_compra: agg.data_ultima,
      ticket_medio: agg.count > 0 ? agg.valor_total / agg.count : 0,
      tempo_entre_compras: tempoEntreCompras,
    };
  });

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

  const comTempo = clientes.filter(c => c.tempo_entre_compras !== null && c.tempo_entre_compras > 0);
  const tempoMedio = comTempo.length > 0
    ? Math.round(comTempo.reduce((s, c) => s + c.tempo_entre_compras!, 0) / comTempo.length)
    : 0;

  return {
    ltvMedio: total > 0 ? somaValor / total : 0,
    receitaTotal: somaValor,
    ticketMedio: somaCompras > 0 ? somaValor / somaCompras : 0,
    taxaRecompra: total > 0 ? (recorrentes.length / total) * 100 : 0,
    clientesAtivos: total,
    clientesRecorrentes: recorrentes.length,
    totalClientes: total,
    clientesMais2Compras: mais2.length,
    receitaMediaAtivo: total > 0 ? somaValor / total : 0,
    receitaRecorrentes,
    receitaNovos,
    tempoMedioEntreCompras: tempoMedio,
  };
}
