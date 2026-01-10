import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Meta {
  id: string;
  tipo: 'global' | 'sdr' | 'especialista';
  responsavel: string | null;
  mes: number;
  ano: number;
  // Legacy fields (kept for compatibility)
  meta_faturamento: number;
  meta_vendas: number;
  meta_reunioes: number;
  meta_agendamentos: number;
  // New 3-level fields for global metas
  meta_faturamento_minimo: number;
  meta_faturamento_satisfatorio: number;
  meta_faturamento_excelente: number;
  meta_conversao_minimo: number;
  meta_conversao_satisfatorio: number;
  meta_conversao_excelente: number;
  // New 3-level fields for individual metas
  meta_reunioes_minimo: number;
  meta_reunioes_satisfatorio: number;
  meta_reunioes_excelente: number;
  meta_agendamentos_minimo: number;
  meta_agendamentos_satisfatorio: number;
  meta_agendamentos_excelente: number;
  created_at: string;
  updated_at: string;
}

export interface MetaInput {
  tipo: 'global' | 'sdr' | 'especialista';
  responsavel?: string | null;
  mes: number;
  ano: number;
  // Legacy fields
  meta_faturamento?: number;
  meta_vendas?: number;
  meta_reunioes?: number;
  meta_agendamentos?: number;
  // 3-level fields
  meta_faturamento_minimo?: number;
  meta_faturamento_satisfatorio?: number;
  meta_faturamento_excelente?: number;
  meta_conversao_minimo?: number;
  meta_conversao_satisfatorio?: number;
  meta_conversao_excelente?: number;
  meta_reunioes_minimo?: number;
  meta_reunioes_satisfatorio?: number;
  meta_reunioes_excelente?: number;
  meta_agendamentos_minimo?: number;
  meta_agendamentos_satisfatorio?: number;
  meta_agendamentos_excelente?: number;
}

export function useMetas(mes?: number, ano?: number) {
  return useQuery({
    queryKey: ['metas', mes, ano],
    queryFn: async () => {
      let query = supabase
        .from('metas')
        .select('*')
        .order('tipo', { ascending: true })
        .order('responsavel', { ascending: true });

      if (mes !== undefined) {
        query = query.eq('mes', mes);
      }
      if (ano !== undefined) {
        query = query.eq('ano', ano);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Meta[];
    },
  });
}

export function useMetaGlobal(mes: number, ano: number) {
  return useQuery({
    queryKey: ['metas', 'global', mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('tipo', 'global')
        .eq('mes', mes)
        .eq('ano', ano)
        .maybeSingle();

      if (error) throw error;
      return data as Meta | null;
    },
  });
}

export function useUpsertMeta() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (meta: MetaInput) => {
      // Try to find existing meta
      let query = supabase
        .from('metas')
        .select('id')
        .eq('tipo', meta.tipo)
        .eq('mes', meta.mes)
        .eq('ano', meta.ano);

      // Handle null responsavel correctly
      if (meta.responsavel) {
        query = query.eq('responsavel', meta.responsavel);
      } else {
        query = query.is('responsavel', null);
      }

      const { data: existing } = await query.maybeSingle();

      const metaData = {
        meta_faturamento: meta.meta_faturamento || 0,
        meta_vendas: meta.meta_vendas || 0,
        meta_reunioes: meta.meta_reunioes || 0,
        meta_agendamentos: meta.meta_agendamentos || 0,
        meta_faturamento_minimo: meta.meta_faturamento_minimo || 0,
        meta_faturamento_satisfatorio: meta.meta_faturamento_satisfatorio || 0,
        meta_faturamento_excelente: meta.meta_faturamento_excelente || 0,
        meta_conversao_minimo: meta.meta_conversao_minimo || 0,
        meta_conversao_satisfatorio: meta.meta_conversao_satisfatorio || 0,
        meta_conversao_excelente: meta.meta_conversao_excelente || 0,
        meta_reunioes_minimo: meta.meta_reunioes_minimo || 0,
        meta_reunioes_satisfatorio: meta.meta_reunioes_satisfatorio || 0,
        meta_reunioes_excelente: meta.meta_reunioes_excelente || 0,
        meta_agendamentos_minimo: meta.meta_agendamentos_minimo || 0,
        meta_agendamentos_satisfatorio: meta.meta_agendamentos_satisfatorio || 0,
        meta_agendamentos_excelente: meta.meta_agendamentos_excelente || 0,
      };

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('metas')
          .update(metaData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('metas')
          .insert({
            tipo: meta.tipo,
            responsavel: meta.responsavel || null,
            mes: meta.mes,
            ano: meta.ano,
            ...metaData,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas'] });
      toast({
        title: 'Meta salva!',
        description: 'A meta foi atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar meta',
        description: error.message,
      });
    },
  });
}

export function useDeleteMeta() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas'] });
      toast({
        title: 'Meta excluída',
        description: 'A meta foi removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir meta',
        description: error.message,
      });
    },
  });
}
