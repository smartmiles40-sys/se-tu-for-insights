import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SDRDashboard } from '@/components/dashboard/SDRDashboard';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { useNegocios, useFilterOptions, NegocioFilters } from '@/hooks/useNegocios';
import { useColaboradores } from '@/hooks/useColaboradores';
import { Loader2 } from 'lucide-react';

export default function SDRPage() {
  const [filters, setFilters] = useState<NegocioFilters>({});
  
  const { data: allNegocios, isLoading: loadingAll } = useNegocios();
  const { data: colaboradoresSDR } = useColaboradores('sdr');
  const filterOptions = useFilterOptions(allNegocios);
  const { data: negocios, isLoading } = useNegocios(filters);

  // Restrict SDR filter options to only registered SDR colaboradores
  const filteredOptions = useMemo(() => {
    if (!colaboradoresSDR) return filterOptions;
    const sdrNames = colaboradoresSDR.map(c => c.nome.toLowerCase());
    return {
      ...filterOptions,
      sdrs: filterOptions.sdrs.filter(sdr => 
        sdrNames.some(name => sdr.toLowerCase().includes(name) || name.includes(sdr.toLowerCase()))
      ),
    };
  }, [filterOptions, colaboradoresSDR]);

  if (isLoading || loadingAll) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance SDRs</h1>
          <p className="text-sm text-muted-foreground">Análise de leads, atendimentos e origens</p>
        </div>
        
        <FilterBar 
          filters={filters} 
          onFiltersChange={setFilters} 
          options={filteredOptions}
          showFonte={true}
          hidePipeline={true}
          hideVendedor={true}
          hideUtmSource={true}
        />
        
        {negocios && negocios.length > 0 ? (
          <SDRDashboard negocios={negocios} filters={filters} />
        ) : (
          <div className="dashboard-section text-center py-16">
            <p className="text-muted-foreground">Nenhum dado encontrado</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
