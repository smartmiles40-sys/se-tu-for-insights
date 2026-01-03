import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
import { Negocio } from '@/hooks/useNegocios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MarketingDashboardProps {
  negocios: Negocio[];
}

interface OrigemStats {
  origem: string;
  leads: number;
  reunioes: number;
  vendas: number;
  receita: number;
  taxaConversao: number;
  custoImplicito: number;
}

const CHART_COLORS = [
  'hsl(177, 63%, 10%)',
  'hsl(76, 76%, 65%)',
  'hsl(120, 16%, 70%)',
  'hsl(177, 45%, 25%)',
  'hsl(76, 60%, 50%)',
];

export function MarketingDashboard({ negocios }: MarketingDashboardProps) {
  const origemStats = useMemo((): OrigemStats[] => {
    const origens = [...new Set(negocios.map(n => n.utm_source || n.lead_fonte || 'Não identificado'))];
    
    return origens.map(origem => {
      const origemNegocios = negocios.filter(n => 
        (n.utm_source || n.lead_fonte || 'Não identificado') === origem
      );
      const leads = origemNegocios.length;
      const reunioes = origemNegocios.filter(n => n.reuniao_realizada).length;
      const vendas = origemNegocios.filter(n => n.venda_aprovada);
      const vendasCount = vendas.length;
      const receita = vendas.reduce((sum, n) => sum + (n.total || 0), 0);
      const taxaConversao = leads > 0 ? (vendasCount / leads) * 100 : 0;
      
      return {
        origem,
        leads,
        reunioes,
        vendas: vendasCount,
        receita,
        taxaConversao,
        custoImplicito: 0,
      };
    }).sort((a, b) => b.receita - a.receita);
  }, [negocios]);

  const chartData = origemStats.slice(0, 8).map(item => ({
    name: item.origem.length > 15 ? item.origem.substring(0, 15) + '...' : item.origem,
    Leads: item.leads,
    Vendas: item.vendas,
    'Taxa %': item.taxaConversao,
  }));

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('pt-BR')}
              {entry.name === 'Taxa %' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="dashboard-section">
        <h3 className="section-title">Performance por Origem</h3>
        
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum dado de origem disponível
          </p>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Leads" fill="hsl(177, 63%, 10%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Vendas" fill="hsl(76, 76%, 65%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="dashboard-section">
        <h3 className="section-title">Detalhamento por Canal</h3>
        
        {origemStats.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum dado disponível
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Origem</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Reuniões</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {origemStats.map((item) => (
                  <TableRow key={item.origem}>
                    <TableCell className="font-medium">{item.origem}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR').format(item.leads)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR').format(item.reunioes)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-accent">
                      {new Intl.NumberFormat('pt-BR').format(item.vendas)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(item.receita)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.taxaConversao.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
