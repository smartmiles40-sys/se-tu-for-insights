import { DashboardLayout } from '@/components/DashboardLayout';
import { DataImport } from '@/components/DataImport';
import { DataImportRelacionamento } from '@/components/DataImportRelacionamento';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ImportPage() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">Importar Dados</h1>
        <p className="text-sm text-muted-foreground mb-6">Upload de planilha CSV ou Excel</p>
        <Tabs defaultValue="comercial">
          <TabsList className="mb-4">
            <TabsTrigger value="comercial">Comercial</TabsTrigger>
            <TabsTrigger value="relacionamento">Relacionamento</TabsTrigger>
          </TabsList>
          <TabsContent value="comercial">
            <DataImport />
          </TabsContent>
          <TabsContent value="relacionamento">
            <DataImportRelacionamento />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
