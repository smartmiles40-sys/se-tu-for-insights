import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface KPICardWithSparklineProps {
  title: string;
  value: string;
  previousValue?: string;
  trend?: number;
  icon?: LucideIcon;
  color?: 'cyan' | 'yellow' | 'magenta' | 'green' | 'red' | 'orange';
  sparklineData?: number[];
  className?: string;
  compact?: boolean;
}

const colorClasses = {
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
    stroke: '#22d3ee',
    fill: 'rgba(34, 211, 238, 0.2)',
  },
  yellow: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    stroke: '#facc15',
    fill: 'rgba(250, 204, 21, 0.2)',
  },
  magenta: {
    text: 'text-pink-400',
    bg: 'bg-pink-500/20',
    border: 'border-pink-500/30',
    stroke: '#f472b6',
    fill: 'rgba(244, 114, 182, 0.2)',
  },
  green: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    stroke: '#34d399',
    fill: 'rgba(52, 211, 153, 0.2)',
  },
  red: {
    text: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    stroke: '#f87171',
    fill: 'rgba(248, 113, 113, 0.2)',
  },
  orange: {
    text: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    stroke: '#fb923c',
    fill: 'rgba(251, 146, 60, 0.2)',
  },
};

export function KPICardWithSparkline({
  title,
  value,
  previousValue,
  trend,
  icon: Icon,
  color = 'cyan',
  sparklineData,
  className,
  compact = false,
}: KPICardWithSparklineProps) {
  const colors = colorClasses[color];
  
  const chartData = useMemo(() => {
    if (!sparklineData || sparklineData.length === 0) return null;
    return sparklineData.map((v, i) => ({ value: v, index: i }));
  }, [sparklineData]);

  const isPositiveTrend = trend !== undefined && trend >= 0;

  return (
    <div className={cn(
      'bi-card group',
      compact && 'p-2',
      className
    )}>
      <div className={cn("flex items-start justify-between", compact ? "mb-1" : "mb-3")}>
        <span className={cn(
          "font-medium text-slate-400 uppercase tracking-wider",
          compact ? "text-[10px]" : "text-xs"
        )}>
          {title}
        </span>
        {Icon && (
          <div className={cn('rounded-md', colors.bg, compact ? 'p-1' : 'p-1.5')}>
            <Icon className={cn(colors.text, compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')} />
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className={cn(
            'font-bold tracking-tight',
            colors.text,
            compact ? 'text-lg' : 'text-2xl'
          )}>
            {value}
          </div>
          {previousValue && !compact && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-slate-500">PY {previousValue}</span>
              {trend !== undefined && (
                <span className={cn(
                  'flex items-center text-xs font-medium',
                  isPositiveTrend ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {isPositiveTrend ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {Math.abs(trend).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
        
        {chartData && !compact && (
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={colors.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={colors.stroke}
                  strokeWidth={1.5}
                  fill={`url(#gradient-${color})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
