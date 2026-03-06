import { useMemo } from 'react';
import { useMetas, Meta } from '@/hooks/useMetas';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import { getCurrentMonthBrazil, getCurrentYearBrazil } from '@/lib/dateUtils';

type MetaLevel = 'abaixo' | 'minimo' | 'satisfatorio' | 'excelente';

function getLevel(value: number, minimo: number, satisfatorio: number, excelente: number): MetaLevel {
  if (excelente > 0 && value >= excelente) return 'excelente';
  if (satisfatorio > 0 && value >= satisfatorio) return 'satisfatorio';
  if (minimo > 0 && value >= minimo) return 'minimo';
  return 'abaixo';
}

const levelStyles: Record<MetaLevel, { label: string; dot: string; text: string }> = {
  abaixo: { label: 'Abaixo', dot: 'bg-red-500', text: 'text-red-400' },
  minimo: { label: 'Mínimo', dot: 'bg-orange-500', text: 'text-orange-400' },
  satisfatorio: { label: 'Satisfatório', dot: 'bg-yellow-500', text: 'text-yellow-400' },
  excelente: { label: 'Excelente', dot: 'bg-emerald-500', text: 'text-emerald-400' },
};

interface MetaItem {
  label: string;
  realizado: number;
  minimo: number;
  satisfatorio: number;
  excelente: number;
  format: (v: number) => string;
}

interface MetasTargetBarProps {
  tipo: 'sdr' | 'especialista';
  items: MetaItem[];
  mes?: number;
  ano?: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
const formatPercent = (v: number) => `${v.toFixed(1)}%`;
const formatNumber = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

export { formatCurrency, formatPercent, formatNumber };

export function MetasTargetBar({ tipo, items, mes, ano }: MetasTargetBarProps) {
  if (items.length === 0) return null;

  const hasAnyMeta = items.some(i => i.minimo > 0 || i.satisfatorio > 0 || i.excelente > 0);
  if (!hasAnyMeta) return null;

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Metas {tipo === 'sdr' ? 'SDRs' : 'Especialistas'}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          Período: {mes}/{ano}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {items.filter(i => i.minimo > 0 || i.satisfatorio > 0 || i.excelente > 0).map((item) => {
          const level = getLevel(item.realizado, item.minimo, item.satisfatorio, item.excelente);
          const style = levelStyles[level];

          return (
            <div key={item.label} className="p-3 bg-muted/30 rounded-lg border border-border/30 space-y-2">
              <div className="text-xs text-muted-foreground font-medium truncate">{item.label}</div>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="text-center">
                  <span className="text-[10px] text-red-400 block">Mínimo</span>
                  <span className="text-xs font-semibold text-red-400">{item.format(item.minimo)}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-yellow-400 block">Satisfatório</span>
                  <span className="text-xs font-semibold text-yellow-400">{item.format(item.satisfatorio)}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-emerald-400 block">Excelente</span>
                  <span className="text-xs font-semibold text-emerald-400">{item.format(item.excelente)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper hook to build meta items for SDR
export function useSDRMetaItems(meta: Meta | null | undefined, totais: {
  faturamentoGerado: number;
  comparecimento: number;
  agendamentosTotais: number;
  mql: number;
  totalLeads: number;
  reunioesRealizadas: number;
}): MetaItem[] {
  return useMemo(() => {
    if (!meta) return [];
    const comparecimentoPct = totais.agendamentosTotais > 0 ? (totais.comparecimento / totais.agendamentosTotais) * 100 : 0;
    const leadMqlPct = totais.totalLeads > 0 ? (totais.mql / totais.totalLeads) * 100 : 0;

    return [
      {
        label: 'Receita Originada',
        realizado: totais.faturamentoGerado,
        minimo: meta.meta_faturamento_minimo || 0,
        satisfatorio: meta.meta_faturamento_satisfatorio || 0,
        excelente: meta.meta_faturamento_excelente || 0,
        format: formatCurrency,
      },
      {
        label: 'Comparecimento (%)',
        realizado: comparecimentoPct,
        minimo: meta.meta_conversao_minimo || 0,
        satisfatorio: meta.meta_conversao_satisfatorio || 0,
        excelente: meta.meta_conversao_excelente || 0,
        format: formatPercent,
      },
      {
        label: 'Lead → MQL (%)',
        realizado: leadMqlPct,
        minimo: meta.meta_margem_minimo || 0,
        satisfatorio: meta.meta_margem_satisfatorio || 0,
        excelente: meta.meta_margem_excelente || 0,
        format: formatPercent,
      },
      {
        label: 'Reuniões Realizadas',
        realizado: totais.reunioesRealizadas,
        minimo: meta.meta_agendamentos_minimo || 0,
        satisfatorio: meta.meta_agendamentos_satisfatorio || 0,
        excelente: meta.meta_agendamentos_excelente || 0,
        format: formatNumber,
      },
    ];
  }, [meta, totais]);
}

// Helper hook to build meta items for Especialistas
export function useEspecialistaMetaItems(meta: Meta | null | undefined, totais: {
  faturamento: number;
  vendas: number;
  reunioesRealizadas: number;
  mql: number;
  numEspecialistas: number;
}): MetaItem[] {
  return useMemo(() => {
    if (!meta) return [];
    const mediaPorEsp = totais.numEspecialistas > 0 ? totais.faturamento / totais.numEspecialistas : 0;
    const mqlVendaPct = totais.mql > 0 ? (totais.vendas / totais.mql) * 100 : 0;

    return [
      {
        label: 'Média por Especialista',
        realizado: mediaPorEsp,
        minimo: meta.meta_media_closer_minimo || 0,
        satisfatorio: meta.meta_media_closer_satisfatorio || 0,
        excelente: meta.meta_media_closer_excelente || 0,
        format: formatCurrency,
      },
      {
        label: 'Conversão MQL→Venda (%)',
        realizado: mqlVendaPct,
        minimo: meta.meta_conversao_minimo || 0,
        satisfatorio: meta.meta_conversao_satisfatorio || 0,
        excelente: meta.meta_conversao_excelente || 0,
        format: formatPercent,
      },
    ];
  }, [meta, totais]);
}
