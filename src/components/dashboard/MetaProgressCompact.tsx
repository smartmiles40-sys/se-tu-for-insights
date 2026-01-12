import { useMemo } from 'react';

interface MetaProgressCompactProps {
  meta: {
    meta_faturamento_minimo?: number | null;
    meta_faturamento_satisfatorio?: number | null;
    meta_faturamento_excelente?: number | null;
  } | null;
  realizado: {
    faturamento?: number;
  };
}

export function MetaProgressCompact({ meta, realizado }: MetaProgressCompactProps) {
  const data = useMemo(() => {
    const faturamento = realizado.faturamento || 0;
    const metaExcelente = meta?.meta_faturamento_excelente || 0;
    const progresso = metaExcelente > 0 ? (faturamento / metaExcelente) * 100 : 0;

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    return {
      realizado: formatCurrency(faturamento),
      metaExcelente: formatCurrency(metaExcelente),
      progresso: `${progresso.toFixed(1)}%`,
      progressoNum: progresso,
    };
  }, [meta, realizado]);

  if (!meta) {
    return null;
  }

  // Color based on progress
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-emerald-400';
    if (progress >= 75) return 'text-blue-400';
    if (progress >= 50) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex flex-col items-start">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Realizado</span>
        <span className="text-base font-bold text-cyan-400">{data.realizado}</span>
      </div>
      
      <div className="flex flex-col items-start">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
          <span className="text-emerald-400">◉</span> Meta Excelente
        </span>
        <span className="text-base font-bold text-emerald-400">{data.metaExcelente}</span>
      </div>
      
      <div className="flex flex-col items-start">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Progresso</span>
        <span className={`text-base font-bold ${getProgressColor(data.progressoNum)}`}>{data.progresso}</span>
      </div>
    </div>
  );
}
