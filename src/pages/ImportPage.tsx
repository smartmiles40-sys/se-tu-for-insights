import { DashboardLayout } from '@/components/DashboardLayout';
import { DataImport } from '@/components/DataImport';

export default function ImportPage() {
  return (
    <DashboardLayout 
      title="Importar Dados" 
      subtitle="Upload de planilha CSV ou Excel"
    >
      <div className="max-w-3xl">
        <DataImport />
      </div>
    </DashboardLayout>
  );
}
