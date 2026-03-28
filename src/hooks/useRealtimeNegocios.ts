import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeNegocios() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('realtime:negocios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'negocios' },
        (payload) => {
          console.log('[Realtime] negocios mudou:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['negocios'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Escutando tabela negocios ✓');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Erro ao conectar no canal negocios');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
