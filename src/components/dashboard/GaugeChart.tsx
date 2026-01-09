import { cn } from '@/lib/utils';

interface GaugeChartProps {
  value: number;
  ideal: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showIdeal?: boolean;
}

export function GaugeChart({ 
  value, 
  ideal, 
  label, 
  size = 'md',
  showIdeal = true 
}: GaugeChartProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const percentage = (clampedValue / 100);
  
  // Determine status based on ideal comparison
  const isAboveIdeal = value >= ideal;
  const ratio = value / ideal;
  
  let status: 'good' | 'warning' | 'critical';
  if (ratio >= 1) {
    status = 'good';
  } else if (ratio >= 0.7) {
    status = 'warning';
  } else {
    status = 'critical';
  }

  const statusColors = {
    good: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    critical: 'hsl(var(--destructive))',
  };

  const sizes = {
    sm: { width: 100, height: 60, strokeWidth: 8, fontSize: 'text-lg' },
    md: { width: 140, height: 80, strokeWidth: 10, fontSize: 'text-2xl' },
    lg: { width: 180, height: 100, strokeWidth: 12, fontSize: 'text-3xl' },
  };

  const { width, height, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width, height: height + 10 }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="transform -rotate-0"
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${height - 5} A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${height - 5}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Value arc */}
          <path
            d={`M ${strokeWidth / 2} ${height - 5} A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${height - 5}`}
            fill="none"
            stroke={statusColors[status]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Ideal marker */}
          {showIdeal && (
            <circle
              cx={strokeWidth / 2 + (radius * 2) * (ideal / 100)}
              cy={height - 5 - Math.sin(Math.PI * (ideal / 100)) * radius}
              r={4}
              fill="hsl(var(--foreground))"
              className="opacity-50"
            />
          )}
        </svg>
        
        {/* Value display */}
        <div className="absolute inset-0 flex items-end justify-center pb-0">
          <span className={cn(
            'font-display font-bold',
            fontSize,
            status === 'good' && 'text-success',
            status === 'warning' && 'text-warning',
            status === 'critical' && 'text-destructive'
          )}>
            {value.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        {showIdeal && (
          <p className="text-xs text-muted-foreground/70">Meta: ≥{ideal}%</p>
        )}
      </div>
    </div>
  );
}