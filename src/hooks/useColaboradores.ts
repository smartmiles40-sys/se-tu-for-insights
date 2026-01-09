import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Colaborador {
  id: string;
  nome: string;
  tipo: 'sdr' | 'especialista';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ColaboradorInput {
  nome: string;
  tipo: 'sdr' | 'especialista';
  ativo?: boolean;
}

export function useColaboradores(tipo?: 'sdr' | 'especialista') {
  return useQuery({
    queryKey: ['colaboradores', tipo],
    queryFn: async () => {
      let query = supabase
        .from('colaboradores')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Colaborador[];
    },
  });
}

export function useAllColaboradores() {
  return useQuery({
    queryKey: ['colaboradores', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('tipo', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Colaborador[];
    },
  });
}

export function useCreateColaborador() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (colaborador: ColaboradorInput) => {
      const { data, error } = await supabase
        .from('colaboradores')
        .insert({
          nome: colaborador.nome,
          tipo: colaborador.tipo,
          ativo: colaborador.ativo ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast({
        title: 'Colaborador adicionado!',
        description: 'O colaborador foi cadastrado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar colaborador',
        description: error.message.includes('duplicate') 
          ? 'Já existe um colaborador com esse nome e tipo.' 
          : error.message,
      });
    },
  });
}

export function useUpdateColaborador() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Colaborador> & { id: string }) => {
      const { data, error } = await supabase
        .from('colaboradores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast({
        title: 'Colaborador atualizado!',
        description: 'As alterações foram salvas.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar colaborador',
        description: error.message,
      });
    },
  });
}

export function useDeleteColaborador() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast({
        title: 'Colaborador excluído',
        description: 'O colaborador foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir colaborador',
        description: error.message,
      });
    },
  });
}
