import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  format = 'number',
  className,
}: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('pt-BR').format(val);
    }
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="h-4 w-4" />;
    }
    return trend > 0 ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );
  };

  const getTrendClass = () => {
    if (trend === undefined || trend === 0) {
      return 'text-muted-foreground';
    }
    return trend > 0 ? 'kpi-trend-positive' : 'kpi-trend-negative';
  };

  return (
    <div className={cn('kpi-card animate-scale-in', className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="kpi-label">{title}</span>
        {icon && (
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      
      <div className="kpi-value mb-2">{formatValue(value)}</div>
      
      <div className="flex items-center justify-between">
        {subtitle && (
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        )}
        
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1', getTrendClass())}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {Math.abs(trend).toFixed(1)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground ml-1">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
