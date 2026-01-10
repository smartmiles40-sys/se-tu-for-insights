import { useMemo } from 'react';
import { Meta } from '@/hooks/useMetas';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface MetaProgressProps {
  meta: Meta | null | undefined;
  realizado: {
    faturamento: number;
    vendas: number; // This is now the conversion rate percentage
    reunioes: number;
    agendamentos: number;
  };
  compact?: boolean;
}

type MetaLevel = 'abaixo' | 'minimo' | 'satisfatorio' | 'excelente';

function getLevel(value: number, minimo: number, satisfatorio: number, excelente: number): MetaLevel {
  if (excelente > 0 && value >= excelente) return 'excelente';
  if (satisfatorio > 0 && value >= satisfatorio) return 'satisfatorio';
  if (minimo > 0 && value >= minimo) return 'minimo';
  return 'abaixo';
}

const levelConfig: Record<MetaLevel, { label: string; color: string; bgColor: string; icon: string }> = {
  abaixo: { label: 'Abaixo do Mínimo', color: 'text-red-400', bgColor: 'bg-red-500', icon: '✗' },
  minimo: { label: 'Mínimo', color: 'text-orange-400', bgColor: 'bg-orange-500', icon: '○' },
  satisfatorio: { label: 'Satisfatório', color: 'text-yellow-400', bgColor: 'bg-yellow-500', icon: '◐' },
  excelente: { label: 'Excelente', color: 'text-green-400', bgColor: 'bg-green-500', icon: '✓' },
};

export function MetaProgress({ meta, realizado, compact = false }: MetaProgressProps) {
  const progressData = useMemo(() => {
    if (!meta) return null;

    const formatCurrency = (v: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v);
    const formatPercent = (v: number) => `${v.toFixed(1)}%`;
    const formatNumber = (v: number) => v.toString();

    // Faturamento - 3 levels
    const faturamentoLevel = getLevel(
      realizado.faturamento,
      meta.meta_faturamento_minimo || 0,
      meta.meta_faturamento_satisfatorio || 0,
      meta.meta_faturamento_excelente || 0
    );

    // Conversão - 3 levels
    const conversaoLevel = getLevel(
      realizado.vendas,
      meta.meta_conversao_minimo || 0,
      meta.meta_conversao_satisfatorio || 0,
      meta.meta_conversao_excelente || 0
    );

    // Reuniões - single target (using legacy field)
    const reunioesTarget = meta.meta_reunioes || 0;
    const reunioesProgress = reunioesTarget > 0 ? Math.min((realizado.reunioes / reunioesTarget) * 100, 100) : 0;

    // Agendamentos - single target (using legacy field)
    const agendamentosTarget = meta.meta_agendamentos || 0;
    const agendamentosProgress = agendamentosTarget > 0 ? Math.min((realizado.agendamentos / agendamentosTarget) * 100, 100) : 0;

    return [
      {
        label: 'Faturamento',
        icon: DollarSign,
        atual: realizado.faturamento,
        format: formatCurrency,
        level: faturamentoLevel,
        is3Level: true,
        metas: {
          minimo: meta.meta_faturamento_minimo || 0,
          satisfatorio: meta.meta_faturamento_satisfatorio || 0,
          excelente: meta.meta_faturamento_excelente || 0,
        },
      },
      {
        label: 'Conversão de Vendas',
        icon: TrendingUp,
        atual: realizado.vendas,
        format: formatPercent,
        level: conversaoLevel,
        is3Level: true,
        metas: {
          minimo: meta.meta_conversao_minimo || 0,
          satisfatorio: meta.meta_conversao_satisfatorio || 0,
          excelente: meta.meta_conversao_excelente || 0,
        },
        isPercent: true,
      },
      {
        label: 'Reuniões',
        icon: Calendar,
        atual: realizado.reunioes,
        meta: reunioesTarget,
        progress: reunioesProgress,
        format: formatNumber,
        is3Level: false,
        color: 'purple',
      },
      {
        label: 'Agendamentos',
        icon: Target,
        atual: realizado.agendamentos,
        meta: agendamentosTarget,
        progress: agendamentosProgress,
        format: formatNumber,
        is3Level: false,
        color: 'yellow',
      },
    ];
  }, [meta, realizado]);

  if (!meta || !progressData) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        Nenhuma meta definida para este período
      </div>
    );
  }

  const colorClasses: Record<string, { bg: string; progress: string; text: string }> = {
    purple: { bg: 'bg-purple-500/20', progress: 'bg-purple-500', text: 'text-purple-400' },
    yellow: { bg: 'bg-yellow-500/20', progress: 'bg-yellow-500', text: 'text-yellow-400' },
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {progressData.map((item) => {
          if (item.is3Level) {
            const config = levelConfig[item.level!];
            return (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className={cn('h-3.5 w-3.5', config.color)} />
                <div className="flex-1">
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-700">
                    <div
                      className={cn('h-full rounded-full transition-all', config.bgColor)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <span className={cn('text-xs font-medium', config.color)}>
                  {config.icon}
                </span>
              </div>
            );
          } else {
            const color = colorClasses[item.color!];
            return (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className={cn('h-3.5 w-3.5', color.text)} />
                <div className="flex-1">
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-700">
                    <div
                      className={cn('h-full rounded-full transition-all', color.progress)}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium tabular-nums">
                  {item.progress?.toFixed(0)}%
                </span>
              </div>
            );
          }
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {progressData.map((item) => {
        if (item.is3Level) {
          const config = levelConfig[item.level!];
          const formatMeta = item.isPercent 
            ? (v: number) => `${v}%` 
            : (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v);
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className={cn('h-4 w-4', config.color)} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-bold', config.color)}>
                    {item.format(item.atual)}
                  </span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', config.bgColor, 'text-white')}>
                    {config.label}
                  </span>
                </div>
              </div>
              
              {/* 3-level progress indicator */}
              <div className="flex gap-1 h-2">
                <div className={cn(
                  'flex-1 rounded-l-full transition-all',
                  item.level === 'abaixo' ? 'bg-red-500' : 'bg-slate-600'
                )} />
                <div className={cn(
                  'flex-1 transition-all',
                  item.level === 'minimo' ? 'bg-orange-500' : 
                  item.level === 'satisfatorio' || item.level === 'excelente' ? 'bg-orange-500/50' : 'bg-slate-600'
                )} />
                <div className={cn(
                  'flex-1 transition-all',
                  item.level === 'satisfatorio' ? 'bg-yellow-500' : 
                  item.level === 'excelente' ? 'bg-yellow-500/50' : 'bg-slate-600'
                )} />
                <div className={cn(
                  'flex-1 rounded-r-full transition-all',
                  item.level === 'excelente' ? 'bg-green-500' : 'bg-slate-600'
                )} />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-red-400">Min: {formatMeta(item.metas!.minimo)}</span>
                <span className="text-yellow-400">Sat: {formatMeta(item.metas!.satisfatorio)}</span>
                <span className="text-green-400">Exc: {formatMeta(item.metas!.excelente)}</span>
              </div>
            </div>
          );
        } else {
          const color = colorClasses[item.color!];
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className={cn('h-4 w-4', color.text)} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-sm">
                  <span className={color.text}>{item.format(item.atual)}</span>
                  <span className="text-muted-foreground"> / {item.format(item.meta!)}</span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-slate-700">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    color.progress,
                    item.progress! >= 100 && 'animate-pulse'
                  )}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.progress?.toFixed(1)}% atingido</span>
                {item.progress! < 100 && item.meta! > 0 && (
                  <span>Falta: {item.format(item.meta! - item.atual)}</span>
                )}
                {item.progress! >= 100 && (
                  <span className="text-green-400">✓ Meta atingida!</span>
                )}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}
