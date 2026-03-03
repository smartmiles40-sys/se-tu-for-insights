import { useMemo, useState } from "react";
import { Negocio, NegocioFilters } from "@/hooks/useNegocios";
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

      {/* Ranking de Fontes Qualificadas */}
      <Card className="dashboard-section">
        <CardHeader>
          <CardTitle className="section-title">Ranking de Fontes Mais Qualificadas</CardTitle>
        </CardHeader>
        <CardContent>
          {fontesQualificadas.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead className="text-right">Total Leads</TableHead>
                    <TableHead className="text-right">Atendidos por SDR</TableHead>
                    <TableHead className="text-right">Taxa de Qualificação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fontesQualificadas.slice(0, 10).map((fonte, index) => (
                    <TableRow key={fonte.fonte}>
                      <TableCell>
                        <Badge
                          variant={index < 3 ? "default" : "secondary"}
                          className="w-6 h-6 flex items-center justify-center p-0"
                        >
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{fonte.fonte}</TableCell>
                      <TableCell className="text-right">{formatNumber(fonte.total)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatNumber(fonte.qualificados)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={fonte.taxa >= 50 ? "default" : fonte.taxa >= 25 ? "secondary" : "outline"}>
                          {fonte.taxa.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
          )}
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card className="dashboard-section">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="section-title">Tabela Detalhada de Leads</CardTitle>
          <span className="text-sm text-muted-foreground">{formatNumber(tableData.length)} registros</span>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data do Primeiro Contato</TableHead>
                  <TableHead>SDR Responsável</TableHead>
                  <TableHead>Fonte do Lead</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTableData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.data ? format(parseISO(row.data), "dd/MM/yyyy", { locale: ptBR }) : "-"}</TableCell>
                    <TableCell>
                      {row.sdr !== "-" ? (
                        <Badge variant="outline">{row.sdr}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{row.fonte}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalTablePages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Página {tablePage} de {totalTablePages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                  disabled={tablePage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
                  disabled={tablePage === totalTablePages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
