import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NOCKPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
  idealValue?: string;
  className?: string;
}

export function NOCKPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  status = 'neutral',
  idealValue,
  className 
}: NOCKPICardProps) {
  const borderColors = {
    good: 'border-l-success',
    warning: 'border-l-warning',
    critical: 'border-l-destructive',
    neutral: 'border-l-primary',
  };

  const valueColors = {
    good: 'text-success',
    warning: 'text-warning',
    critical: 'text-destructive',
    neutral: 'text-foreground',
  };

  const iconBgColors = {
    good: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    critical: 'bg-destructive/10 text-destructive',
    neutral: 'bg-primary/10 text-primary',
  };

  return (
    <div className={cn(
      'relative bg-card rounded-xl border border-border/50 p-5 transition-all duration-200 hover:shadow-lg',
      'border-l-4',
      borderColors[status],
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
          {title}
        </span>
        {Icon && (
          <div className={cn(
            'p-2 rounded-lg',
            iconBgColors[status]
          )}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      
      <div className={cn(
        'text-4xl font-bold tracking-tight mb-1',
        valueColors[status]
      )}>
        {value}
      </div>
      
      {idealValue && (
        <div className="text-xs text-muted-foreground mt-2">
          Meta: {idealValue}
        </div>
      )}
      
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
