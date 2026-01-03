import { useMemo } from 'react';
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip, Cell } from 'recharts';
import { Negocio } from '@/hooks/useNegocios';

interface SalesFunnelProps {
  negocios: Negocio[];
}

const FUNNEL_COLORS = [
  'hsl(177, 63%, 10%)',  // Dark Teal
  'hsl(177, 45%, 20%)',  // Teal medium
  'hsl(177, 45%, 30%)',  // Teal light
  'hsl(120, 16%, 70%)',  // Light Green
  'hsl(76, 60%, 50%)',   // Lime darker
  'hsl(76, 76%, 65%)',   // Lime Green
];

export function SalesFunnel({ negocios }: SalesFunnelProps) {
  const funnelData = useMemo(() => {
    const total = negocios.length;
    const mql = negocios.filter(n => n.mql).length;
    const sql = negocios.filter(n => n.sql_qualificado).length;
    const agendadas = negocios.filter(n => n.reuniao_agendada).length;
    const realizadas = negocios.filter(n => n.reuniao_realizada).length;
    const vendas = negocios.filter(n => n.venda_aprovada).length;

    return [
      { name: 'Total Negócios', value: total, fill: FUNNEL_COLORS[0] },
      { name: 'MQL', value: mql, fill: FUNNEL_COLORS[1] },
      { name: 'SQL', value: sql, fill: FUNNEL_COLORS[2] },
      { name: 'Reuniões Agendadas', value: agendadas, fill: FUNNEL_COLORS[3] },
      { name: 'Reuniões Realizadas', value: realizadas, fill: FUNNEL_COLORS[4] },
      { name: 'Vendas', value: vendas, fill: FUNNEL_COLORS[5] },
    ];
  }, [negocios]);

  const conversions = useMemo(() => {
    const data = funnelData;
    return data.slice(1).map((item, index) => {
      const prev = data[index].value;
      const curr = item.value;
      const rate = prev > 0 ? ((curr / prev) * 100).toFixed(1) : '0';
      return { from: data[index].name, to: item.name, rate };
    });
  }, [funnelData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const index = funnelData.findIndex(d => d.name === data.name);
      const conversion = index > 0 ? conversions[index - 1] : null;
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-lg font-display text-primary">
            {new Intl.NumberFormat('pt-BR').format(data.value)}
          </p>
          {conversion && (
            <p className="text-sm text-muted-foreground mt-1">
              Taxa de conversão: <span className="text-accent font-medium">{conversion.rate}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-section">
      <h3 className="section-title">Funil Comercial</h3>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Funnel Chart */}
        <div className="lg:col-span-2 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip content={<CustomTooltip />} />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
              >
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  position="center"
                  fill="#fff"
                  stroke="none"
                  dataKey="value"
                  formatter={(value: number) => new Intl.NumberFormat('pt-BR').format(value)}
                  className="font-display font-bold text-lg"
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rates */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Taxas de Conversão</h4>
          
          {conversions.map((conv, index) => (
            <div
              key={index}
              className="p-3 bg-muted/30 rounded-lg border border-border/50"
            >
              <div className="text-sm text-muted-foreground mb-1">
                {conv.from} → {conv.to}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(parseFloat(conv.rate), 100)}%` }}
                  />
                </div>
                <span className="font-semibold text-foreground w-14 text-right">
                  {conv.rate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
