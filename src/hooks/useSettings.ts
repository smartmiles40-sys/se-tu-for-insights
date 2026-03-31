import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface AgencyIdentity {
  name: string;
  logo_url: string | null;
}

export interface Appearance {
  dark_mode: boolean;
  primary_color: string;
  secondary_color: string;
}

export interface Regionalization {
  timezone: string;
  language: string;
}

export interface AppSettings {
  agency_identity: AgencyIdentity;
  appearance: Appearance;
  regionalization: Regionalization;
}

const DEFAULT_SETTINGS: AppSettings = {
  agency_identity: { name: 'Se Tu For! Eu Vou', logo_url: null },
  appearance: { dark_mode: false, primary_color: '#c8f135', secondary_color: '#0d2b22' },
  regionalization: { timezone: 'America/Sao_Paulo', language: 'pt-BR' },
};

async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await (supabase as any).from('settings').select('key, value');
  if (error) throw error;

  const result = { ...DEFAULT_SETTINGS };
  data?.forEach((row: any) => {
    if (row.key === 'agency_identity') result.agency_identity = { ...DEFAULT_SETTINGS.agency_identity, ...(row.value as AgencyIdentity) };
    if (row.key === 'appearance') result.appearance = { ...DEFAULT_SETTINGS.appearance, ...(row.value as Appearance) };
    if (row.key === 'regionalization') result.regionalization = { ...DEFAULT_SETTINGS.regionalization, ...(row.value as Regionalization) };
  });
  return result;
}

async function upsertSetting(key: string, value: unknown) {
  const { error } = await (supabase as any)
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}

export function useSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    const channel = supabase
      .channel('realtime:settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['settings'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const saveIdentity = useMutation({
    mutationFn: (value: AgencyIdentity) => upsertSetting('agency_identity', value),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); toast({ title: 'Identidade salva!' }); },
    onError: () => { toast({ title: 'Erro ao salvar', variant: 'destructive' }); },
  });

  const saveAppearance = useMutation({
    mutationFn: (value: Appearance) => upsertSetting('appearance', value),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); toast({ title: 'Aparência salva!' }); },
    onError: () => { toast({ title: 'Erro ao salvar', variant: 'destructive' }); },
  });

  const saveRegionalization = useMutation({
    mutationFn: (value: Regionalization) => upsertSetting('regionalization', value),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); toast({ title: 'Regionalização salva!' }); },
    onError: () => { toast({ title: 'Erro ao salvar', variant: 'destructive' }); },
  });

  return { settings: settings ?? DEFAULT_SETTINGS, isLoading, saveIdentity, saveAppearance, saveRegionalization };
}
