import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Calendar, Users, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MetaProgressCompactProps {
  meta: {
    meta_faturamento_minimo?: number | null;
    meta_faturamento_satisfatorio?: number | null;
    meta_faturamento_excelente?: number | null;
    meta_conversao_minimo?: number | null;
    meta_conversao_satisfatorio?: number | null;
    meta_conversao_excelente?: number | null;
    meta_reunioes_minimo?: number | null;
    meta_reunioes_satisfatorio?: number | null;
    meta_reunioes_excelente?: number | null;
    meta_agendamentos_minimo?: number | null;
    meta_agendamentos_satisfatorio?: number | null;
    meta_agendamentos_excelente?: number | null;
  } | null;
  realizado: {
    faturamento?: number;
    conversao?: number;
    reunioes?: number;
    agendamentos?: number;
  };
}

type MetaLevel = 'abaixo' | 'minimo' | 'satisfatorio' | 'excelente';

const getLevel = (
  value: number,
  minimo: number | null | undefined,
  satisfatorio: number | null | undefined,
  excelente: number | null | undefined
): MetaLevel => {
  if (!minimo || !satisfatorio || !excelente) return 'abaixo';
  if (value >= excelente) return 'excelente';
  if (value >= satisfatorio) return 'satisfatorio';
  if (value >= minimo) return 'minimo';
  return 'abaixo';
};

const levelConfig: Record<MetaLevel, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  abaixo: { label: 'Abaixo', color: 'text-red-500', icon: XCircle },
  minimo: { label: 'Mínimo', color: 'text-yellow-500', icon: AlertCircle },
  satisfatorio: { label: 'Satisfatório', color: 'text-blue-500', icon: CheckCircle2 },
  excelente: { label: 'Excelente', color: 'text-emerald-500', icon: CheckCircle2 },
};

export function MetaProgressCompact({ meta, realizado }: MetaProgressCompactProps) {
  const progressData = useMemo(() => {
    if (!meta) return null;

    const formatCurrency = (value: number) => {
      if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
      return `R$ ${value.toFixed(0)}`;
    };

    const faturamentoLevel = getLevel(
      realizado.faturamento || 0,
      meta.meta_faturamento_minimo,
      meta.meta_faturamento_satisfatorio,
      meta.meta_faturamento_excelente
    );

    const conversaoLevel = getLevel(
      realizado.conversao || 0,
      meta.meta_conversao_minimo,
      meta.meta_conversao_satisfatorio,
      meta.meta_conversao_excelente
    );

    const reunioesProgress = meta.meta_reunioes_excelente 
      ? Math.min(100, ((realizado.reunioes || 0) / meta.meta_reunioes_excelente) * 100)
      : 0;

    const agendamentosProgress = meta.meta_agendamentos_excelente
      ? Math.min(100, ((realizado.agendamentos || 0) / meta.meta_agendamentos_excelente) * 100)
      : 0;

    return {
      faturamento: {
        value: formatCurrency(realizado.faturamento || 0),
        level: faturamentoLevel,
        config: levelConfig[faturamentoLevel],
      },
      conversao: {
        value: `${(realizado.conversao || 0).toFixed(1)}%`,
        level: conversaoLevel,
        config: levelConfig[conversaoLevel],
      },
      reunioes: {
        current: realizado.reunioes || 0,
        target: meta.meta_reunioes_excelente || 0,
        progress: reunioesProgress,
      },
      agendamentos: {
        current: realizado.agendamentos || 0,
        target: meta.meta_agendamentos_excelente || 0,
        progress: agendamentosProgress,
      },
    };
  }, [meta, realizado]);

  if (!meta || !progressData) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Meta x Realizado
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-3">
          <p className="text-xs text-muted-foreground">Sem meta definida</p>
        </CardContent>
      </Card>
    );
  }

  const FaturamentoIcon = progressData.faturamento.config.icon;
  const ConversaoIcon = progressData.conversao.config.icon;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="py-2 px-3 pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" />
          Meta x Realizado
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3 pt-0 space-y-2">
        {/* Faturamento */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>Faturamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold">{progressData.faturamento.value}</span>
            <FaturamentoIcon className={`h-3.5 w-3.5 ${progressData.faturamento.config.color}`} />
          </div>
        </div>

        {/* Conversão */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>Conversão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold">{progressData.conversao.value}</span>
            <ConversaoIcon className={`h-3.5 w-3.5 ${progressData.conversao.config.color}`} />
          </div>
        </div>

        {/* Reuniões */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Reuniões</span>
            </div>
            <span className="text-xs font-medium">
              {progressData.reunioes.current}/{progressData.reunioes.target}
            </span>
          </div>
          <Progress value={progressData.reunioes.progress} className="h-1" />
        </div>

        {/* Agendamentos */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Agendamentos</span>
            </div>
            <span className="text-xs font-medium">
              {progressData.agendamentos.current}/{progressData.agendamentos.target}
            </span>
          </div>
          <Progress value={progressData.agendamentos.progress} className="h-1" />
        </div>
      </CardContent>
    </Card>
  );
}
