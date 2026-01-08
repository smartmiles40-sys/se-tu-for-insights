import { DollarSign, Target, Calendar, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutiveKPIsProps {
  stats: {
    receitaTotal: number;
    vendasRealizadas: number;
    reunioesRealizadas: number;
    taxaAgendamento: number;
    taxaNoShow: number;
    taxaShowUp: number;
    totalLeads: number;
  };
}

interface KPIBigCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

function KPIBigCard({ title, value, icon, variant = 'default', subtitle }: KPIBigCardProps) {
  const variants = {
    default: 'border-border/50',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-destructive/30 bg-destructive/5',
  };

  return (
    <div className={cn(
      'bg-card rounded-xl p-8 shadow-sm border transition-all hover:shadow-md',
      variants[variant]
    )}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 bg-primary/10 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-4xl font-display font-bold text-foreground mb-1">
        {value}
      </div>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

export function ExecutiveKPIs({ stats }: ExecutiveKPIsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Determina variante baseado em performance
  const getNoShowVariant = (taxa: number): 'success' | 'warning' | 'danger' => {
    if (taxa <= 15) return 'success';
    if (taxa <= 25) return 'warning';
    return 'danger';
  };

  const getShowUpVariant = (taxa: number): 'success' | 'warning' | 'danger' => {
    if (taxa >= 75) return 'success';
    if (taxa >= 60) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      {/* Linha 1: Métricas de Resultado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIBigCard
          title="Faturamento Total"
          value={formatCurrency(stats.receitaTotal)}
          icon={<DollarSign className="h-6 w-6 text-success" />}
          variant="success"
        />
        <KPIBigCard
          title="Vendas Realizadas"
          value={formatNumber(stats.vendasRealizadas)}
          icon={<Target className="h-6 w-6 text-primary" />}
        />
        <KPIBigCard
          title="Reuniões Realizadas"
          value={formatNumber(stats.reunioesRealizadas)}
          icon={<Calendar className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Linha 2: Taxas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIBigCard
          title="Taxa de Agendamento"
          value={formatPercent(stats.taxaAgendamento)}
          subtitle={`${formatNumber(stats.totalLeads)} leads`}
          icon={<TrendingUp className="h-6 w-6 text-primary" />}
        />
        <KPIBigCard
          title="Taxa de No-Show"
          value={formatPercent(stats.taxaNoShow)}
          icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
          variant={getNoShowVariant(stats.taxaNoShow)}
        />
        <KPIBigCard
          title="Taxa de Show-Up"
          value={formatPercent(stats.taxaShowUp)}
          icon={<Users className="h-6 w-6 text-success" />}
          variant={getShowUpVariant(stats.taxaShowUp)}
        />
      </div>
    </div>
  );
}
