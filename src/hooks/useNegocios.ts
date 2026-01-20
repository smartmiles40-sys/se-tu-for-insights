import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Negocio {
  id: string;
  crm_id: string | null;
  nome: string | null;
  pipeline: string | null;
  fase: string | null;
  data_inicio: string | null;
  data_agendamento: string | null;
  data_reuniao_realizada: string | null;
  data_mql: string | null;
  data_sql: string | null;
  data_venda: string | null;
  data_noshow: string | null;
  data_prevista: string | null;
  primeiro_contato: string | null;
  data_movimentacao: string | null;
  vendedor: string | null;
  sdr: string | null;
  quem_vendeu: string | null;
  responsavel_reuniao: string | null;
  info_etapa: string | null;
  mql: boolean;
  sql_qualificado: boolean;
  reuniao_agendada: boolean;
  reuniao_realizada: boolean;
  no_show: boolean;
  venda_aprovada: boolean;
  total: number;
  custo: number;
  tipo_venda: string | null;
  motivo_perda: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  lead_fonte: string | null;
  contato_fonte: string | null;
  created_at: string;
  updated_at: string;
  imported_by: string | null;
}

export interface NegocioFilters {
  dataInicio?: string;
  dataFim?: string;
  sdr?: string;
  vendedores?: string[];
  pipeline?: string;
  utmSource?: string;
  leadFonte?: string;
  tiposVenda?: string[];
}

export function useNegocios(filters?: NegocioFilters) {
  return useQuery({
    queryKey: ['negocios', filters],
    queryFn: async () => {
      let query = supabase
        .from('negocios')
        .select('*')
        .order('data_inicio', { ascending: false });

      // Filter by date range - include records where ANY relevant date is in range:
      // - primeiro_contato (for leads count)
      // - data_venda (for sales/revenue)
      // - data_reuniao_realizada (for meetings)
      // - data_agendamento (for scheduled meetings)
      // - data_mql (for MQL)
      // - data_sql (for SQL)
      // This allows intelligent filtering per metric
      if (filters?.dataInicio && filters?.dataFim) {
        query = query.or(
          `primeiro_contato.gte.${filters.dataInicio},data_venda.gte.${filters.dataInicio},data_reuniao_realizada.gte.${filters.dataInicio},data_agendamento.gte.${filters.dataInicio},data_mql.gte.${filters.dataInicio},data_sql.gte.${filters.dataInicio}`
        );
        query = query.or(
          `primeiro_contato.lte.${filters.dataFim},data_venda.lte.${filters.dataFim},data_reuniao_realizada.lte.${filters.dataFim},data_agendamento.lte.${filters.dataFim},data_mql.lte.${filters.dataFim},data_sql.lte.${filters.dataFim}`
        );
      } else if (filters?.dataInicio) {
        query = query.or(
          `primeiro_contato.gte.${filters.dataInicio},data_venda.gte.${filters.dataInicio},data_reuniao_realizada.gte.${filters.dataInicio},data_agendamento.gte.${filters.dataInicio},data_mql.gte.${filters.dataInicio},data_sql.gte.${filters.dataInicio}`
        );
      } else if (filters?.dataFim) {
        query = query.or(
          `primeiro_contato.lte.${filters.dataFim},data_venda.lte.${filters.dataFim},data_reuniao_realizada.lte.${filters.dataFim},data_agendamento.lte.${filters.dataFim},data_mql.lte.${filters.dataFim},data_sql.lte.${filters.dataFim}`
        );
      }
      if (filters?.sdr) {
        // Filtra por nome normalizado (correspondência parcial no início)
        query = query.ilike('sdr', `${filters.sdr}%`);
      }
      // Filter by vendedores (multiple selection, based on responsavel_reuniao)
      if (filters?.vendedores && filters.vendedores.length > 0) {
        const orConditions = filters.vendedores
          .map(v => `responsavel_reuniao.ilike.%${v}%`)
          .join(',');
        query = query.or(orConditions);
      }
      if (filters?.pipeline) {
        query = query.eq('pipeline', filters.pipeline);
      }
      if (filters?.utmSource) {
        query = query.eq('utm_source', filters.utmSource);
      }
      if (filters?.leadFonte) {
        query = query.eq('lead_fonte', filters.leadFonte);
      }
    if (filters?.tiposVenda && filters.tiposVenda.length > 0) {
      query = query.in('tipo_venda', filters.tiposVenda);
    }

      const { data, error } = await query;

      if (error) throw error;
      return data as Negocio[];
    },
  });
}

export function useImportNegocios() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (negocios: Partial<Negocio>[]) => {
      console.log('Starting import of', negocios.length, 'negocios');
      
      // First, delete all existing negocios
      const { error: deleteError } = await supabase
        .from('negocios')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(`Erro ao limpar dados: ${deleteError.message}`);
      }
      
      console.log('Deleted existing negocios');

      // Then insert new data in batches
      const batchSize = 500;
      let insertedCount = 0;
      
      for (let i = 0; i < negocios.length; i += batchSize) {
        const batch = negocios.slice(i, i + batchSize);
        console.log(`Inserting batch ${i / batchSize + 1}, records ${i} to ${i + batch.length}`);
        
        const { error: insertError, data } = await supabase
          .from('negocios')
          .insert(batch)
          .select();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(`Erro ao inserir dados (lote ${i / batchSize + 1}): ${insertError.message}`);
        }
        
        insertedCount += batch.length;
        console.log(`Batch inserted successfully, total: ${insertedCount}`);
      }

      return negocios.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['negocios'] });
      toast({
        title: 'Importação concluída!',
        description: `${count} negócios importados com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro na importação',
        description: error.message,
      });
    },
  });
}

export function useNegociosStats(negocios: Negocio[] | undefined) {
  if (!negocios || negocios.length === 0) {
    return {
      totalNegocios: 0,
      reunioesAgendadas: 0,
      reunioesRealizadas: 0,
      taxaNoShow: 0,
      vendasRealizadas: 0,
      receitaTotal: 0,
      ticketMedio: 0,
      taxaConversao: 0,
      mql: 0,
      sql: 0,
    };
  }

  const totalNegocios = negocios.length;
  const reunioesAgendadas = negocios.filter(n => n.reuniao_agendada).length;
  const reunioesRealizadas = negocios.filter(n => n.reuniao_realizada).length;
  const noShows = negocios.filter(n => n.no_show).length;
  const taxaNoShow = reunioesAgendadas > 0 ? (noShows / reunioesAgendadas) * 100 : 0;
  
  const vendas = negocios.filter(n => n.venda_aprovada);
  const vendasRealizadas = vendas.length;
  const receitaTotal = vendas.reduce((sum, n) => sum + (n.total || 0), 0);
  const ticketMedio = vendasRealizadas > 0 ? receitaTotal / vendasRealizadas : 0;
  const taxaConversao = reunioesRealizadas > 0 ? (vendasRealizadas / reunioesRealizadas) * 100 : 0;
  
  const mql = negocios.filter(n => n.mql).length;
  const sql = negocios.filter(n => n.sql_qualificado).length;

  return {
    totalNegocios,
    reunioesAgendadas,
    reunioesRealizadas,
    taxaNoShow,
    vendasRealizadas,
    receitaTotal,
    ticketMedio,
    taxaConversao,
    mql,
    sql,
  };
}

// Normaliza nomes removendo sufixos como "- SDR", "- Especialista", "- Coordenador", etc.
function normalizeName(name: string | null): string | null {
  if (!name) return null;
  // Remove sufixos comuns como " - SDR", " - Especialista", " - Coordenador", etc.
  const normalized = name
    .replace(/\s*-\s*(SDR|Especialista|Vendedor|Consultor|Coordenador|Sales|Rep|Manager|Gerente)$/i, '')
    .trim();
  return normalized || null;
}

export function useFilterOptions(negocios: Negocio[] | undefined) {
  if (!negocios) {
    return {
      sdrs: [],
      vendedores: [],
      pipelines: [],
      utmSources: [],
      leadFontes: [],
      tiposVenda: [],
    };
  }

  const unique = (arr: (string | null)[]) => 
    [...new Set(arr.filter((v): v is string => v !== null && v !== ''))].sort();

  // Normaliza nomes de SDRs para evitar duplicações
  const normalizedSdrs = negocios.map(n => normalizeName(n.sdr));
  
  // Get unique vendedores from responsavel_reuniao (normalized, excluding "Não se aplica")
  const normalizedVendedores = negocios.map(n => normalizeName(n.responsavel_reuniao));
  const uniqueVendedores = [...new Set(normalizedVendedores)]
    .filter((v): v is string => v !== null && v.trim() !== '' && v.toLowerCase() !== 'não se aplica')
    .sort();

  return {
    sdrs: unique(normalizedSdrs),
    vendedores: uniqueVendedores,
    pipelines: unique(negocios.map(n => n.pipeline)),
    utmSources: unique(negocios.map(n => n.utm_source)),
    leadFontes: unique(negocios.map(n => n.lead_fonte)),
    tiposVenda: unique(negocios.map(n => n.tipo_venda)),
  };
}
