import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Meta } from '@/hooks/useMetas';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface MetaProgressProps {
  meta: Meta | null | undefined;
  realizado: {
    faturamento: number;
    vendas: number;
    reunioes: number;
    agendamentos: number;
  };
  compact?: boolean;
}

export function MetaProgress({ meta, realizado, compact = false }: MetaProgressProps) {
  const progressData = useMemo(() => {
    if (!meta) return null;

    const calcProgress = (atual: number, target: number) => {
      if (target === 0) return 0;
      return Math.min((atual / target) * 100, 100);
    };

    return [
      {
        label: 'Faturamento',
        icon: DollarSign,
        atual: realizado.faturamento,
        meta: meta.meta_faturamento,
        progress: calcProgress(realizado.faturamento, meta.meta_faturamento),
        format: (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v),
        color: 'cyan',
        isThreshold: false,
      },
      {
        label: 'Conversão de Vendas',
        icon: TrendingUp,
        atual: realizado.vendas,
        meta: meta.meta_vendas,
        progress: 100, // Always full bar, color indicates status
        format: (v: number) => `${v.toFixed(1)}%`,
        color: realizado.vendas >= (meta.meta_vendas || 0) ? 'green' : 'red',
        isThreshold: true, // This is a minimum threshold indicator
      },
      {
        label: 'Reuniões',
        icon: Calendar,
        atual: realizado.reunioes,
        meta: meta.meta_reunioes,
        progress: calcProgress(realizado.reunioes, meta.meta_reunioes),
        format: (v: number) => v.toString(),
        color: 'purple',
        isThreshold: false,
      },
      {
        label: 'Agendamentos',
        icon: Target,
        atual: realizado.agendamentos,
        meta: meta.meta_agendamentos,
        progress: calcProgress(realizado.agendamentos, meta.meta_agendamentos),
        format: (v: number) => v.toString(),
        color: 'yellow',
        isThreshold: false,
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
    cyan: { bg: 'bg-cyan-500/20', progress: 'bg-cyan-500', text: 'text-cyan-400' },
    green: { bg: 'bg-green-500/20', progress: 'bg-green-500', text: 'text-green-400' },
    purple: { bg: 'bg-purple-500/20', progress: 'bg-purple-500', text: 'text-purple-400' },
    yellow: { bg: 'bg-yellow-500/20', progress: 'bg-yellow-500', text: 'text-yellow-400' },
    red: { bg: 'bg-red-500/20', progress: 'bg-red-500', text: 'text-red-400' },
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {progressData.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <item.icon className={cn('h-3.5 w-3.5', colorClasses[item.color].text)} />
            <div className="flex-1">
              <div className="h-1.5 rounded-full overflow-hidden bg-slate-700">
                <div
                  className={cn('h-full rounded-full transition-all', colorClasses[item.color].progress)}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium tabular-nums">
              {item.progress.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {progressData.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <item.icon className={cn('h-4 w-4', colorClasses[item.color].text)} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <div className="text-sm">
              <span className={colorClasses[item.color].text}>{item.format(item.atual)}</span>
              <span className="text-muted-foreground"> / {item.format(item.meta)}</span>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-slate-700">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                colorClasses[item.color].progress,
                item.progress >= 100 && 'animate-pulse'
              )}
              style={{ width: `${item.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {item.isThreshold ? (
              <>
                <span className={item.atual >= item.meta ? 'text-green-400' : 'text-red-400'}>
                  {item.atual >= item.meta ? '✓ Acima da meta mínima' : '✗ Abaixo da meta mínima'}
                </span>
                <span>Mínimo: {item.format(item.meta)}</span>
              </>
            ) : (
              <>
                <span>{item.progress.toFixed(1)}% atingido</span>
                {item.progress < 100 && item.meta > 0 && (
                  <span>Falta: {item.format(item.meta - item.atual)}</span>
                )}
                {item.progress >= 100 && (
                  <span className="text-green-400">✓ Meta atingida!</span>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
