import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function playBuzina() {
  try {
    const audio = new Audio('/sounds/buzina.m4a');
    audio.play().catch(err => console.warn('[Buzina] Não foi possível tocar:', err));
  } catch (e) {
    console.warn('[Buzina] Erro ao criar audio:', e);
  }
}

export function useRealtimeNegocios() {
  const queryClient = useQueryClient();
  const previousVendasRef = useRef<Set<string> | null>(null);

  // Initialize known sales on first load
  const initializeVendas = useCallback(async () => {
    if (previousVendasRef.current !== null) return;
    const { data } = await supabase
      .from('negocios')
      .select('id')
      .not('data_venda', 'is', null);
    previousVendasRef.current = new Set((data || []).map(n => n.id));
    console.log('[Buzina] Vendas iniciais:', previousVendasRef.current.size);
  }, []);

  useEffect(() => {
    initializeVendas();

    const channel = supabase
      .channel('realtime:negocios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'negocios' },
        (payload) => {
          console.log('[Realtime] negocios mudou:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['negocios'] });

          const newRecord = payload.new as any;
          if (!newRecord) return;

          // Detect new sale: record has data_venda and wasn't previously known
          if (newRecord.data_venda && previousVendasRef.current && !previousVendasRef.current.has(newRecord.id)) {
            console.log('[Buzina] 🎉 Nova venda detectada!', newRecord.nome || newRecord.id);
            playBuzina();
            previousVendasRef.current.add(newRecord.id);
          }

          // Track if a sale was added via UPDATE
          if (payload.eventType === 'UPDATE' && newRecord.data_venda) {
            const oldRecord = payload.old as any;
            if (!oldRecord?.data_venda && previousVendasRef.current) {
              console.log('[Buzina] 🎉 Venda registrada via update!', newRecord.nome || newRecord.id);
              playBuzina();
              previousVendasRef.current.add(newRecord.id);
            }
          }
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
  }, [queryClient, initializeVendas]);
}
