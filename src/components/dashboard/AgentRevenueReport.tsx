import { useMemo } from "react";
import { Negocio, NegocioFilters } from "@/hooks/useNegocios";
import { cn } from "@/lib/utils";
import { Users, TrendingUp, DollarSign, Award, UserCheck, Briefcase } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface AgentRevenueReportProps {
  negocios: Negocio[];
  filters?: NegocioFilters;
}

interface AgentStats {
  nome: string;
  tipo: "SDR" | "Especialista";
  vendas: number;
  faturamento: number;
  ticketMedio: number;
}

export function AgentRevenueReport({ negocios, filters }: AgentRevenueReportProps) {
  // Helper to check if date is in period
  const isInPeriod = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false;
    if (!filters?.dataInicio || !filters?.dataFim) return true;
    return dateStr >= filters.dataInicio && dateStr <= filters.dataFim;
  };

  const { allAgents, sdrTotal, especialistaTotal, grandTotal } = useMemo(() => {
    const agents: AgentStats[] = [];

    // Buscar TODOS os vendedores únicos (quem fechou a venda - campo vendedor ou quem_vendeu)
    const vendedores = [
      ...new Set(negocios.map((n) => n.vendedor || n.quem_vendeu).filter((v): v is string => !!v && v.trim() !== "")),
    ];

    // Para cada vendedor, calcular vendas e faturamento
    vendedores.forEach((vendedor) => {
      const vendasAgente = negocios.filter(
        (n) => (n.vendedor === vendedor || n.quem_vendeu === vendedor) && n.data_venda && isInPeriod(n.data_venda),
      );

      const vendas = vendasAgente.length;
      const faturamento = vendasAgente.reduce((sum, n) => sum + (n.total || 0), 0);

      if (vendas > 0 || faturamento > 0) {
        // Determinar se é SDR ou Especialista baseado no nome
        const isSDR = vendedor.toLowerCase().includes("sdr");

        agents.push({
          nome: vendedor,
          tipo: isSDR ? "SDR" : "Especialista",
          vendas,
          faturamento,
          ticketMedio: vendas > 0 ? faturamento / vendas : 0,
        });
      }
    });

    // Sort by faturamento
    agents.sort((a, b) => b.faturamento - a.faturamento);

    // Calculate totals
    const sdrStats = agents.filter((a) => a.tipo === "SDR");
    const espStats = agents.filter((a) => a.tipo === "Especialista");

    return {
      allAgents: agents,
      sdrTotal: {
        count: sdrStats.length,
        vendas: sdrStats.reduce((sum, a) => sum + a.vendas, 0),
        faturamento: sdrStats.reduce((sum, a) => sum + a.faturamento, 0),
      },
      especialistaTotal: {
        count: espStats.length,
        vendas: espStats.reduce((sum, a) => sum + a.vendas, 0),
        faturamento: espStats.reduce((sum, a) => sum + a.faturamento, 0),
      },
      grandTotal: {
        count: agents.length,
        vendas: agents.reduce((sum, a) => sum + a.vendas, 0),
        faturamento: agents.reduce((sum, a) => sum + a.faturamento, 0),
      },
    };
  }, [negocios, filters]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);

  if (allAgents.length === 0) {
    return (
      <div className="noc-panel">
        <div className="noc-panel-header">
          <h3 className="noc-panel-title">Relatório de Faturamento — Agentes</h3>
        </div>
        <p className="text-muted-foreground text-center py-8">Nenhum dado de faturamento disponível</p>
      </div>
    );
  }

  // Chart data
  const chartData = allAgents.slice(0, 10).map((a) => ({
    nome: a.nome.length > 12 ? a.nome.substring(0, 12) + "..." : a.nome,
    faturamento: a.faturamento,
    tipo: a.tipo,
  }));

  const pieData = [
    { name: "SDRs", value: sdrTotal.faturamento, fill: "hsl(var(--primary))" },
    { name: "Especialistas", value: especialistaTotal.faturamento, fill: "hsl(var(--success))" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="noc-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Agentes</p>
          </div>
          <p className="text-2xl font-display font-bold">{grandTotal.count}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {sdrTotal.count} SDRs · {especialistaTotal.count} Especialistas
          </p>
        </div>
        <div className="noc-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Vendas</p>
          </div>
          <p className="text-2xl font-display font-bold text-primary">{formatNumber(grandTotal.vendas)}</p>
        </div>
        <div className="noc-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Faturamento Total</p>
          </div>
          <p className="text-2xl font-display font-bold text-success">{formatCurrency(grandTotal.faturamento)}</p>
        </div>
        <div className="noc-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Ticket Médio</p>
          </div>
          <p className="text-2xl font-display font-bold">
            {formatCurrency(grandTotal.vendas > 0 ? grandTotal.faturamento / grandTotal.vendas : 0)}
          </p>
        </div>
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="noc-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">SDRs (Faturamento Originado)</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Agentes</p>
              <p className="text-lg font-bold">{sdrTotal.count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vendas</p>
              <p className="text-lg font-bold text-primary">{formatNumber(sdrTotal.vendas)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita</p>
              <p className="text-lg font-bold text-success">{formatCurrency(sdrTotal.faturamento)}</p>
            </div>
          </div>
        </div>

        <div className="noc-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="h-5 w-5 text-success" />
            <h4 className="font-semibold">Especialistas (Vendas Diretas)</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Agentes</p>
              <p className="text-lg font-bold">{especialistaTotal.count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vendas</p>
              <p className="text-lg font-bold text-primary">{formatNumber(especialistaTotal.vendas)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita</p>
              <p className="text-lg font-bold text-success">{formatCurrency(especialistaTotal.faturamento)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Top 10 */}
        <div className="noc-panel lg:col-span-2">
          <div className="noc-panel-header">
            <h3 className="noc-panel-title">Top 10 Agentes por Faturamento</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  width={100}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                />
                <Bar dataKey="faturamento" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.tipo === "SDR" ? "hsl(var(--primary))" : "hsl(var(--success))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary"></div>
              <span>SDR</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-success"></div>
              <span>Especialista</span>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="noc-panel">
          <div className="noc-panel-header">
            <h3 className="noc-panel-title">Distribuição por Tipo</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Full Table */}
      <div className="noc-panel">
        <div className="noc-panel-header">
          <h3 className="noc-panel-title">Detalhamento Completo — Todos os Agentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  #
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Agente
                </th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vendas
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Faturamento
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ticket Médio
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  % do Total
                </th>
              </tr>
            </thead>
            <tbody>
              {allAgents.map((agent, index) => {
                const percentTotal =
                  grandTotal.faturamento > 0 ? (agent.faturamento / grandTotal.faturamento) * 100 : 0;

                return (
                  <tr
                    key={`${agent.tipo}-${agent.nome}`}
                    className={cn(
                      "border-b border-border/50 transition-colors hover:bg-muted/30",
                      index === 0 && "bg-success/10",
                    )}
                  >
                    <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{agent.nome}</span>
                      {index === 0 && (
                        <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">Top</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          agent.tipo === "SDR" ? "bg-primary/20 text-primary" : "bg-success/20 text-success",
                        )}
                      >
                        {agent.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatNumber(agent.vendas)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-success">
                      {formatCurrency(agent.faturamento)}
                    </td>
                    <td className="py-3 px-4 text-right">{formatCurrency(agent.ticketMedio)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${Math.min(percentTotal, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12">{percentTotal.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-semibold">
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4">TOTAL</td>
                <td className="py-3 px-4 text-center">{grandTotal.count} agentes</td>
                <td className="py-3 px-4 text-right text-primary">{formatNumber(grandTotal.vendas)}</td>
                <td className="py-3 px-4 text-right text-success">{formatCurrency(grandTotal.faturamento)}</td>
                <td className="py-3 px-4 text-right">
                  {formatCurrency(grandTotal.vendas > 0 ? grandTotal.faturamento / grandTotal.vendas : 0)}
                </td>
                <td className="py-3 px-4 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
