import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface OrigemPerformanceProps {
  negocios: Negocio[];
}

const COLORS = ['#22d3ee', '#facc15', '#f472b6', '#34d399', '#fb923c'];

export function OrigemPerformance({ negocios }: OrigemPerformanceProps) {
  const data = useMemo(() => {
    const origemMap: Record<string, { origem: string; leads: number; vendas: number; receita: number }> = {};
    
    negocios.forEach(n => {
      const origem = n.lead_fonte || n.utm_source || 'Direto';
      if (!origemMap[origem]) {
        origemMap[origem] = { origem, leads: 0, vendas: 0, receita: 0 };
      }
      origemMap[origem].leads += 1;
      if (n.venda_aprovada) {
        origemMap[origem].vendas += 1;
        origemMap[origem].receita += n.total || 0;
      }
    });

    return Object.values(origemMap)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 5)
      .map(o => ({
        ...o,
        conversao: o.leads > 0 ? (o.vendas / o.leads) * 100 : 0,
        nomeShort: o.origem.length > 12 ? o.origem.substring(0, 12) + '...' : o.origem,
      }));
  }, [negocios]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="bi-card">
      <h3 className="bi-card-title mb-4">Performance por Origem</h3>
      
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis 
              type="number" 
              hide 
            />
            <YAxis 
              type="category" 
              dataKey="nomeShort"
              axisLine={false}
              tickLine={false}
              width={80}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f1f5f9' }}
              formatter={(value: number) => [formatCurrency(value), 'Receita']}
            />
            <Bar 
              dataKey="receita" 
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
