import { useMemo, useState } from "react";
import { Negocio, NegocioFilters } from "@/hooks/useNegocios";
import { SDRPerformance } from "./SDRPerformance";
import { MetasTargetBar, useSDRMetaItems } from "./MetasTargetBar";
import { useMetas } from "@/hooks/useMetas";
import { useColaboradores } from "@/hooks/useColaboradores";
import { getCurrentMonthBrazil, getCurrentYearBrazil, getTodayBrazil } from "@/lib/dateUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, MapPin, Award, ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SDRDashboardProps {
  negocios: Negocio[];
  filters?: NegocioFilters;
}

const VALID_PIPELINES = ["Pré-Vendas - Comercial", "Comercial 1 - Se tu for eu vou"];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
];

export function SDRDashboard({ negocios, filters }: SDRDashboardProps) {
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 15;

  // Determine month/year from filters or current date
  const currentMes = useMemo(() => {
    if (filters?.dataInicioFrom) {
      return new Date(filters.dataInicioFrom + 'T12:00:00').getMonth() + 1;
    }
    return getCurrentMonthBrazil();
  }, [filters?.dataInicioFrom]);

  const currentAno = useMemo(() => {
    if (filters?.dataInicioFrom) {
      return new Date(filters.dataInicioFrom + 'T12:00:00').getFullYear();
    }
    return getCurrentYearBrazil();
  }, [filters?.dataInicioFrom]);

  const { data: metas } = useMetas(currentMes, currentAno);
  const sdrMeta = useMemo(() => metas?.find(m => m.tipo === 'sdr' && !m.responsavel) || null, [metas]);

  const { data: colaboradoresSDR } = useColaboradores('sdr');
  const today = getTodayBrazil();

  // Compute SDR totals for metas
  const sdrTotais = useMemo(() => {
    if (!colaboradoresSDR || colaboradoresSDR.length === 0) return { faturamentoGerado: 0, comparecimento: 0, agendamentosTotais: 0, mql: 0, totalLeads: 0, reunioesRealizadas: 0 };
    const sdrNames = colaboradoresSDR.map(c => c.nome);
    let faturamentoGerado = 0, comparecimento = 0, agendamentosTotais = 0, mql = 0, totalLeads = 0, reunioesRealizadas = 0;
    sdrNames.forEach(sdr => {
      const sdrNegocios = negocios.filter(n => n.sdr && n.sdr.toLowerCase().includes(sdr.toLowerCase()));
      totalLeads += sdrNegocios.length;
      agendamentosTotais += sdrNegocios.filter(n => n.data_agendamento).length;
      reunioesRealizadas += sdrNegocios.filter(n => n.data_reuniao_realizada).length;
      comparecimento += sdrNegocios.filter(n => n.data_reuniao_realizada).length;
      faturamentoGerado += sdrNegocios.filter(n => n.data_venda).reduce((sum, n) => sum + (n.total || 0), 0);
      mql += sdrNegocios.filter(n => n.data_mql).length;
    });
    return { faturamentoGerado, comparecimento, agendamentosTotais, mql, totalLeads, reunioesRealizadas };
  }, [negocios, colaboradoresSDR]);

  const sdrMetaItems = useSDRMetaItems(sdrMeta, sdrTotais);

  const isInPeriod = (dateStr: string | null): boolean => {
    return !!dateStr;
  };

  const isPipelineValido = (pipeline: string | null): boolean => {
    return pipeline !== null && VALID_PIPELINES.includes(pipeline);
  };

  // Filter negocios by valid pipelines
  const validNegocios = useMemo(() => {
    return negocios.filter((n) => isPipelineValido(n.pipeline));
  }, [negocios]);

  // 1. Total Leads - COUNT where primeiro_contato is filled in period
  const totalLeads = useMemo(() => {
    return validNegocios.filter((n) => n.primeiro_contato && isInPeriod(n.primeiro_contato)).length;
  }, [validNegocios, filters]);

  // 2. Leads por Dia - Group by primeiro_contato date
  const leadsPorDia = useMemo(() => {
    const leadsWithDate = validNegocios.filter((n) => n.primeiro_contato && isInPeriod(n.primeiro_contato));

    const grouped: Record<string, number> = {};
    leadsWithDate.forEach((n) => {
      const date = n.primeiro_contato!;
      grouped[date] = (grouped[date] || 0) + 1;
    });

    // Create array sorted by date
    return Object.entries(grouped)
      .map(([date, count]) => ({
        date,
        displayDate: format(parseISO(date), "dd/MM", { locale: ptBR }),
        leads: count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [validNegocios, filters]);

  // 3. Leads Agendados - Group by sdr field
  const leadsPorSDR = useMemo(() => {
    const leadsWithSDR = validNegocios.filter(
      (n) => n.sdr && n.sdr !== "Não se aplica" && n.primeiro_contato && isInPeriod(n.primeiro_contato),
    );

    const grouped: Record<string, number> = {};
    leadsWithSDR.forEach((n) => {
      const sdr = n.sdr!;
      grouped[sdr] = (grouped[sdr] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([nome, leads]) => ({ nome, leads }))
      .sort((a, b) => b.leads - a.leads);
  }, [validNegocios, filters]);

  // 4. Origem dos Leads - Group by contato_fonte
  const origemLeads = useMemo(() => {
    const leadsWithSource = validNegocios.filter(
      (n) => n.contato_fonte && n.primeiro_contato && isInPeriod(n.primeiro_contato),
    );

    const grouped: Record<string, number> = {};
    leadsWithSource.forEach((n) => {
      const fonte = n.contato_fonte!;
      grouped[fonte] = (grouped[fonte] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([fonte, leads]) => ({ fonte, leads }))
      .sort((a, b) => b.leads - a.leads);
  }, [validNegocios, filters]);

  // 5. Ranking de Fontes Qualificadas - Sources with SDR assigned
  const fontesQualificadas = useMemo(() => {
    const qualified = validNegocios.filter(
      (n) =>
        n.sdr && n.sdr !== "Não se aplica" && n.contato_fonte && n.primeiro_contato && isInPeriod(n.primeiro_contato),
    );

    const grouped: Record<string, { total: number; qualified: number }> = {};

    // Count all leads by source
    validNegocios
      .filter((n) => n.contato_fonte && n.primeiro_contato && isInPeriod(n.primeiro_contato))
      .forEach((n) => {
        const fonte = n.contato_fonte!;
        if (!grouped[fonte]) grouped[fonte] = { total: 0, qualified: 0 };
        grouped[fonte].total++;
      });

    // Count qualified leads (with SDR)
    qualified.forEach((n) => {
      const fonte = n.contato_fonte!;
      if (!grouped[fonte]) grouped[fonte] = { total: 0, qualified: 0 };
      grouped[fonte].qualified++;
    });

    return Object.entries(grouped)
      .map(([fonte, data]) => ({
        fonte,
        total: data.total,
        qualificados: data.qualified,
        taxa: data.total > 0 ? (data.qualified / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.qualificados - a.qualificados);
  }, [validNegocios, filters]);

  // 6. Detailed Table Data
  const tableData = useMemo(() => {
    return validNegocios
      .filter((n) => n.primeiro_contato && isInPeriod(n.primeiro_contato))
      .map((n) => ({
        id: n.id,
        data: n.primeiro_contato,
        sdr: n.sdr || "-",
        fonte: n.contato_fonte || "-",
      }))
      .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  }, [validNegocios, filters]);

  const paginatedTableData = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return tableData.slice(start, start + tablePageSize);
  }, [tableData, tablePage]);

  const totalTablePages = Math.ceil(tableData.length / tablePageSize);

  // Leads atendidos (com SDR preenchido)
  const leadsAtendidos = useMemo(() => {
    return validNegocios.filter(
      (n) => n.sdr && n.sdr !== "Não se aplica" && n.primeiro_contato && isInPeriod(n.primeiro_contato),
    ).length;
  }, [validNegocios, filters]);

  const formatNumber = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

  if (validNegocios.length === 0) {
    return (
      <div className="dashboard-section text-center py-16">
        <p className="text-muted-foreground">Nenhum dado disponível para os pipelines válidos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metas SDR */}
      <MetasTargetBar tipo="sdr" items={sdrMetaItems} mes={currentMes} ano={currentAno} />

      {/* SDR Performance Table */}
      <SDRPerformance negocios={negocios} />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-section">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatNumber(totalLeads)}</div>
            <p className="text-xs text-muted-foreground mt-1">Com primeiro contato no período</p>
          </CardContent>
        </Card>

        <Card className="dashboard-section">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Atendidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatNumber(leadsAtendidos)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalLeads > 0 ? `${((leadsAtendidos / totalLeads) * 100).toFixed(1)}% do total` : "-"}
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-section">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SDRs Ativos</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{leadsPorSDR.length}</div>
            <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
          </CardContent>
        </Card>

        <Card className="dashboard-section">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fontes de Leads</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{origemLeads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Origens identificadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads por Dia Chart */}
      <Card className="dashboard-section">
        <CardHeader>
          <CardTitle className="section-title">Leads por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          {leadsPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leadsPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  name="Leads"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads por SDR */}
        <Card className="dashboard-section">
          <CardHeader>
            <CardTitle className="section-title">Leads por SDR</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsPorSDR.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadsPorSDR.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    width={120}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado de SDR disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Origem dos Leads */}
        <Card className="dashboard-section">
          <CardHeader>
            <CardTitle className="section-title">Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {origemLeads.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={origemLeads.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="fonte"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatNumber(value), "Leads"]}
                  />
                  <Bar dataKey="leads" radius={[4, 4, 0, 0]} name="Leads">
                    {origemLeads.slice(0, 8).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado de origem disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
