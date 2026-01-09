import { useMemo } from 'react';
import { Negocio } from '@/hooks/useNegocios';
import { GaugeChart } from './GaugeChart';

interface CriticalRatesPanelProps {
  negocios: Negocio[];
}

const IDEAL_RATES = {
  agendamento: 50,
  mqlToSql: 60,
  sqlToVenda: 25,
  noShow: 20, // Ideal is BELOW this (inverted)
  showUp: 80,
};

export function CriticalRatesPanel({ negocios }: CriticalRatesPanelProps) {
  const rates = useMemo(() => {
    const totalLeads = negocios.length;
    const mql = negocios.filter(n => n.mql).length;
    const sql = negocios.filter(n => n.sql_qualificado || n.reuniao_agendada).length;
    const reunioesAgendadas = negocios.filter(n => n.reuniao_agendada).length;
    const reunioesRealizadas = negocios.filter(n => n.reuniao_realizada).length;
    const vendas = negocios.filter(n => n.venda_aprovada).length;
    const noShows = negocios.filter(n => n.reuniao_agendada && !n.reuniao_realizada).length;

    return {
      agendamento: totalLeads > 0 ? (reunioesAgendadas / totalLeads) * 100 : 0,
      mqlToSql: mql > 0 ? (sql / mql) * 100 : 0,
      sqlToVenda: sql > 0 ? (vendas / sql) * 100 : 0,
      noShow: reunioesAgendadas > 0 ? (noShows / reunioesAgendadas) * 100 : 0,
      showUp: reunioesAgendadas > 0 ? (reunioesRealizadas / reunioesAgendadas) * 100 : 0,
    };
  }, [negocios]);

  return (
    <div className="noc-panel">
      <div className="noc-panel-header">
        <h3 className="noc-panel-title">Taxas Críticas</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <GaugeChart
          value={rates.agendamento}
          ideal={IDEAL_RATES.agendamento}
          label="Agendamento"
          size="sm"
        />
        <GaugeChart
          value={rates.mqlToSql}
          ideal={IDEAL_RATES.mqlToSql}
          label="MQL → SQL"
          size="sm"
        />
        <GaugeChart
          value={rates.sqlToVenda}
          ideal={IDEAL_RATES.sqlToVenda}
          label="SQL → Venda"
          size="sm"
        />
        <GaugeChart
          value={100 - rates.noShow}
          ideal={100 - IDEAL_RATES.noShow}
          label="Comparecimento"
          size="sm"
        />
        <GaugeChart
          value={rates.showUp}
          ideal={IDEAL_RATES.showUp}
          label="Show-Up"
          size="sm"
        />
      </div>
    </div>
  );
}