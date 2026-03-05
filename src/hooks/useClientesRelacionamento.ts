import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClienteRelacionamento {
  id: string;
  nome_cliente: string;
  valor_total_cliente: number;
  quantidade_viagens: number;
  data_primeira_viagem: string | null;
  data_ultima_viagem: string | null;
  status: string;
  segmento: string | null;
  created_at: string;
  updated_at: string;
  imported_by: string | null;
}

export interface ClienteRelacionamentoInsert {
  nome_cliente: string;
  valor_total_cliente?: number;
  quantidade_viagens?: number;
  data_primeira_viagem?: string | null;
  data_ultima_viagem?: string | null;
  status?: string;
  segmento?: string | null;
  imported_by?: string | null;
}

export function useClientesRelacionamento() {
  return useQuery({
    queryKey: ['clientes_relacionamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes_relacionamento' as any)
        .select('*')
        .order('valor_total_cliente', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ClienteRelacionamento[];
    },
  });
}

export function useImportClientesRelacionamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (records: ClienteRelacionamentoInsert[]) => {
      // Delete existing before import
      await supabase.from('clientes_relacionamento' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from('clientes_relacionamento' as any).insert(batch as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes_relacionamento'] });
    },
  });
}

export interface ClientesStats {
  ltvMedio: number;
  receitaAtivos: number;
  ticketMedio: number;
  taxaRecompra: number;
  clientesAtivos: number;
  clientesRecorrentes: number;
  totalClientes: number;
  clientesMais2Viagens: number;
  receitaMediaAtivo: number;
  receitaRecorrentes: number;
  receitaNovos: number;
}

export function useClientesStats(clientes: ClienteRelacionamento[] | undefined): ClientesStats {
  if (!clientes || clientes.length === 0) {
    return {
      ltvMedio: 0, receitaAtivos: 0, ticketMedio: 0, taxaRecompra: 0,
      clientesAtivos: 0, clientesRecorrentes: 0, totalClientes: 0,
      clientesMais2Viagens: 0, receitaMediaAtivo: 0, receitaRecorrentes: 0, receitaNovos: 0,
    };
  }

  const total = clientes.length;
  const ativos = clientes.filter(c => c.status === 'ativo');
  const recorrentes = clientes.filter(c => c.quantidade_viagens > 1);
  const mais2 = clientes.filter(c => c.quantidade_viagens > 2);
  const novos = clientes.filter(c => c.quantidade_viagens <= 1);

  const somaValor = clientes.reduce((s, c) => s + (c.valor_total_cliente || 0), 0);
  const somaViagens = clientes.reduce((s, c) => s + (c.quantidade_viagens || 0), 0);
  const receitaAtivos = ativos.reduce((s, c) => s + (c.valor_total_cliente || 0), 0);
  const receitaRecorrentes = recorrentes.reduce((s, c) => s + (c.valor_total_cliente || 0), 0);
  const receitaNovos = novos.reduce((s, c) => s + (c.valor_total_cliente || 0), 0);

  return {
    ltvMedio: total > 0 ? somaValor / total : 0,
    receitaAtivos,
    ticketMedio: somaViagens > 0 ? somaValor / somaViagens : 0,
    taxaRecompra: total > 0 ? (recorrentes.length / total) * 100 : 0,
    clientesAtivos: ativos.length,
    clientesRecorrentes: recorrentes.length,
    totalClientes: total,
    clientesMais2Viagens: mais2.length,
    receitaMediaAtivo: ativos.length > 0 ? receitaAtivos / ativos.length : 0,
    receitaRecorrentes,
    receitaNovos,
  };
}
