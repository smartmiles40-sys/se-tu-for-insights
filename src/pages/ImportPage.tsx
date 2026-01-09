import { DashboardLayout } from '@/components/DashboardLayout';
import { DataImport } from '@/components/DataImport';

export default function ImportPage() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">Importar Dados</h1>
        <p className="text-sm text-muted-foreground mb-6">Upload de planilha CSV ou Excel</p>
        <DataImport />
      </div>
    </DashboardLayout>
  );
}
