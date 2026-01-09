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
  const statusClasses = {
    good: 'status-good',
    warning: 'status-warning',
    critical: 'status-critical pulse-alert',
    neutral: 'text-foreground',
  };

  const glowClasses = {
    good: 'glow-success',
    warning: 'glow-warning',
    critical: 'glow-critical',
    neutral: '',
  };

  const borderClasses = {
    good: 'border-success/50',
    warning: 'border-warning/50',
    critical: 'border-destructive/50',
    neutral: 'border-border/50',
  };

  return (
    <div className={cn(
      'kpi-card-noc relative',
      borderClasses[status],
      glowClasses[status],
      className
    )}>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <span className="kpi-label">{title}</span>
          {Icon && (
            <div className={cn(
              'p-2 rounded-lg bg-secondary/50',
              statusClasses[status]
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        
        <div className={cn('kpi-value-lg mb-1', statusClasses[status])}>
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
    </div>
  );
}