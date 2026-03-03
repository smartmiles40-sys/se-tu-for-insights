import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EspecialistasDashboard } from '@/components/dashboard/EspecialistasDashboard';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { useNegocios, useFilterOptions, NegocioFilters } from '@/hooks/useNegocios';
import { useColaboradores } from '@/hooks/useColaboradores';
import { Loader2 } from 'lucide-react';

export default function EspecialistasPage() {
  const [filters, setFilters] = useState<NegocioFilters>({});
  
  const { data: allNegocios, isLoading: loadingAll } = useNegocios();
  const { data: colaboradoresEsp } = useColaboradores('especialista');
  const filterOptions = useFilterOptions(allNegocios);
  const { data: negocios, isLoading } = useNegocios(filters);

  // Restrict vendedor filter options to only registered Especialista colaboradores
  const filteredOptions = useMemo(() => {
    if (!colaboradoresEsp) return filterOptions;
    const espNames = colaboradoresEsp.map(c => c.nome.toLowerCase());
    return {
      ...filterOptions,
      vendedores: filterOptions.vendedores.filter(v => 
        espNames.some(name => v.toLowerCase().includes(name) || name.includes(v.toLowerCase()))
      ),
    };
  }, [filterOptions, colaboradoresEsp]);

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
          <h1 className="text-2xl font-bold text-foreground">Performance Especialistas</h1>
          <p className="text-sm text-muted-foreground">Análise de vendas e fechamento</p>
        </div>
        
        <FilterBar 
          filters={filters} 
          onFiltersChange={setFilters} 
          options={filteredOptions}
        />
        
        {negocios && negocios.length > 0 ? (
          <EspecialistasDashboard negocios={negocios} />
        ) : (
          <div className="dashboard-section text-center py-16">
            <p className="text-muted-foreground">Nenhum dado encontrado</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
