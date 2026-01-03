import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MarketingDashboard } from '@/components/dashboard/MarketingDashboard';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { useNegocios, useFilterOptions, NegocioFilters } from '@/hooks/useNegocios';
import { Loader2 } from 'lucide-react';

export default function MarketingPage() {
  const [filters, setFilters] = useState<NegocioFilters>({});
  
  const { data: allNegocios, isLoading: loadingAll } = useNegocios();
  const filterOptions = useFilterOptions(allNegocios);
  const { data: negocios, isLoading } = useNegocios(filters);

  if (isLoading || loadingAll) {
    return (
      <DashboardLayout title="Marketing" subtitle="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Dashboard Marketing" 
      subtitle="Análise de canais e origem de leads"
    >
      <div className="space-y-6">
        <FilterBar 
          filters={filters} 
          onFiltersChange={setFilters} 
          options={filterOptions}
        />
        
        {negocios && negocios.length > 0 ? (
          <MarketingDashboard negocios={negocios} />
        ) : (
          <div className="dashboard-section text-center py-16">
            <p className="text-muted-foreground">Nenhum dado encontrado</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
