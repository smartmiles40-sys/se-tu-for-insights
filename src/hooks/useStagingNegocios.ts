import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StagingStatus = 'pendente' | 'aprovado' | 'rejeitado';

export interface StagingNegocio {
  id: string;
  batch_id: string;
  source: string;
  status: StagingStatus;
  notes: string | null;
  imported_at: string;
  nome: string | null;
  pipeline: string | null;
  contato_fonte: string | null;
  vendedor: string | null;
  sdr: string | null;
  data_inicio: string | null;
  mql: boolean;
  sql_qualificado: boolean;
  reuniao_agendada: boolean;
  reuniao_realizada: boolean;
  no_show: boolean;
  venda_aprovada: boolean;
  total: number;
  tipo_venda: string | null;
  motivo_perda: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  lead_fonte: string | null;
  created_at: string;
  updated_at: string;
  // New CRM fields
  crm_id: string | null;
  fase: string | null;
  custo: number;
  quem_vendeu: string | null;
  responsavel_reuniao: string | null;
  info_etapa: string | null;
  data_agendamento: string | null;
  data_reuniao_realizada: string | null;
  data_mql: string | null;
  data_sql: string | null;
  data_venda: string | null;
  data_noshow: string | null;
  data_prevista: string | null;
  primeiro_contato: string | null;
  data_movimentacao: string | null;
}

export interface StagingFilters {
  status?: StagingStatus;
  search?: string;
}

export function useStagingNegocios(filters?: StagingFilters) {
  return useQuery({
    queryKey: ['staging-negocios', filters],
    queryFn: async () => {
      let query = supabase
        .from('staging_negocios')
        .select('*')
        .order('imported_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`nome.ilike.%${filters.search}%,vendedor.ilike.%${filters.search}%,pipeline.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching staging negocios:', error);
        throw error;
      }

      return data as StagingNegocio[];
    },
  });
}

export function useStagingPendingCount() {
  return useQuery({
    queryKey: ['staging-negocios-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('staging_negocios')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      if (error) {
        console.error('Error fetching pending count:', error);
        return 0;
      }

      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useUpdateStagingNegocio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StagingNegocio> }) => {
      console.log('Updating staging record:', { id, updates });
      
      const { data, error } = await supabase
        .from('staging_negocios')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Update result:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Update successful:', data);
      queryClient.invalidateQueries({ queryKey: ['staging-negocios'] });
      toast.success('Registro atualizado!');
    },
    onError: (error) => {
      console.error('Error updating staging record:', error);
      toast.error('Erro ao atualizar registro');
    },
  });
}

export function useApproveStaging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // First, get the staging records
      const { data: stagingRecords, error: fetchError } = await supabase
        .from('staging_negocios')
        .select('*')
        .in('id', ids);

      if (fetchError) throw fetchError;
      if (!stagingRecords || stagingRecords.length === 0) {
        throw new Error('No records found');
      }

      // Prepare records for negocios table (remove staging-specific fields)
      const negociosRecords = stagingRecords.map(record => ({
        nome: record.nome,
        pipeline: record.pipeline,
        contato_fonte: record.contato_fonte,
        vendedor: record.vendedor,
        sdr: record.sdr,
        data_inicio: record.data_inicio,
        mql: record.mql,
        sql_qualificado: record.sql_qualificado,
        reuniao_agendada: record.reuniao_agendada,
        reuniao_realizada: record.reuniao_realizada,
        no_show: record.no_show,
        venda_aprovada: record.venda_aprovada,
        total: record.total,
        tipo_venda: record.tipo_venda,
        motivo_perda: record.motivo_perda,
        utm_source: record.utm_source,
        utm_medium: record.utm_medium,
        utm_campaign: record.utm_campaign,
        utm_content: record.utm_content,
        utm_term: record.utm_term,
        lead_fonte: record.lead_fonte,
        // New CRM fields
        crm_id: record.crm_id,
        fase: record.fase,
        custo: record.custo,
        quem_vendeu: record.quem_vendeu,
        responsavel_reuniao: record.responsavel_reuniao,
        info_etapa: record.info_etapa,
        data_agendamento: record.data_agendamento,
        data_reuniao_realizada: record.data_reuniao_realizada,
        data_mql: record.data_mql,
        data_sql: record.data_sql,
        data_venda: record.data_venda,
        data_noshow: record.data_noshow,
        data_prevista: record.data_prevista,
        primeiro_contato: record.primeiro_contato,
        data_movimentacao: record.data_movimentacao,
      }));

      // Insert into negocios
      const { error: insertError } = await supabase
        .from('negocios')
        .insert(negociosRecords);

      if (insertError) throw insertError;

      // Update staging status to approved
      const { error: updateError } = await supabase
        .from('staging_negocios')
        .update({ status: 'aprovado' })
        .in('id', ids);

      if (updateError) throw updateError;

      return stagingRecords.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['staging-negocios'] });
      queryClient.invalidateQueries({ queryKey: ['staging-negocios-count'] });
      queryClient.invalidateQueries({ queryKey: ['negocios'] });
      toast.success(`${count} registro(s) aprovado(s) com sucesso!`);
    },
    onError: (error) => {
      console.error('Error approving staging records:', error);
      toast.error('Erro ao aprovar registros');
    },
  });
}

export function useRejectStaging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('staging_negocios')
        .update({ status: 'rejeitado' })
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['staging-negocios'] });
      queryClient.invalidateQueries({ queryKey: ['staging-negocios-count'] });
      toast.success(`${count} registro(s) rejeitado(s)`);
    },
    onError: (error) => {
      console.error('Error rejecting staging records:', error);
      toast.error('Erro ao rejeitar registros');
    },
  });
}

export function useDeleteStaging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Process in smaller batches to avoid timeouts
      const batchSize = 50;
      let deleted = 0;
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase
          .from('staging_negocios')
          .delete()
          .in('id', batch);

        if (error) throw error;
        deleted += batch.length;
      }
      
      return deleted;
    },
    onSuccess: (count) => {
      // Batch invalidations together
      queryClient.invalidateQueries({ queryKey: ['staging-negocios'] });
      queryClient.invalidateQueries({ queryKey: ['staging-negocios-count'] });
      queryClient.invalidateQueries({ queryKey: ['negocios'] });
      toast.success(`${count} registro(s) excluído(s)`);
    },
    onError: (error) => {
      console.error('Error deleting staging records:', error);
      toast.error('Erro ao excluir registros');
    },
  });
}

// Interface for staging import data (subset of StagingNegocio for inserts)
export interface StagingNegocioInsert {
  nome?: string | null;
  pipeline?: string | null;
  contato_fonte?: string | null;
  vendedor?: string | null;
  sdr?: string | null;
  data_inicio?: string | null;
  mql?: boolean;
  sql_qualificado?: boolean;
  reuniao_agendada?: boolean;
  reuniao_realizada?: boolean;
  no_show?: boolean;
  venda_aprovada?: boolean;
  total?: number;
  custo?: number;
  tipo_venda?: string | null;
  motivo_perda?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  lead_fonte?: string | null;
  crm_id?: string | null;
  fase?: string | null;
  quem_vendeu?: string | null;
  responsavel_reuniao?: string | null;
  info_etapa?: string | null;
  data_agendamento?: string | null;
  data_reuniao_realizada?: string | null;
  data_mql?: string | null;
  data_sql?: string | null;
  data_venda?: string | null;
  data_noshow?: string | null;
  data_prevista?: string | null;
  primeiro_contato?: string | null;
  data_movimentacao?: string | null;
  source?: string;
  status?: StagingStatus;
}

export function useImportToStaging() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (records: StagingNegocioInsert[]) => {
      // Generate a batch_id for this import
      const batch_id = crypto.randomUUID();
      
      // Process records: separate by crm_id presence
      const recordsWithCrmId = records.filter(r => r.crm_id);
      const recordsWithoutCrmId = records.filter(r => !r.crm_id);
      
      let processed = 0;
      const batchSize = 100;

      // For records WITH crm_id, check if they exist and update/insert accordingly
      for (let i = 0; i < recordsWithCrmId.length; i += batchSize) {
        const batch = recordsWithCrmId.slice(i, i + batchSize);
        const crmIds = batch.map(r => r.crm_id!);
        
        // Get existing records
        const { data: existingRecords } = await supabase
          .from('staging_negocios')
          .select('id, crm_id')
          .in('crm_id', crmIds);
        
        const existingCrmIds = new Set(existingRecords?.map(r => r.crm_id) || []);
        
        // Split into updates and inserts
        const toUpdate = batch.filter(r => existingCrmIds.has(r.crm_id));
        const toInsert = batch.filter(r => !existingCrmIds.has(r.crm_id));
        
        // Update existing records
        for (const record of toUpdate) {
          const existingRecord = existingRecords?.find(r => r.crm_id === record.crm_id);
          if (existingRecord) {
            const { error } = await supabase
              .from('staging_negocios')
              .update({
                ...record,
                batch_id,
                source: 'import_arquivo',
                status: 'pendente' as StagingStatus,
              })
              .eq('id', existingRecord.id);
            
            if (error) {
              console.error('Error updating record:', error);
              throw error;
            }
            processed++;
          }
        }
        
        // Insert new records
        if (toInsert.length > 0) {
          const insertRecords = toInsert.map(record => ({
            ...record,
            batch_id,
            source: 'import_arquivo',
            status: 'pendente' as StagingStatus,
          }));
          
          const { error } = await supabase
            .from('staging_negocios')
            .insert(insertRecords);
          
          if (error) {
            console.error('Error inserting batch:', error);
            throw error;
          }
          processed += toInsert.length;
        }
      }

      // For records WITHOUT crm_id, just insert (no conflict possible)
      for (let i = 0; i < recordsWithoutCrmId.length; i += batchSize) {
        const batch = recordsWithoutCrmId.slice(i, i + batchSize);
        const insertRecords = batch.map(record => ({
          ...record,
          batch_id,
          source: 'import_arquivo',
          status: 'pendente' as StagingStatus,
        }));
        
        const { error } = await supabase
          .from('staging_negocios')
          .insert(insertRecords);

        if (error) {
          console.error('Error inserting batch:', error);
          throw error;
        }
        processed += batch.length;
      }

      return { count: processed, batch_id };
    },
    onSuccess: ({ count }) => {
      queryClient.invalidateQueries({ queryKey: ['staging-negocios'] });
      queryClient.invalidateQueries({ queryKey: ['staging-negocios-count'] });
      toast.success(`${count} registro(s) importados/atualizados para revisão!`);
    },
    onError: (error) => {
      console.error('Error importing to staging:', error);
      toast.error('Erro ao importar registros');
    },
  });
}
