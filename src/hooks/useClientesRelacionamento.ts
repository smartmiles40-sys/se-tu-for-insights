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

  // Map DB fields to component interface
  const clientes: ClienteRelacionamento[] = (data || []).map(c => {
    let tempoEntreCompras: number | null = null;
    if (c.quantidade_viagens > 1 && c.data_primeira_viagem && c.data_ultima_viagem) {
      const diffMs = new Date(c.data_ultima_viagem).getTime() - new Date(c.data_primeira_viagem).getTime();
      tempoEntreCompras = Math.round(diffMs / (1000 * 60 * 60 * 24));
    }
    return {
      nome_cliente: c.nome_cliente,
      valor_total_cliente: c.valor_total_cliente,
      quantidade_compras: c.quantidade_viagens,
      data_primeira_compra: c.data_primeira_viagem,
      data_ultima_compra: c.data_ultima_viagem,
      ticket_medio: c.quantidade_viagens > 0 ? c.valor_total_cliente / c.quantidade_viagens : 0,
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
