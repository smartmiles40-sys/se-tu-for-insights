import { ClienteRelacionamento } from '@/hooks/useClientesRelacionamento';
import { ClientesStats } from '@/hooks/useClientesRelacionamento';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ClienteDistributionChartProps {
  clientes: ClienteRelacionamento[];
  stats: ClientesStats;
}

export function ClienteDistributionChart({ clientes, stats }: ClienteDistributionChartProps) {
  const novos = stats.totalClientes - stats.clientesRecorrentes;
  const pieData = [
    { name: 'Recorrentes', value: stats.clientesRecorrentes, color: '#06b6d4' },
    { name: 'Novos', value: novos, color: '#f59e0b' },
  ];

  // Histograma de frequência de compras
  const freqMap: Record<number, number> = {};
  clientes.forEach(c => {
    const v = c.quantidade_compras;
    freqMap[v] = (freqMap[v] || 0) + 1;
  });
  const histData = Object.entries(freqMap)
    .map(([k, v]) => ({ compras: `${k}x`, count: v }))
    .sort((a, b) => parseInt(a.compras) - parseInt(b.compras));

  // Top clientes receita (barras horizontais)
  const topClientes = [...clientes]
    .sort((a, b) => b.valor_total_cliente - a.valor_total_cliente)
    .slice(0, 10)
    .map(c => ({ nome: c.nome_cliente.length > 20 ? c.nome_cliente.slice(0, 20) + '…' : c.nome_cliente, valor: c.valor_total_cliente }));

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Receita por Cliente */}
      <div className="bi-card lg:col-span-1">
        <h3 className="bi-card-title mb-3">Receita por Cliente (Top 10)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topClientes} layout="vertical" margin={{ left: 0, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" tickFormatter={formatCurrency} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis type="category" dataKey="nome" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="valor" fill="#06b6d4" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distribuição Novos vs Recorrentes */}
      <div className="bi-card">
        <h3 className="bi-card-title mb-3">Distribuição de Clientes</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {pieData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-300">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name}: {d.value}
            </div>
          ))}
        </div>
      </div>

      {/* Frequência de Compras */}
      <div className="bi-card">
        <h3 className="bi-card-title mb-3">Frequência de Compras</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={histData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="compras" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} name="Clientes" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
