import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useImportClientesRelacionamento, ClienteRelacionamentoInsert } from '@/hooks/useClientesRelacionamento';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Heart } from 'lucide-react';

const columnMapping: Record<string, keyof ClienteRelacionamentoInsert> = {
  'nome_cliente': 'nome_cliente',
  'nome do cliente': 'nome_cliente',
  'nome cliente': 'nome_cliente',
  'cliente': 'nome_cliente',
  'nome': 'nome_cliente',
  'valor_total_cliente': 'valor_total_cliente',
  'valor total cliente': 'valor_total_cliente',
  'valor total': 'valor_total_cliente',
  'valor': 'valor_total_cliente',
  'total': 'valor_total_cliente',
  'receita': 'valor_total_cliente',
  'faturamento': 'valor_total_cliente',
  'quantidade_viagens': 'quantidade_viagens',
  'quantidade viagens': 'quantidade_viagens',
  'qtd viagens': 'quantidade_viagens',
  'viagens': 'quantidade_viagens',
  'quantidade': 'quantidade_viagens',
  'data_primeira_viagem': 'data_primeira_viagem',
  'data primeira viagem': 'data_primeira_viagem',
  'primeira viagem': 'data_primeira_viagem',
  'data_ultima_viagem': 'data_ultima_viagem',
  'data ultima viagem': 'data_ultima_viagem',
  'ultima viagem': 'data_ultima_viagem',
  'última viagem': 'data_ultima_viagem',
  'status': 'status',
  'segmento': 'segmento',
};

function parseNumber(value: string | undefined | null): number {
  if (!value) return 0;
  const cleaned = value.toString().replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDate(value: string | number | undefined | null): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    if (value < 1 || value > 60000) return null;
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  const dateStr = String(value).trim();
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, first, second, year] = slashMatch;
    const firstNum = parseInt(first);
    const secondNum = parseInt(second);
    let day = first, month = second;
    if (firstNum > 12) { day = first; month = second; }
    else if (secondNum > 12) { day = second; month = first; }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return dateStr.substring(0, 10);
  return null;
}

function mapRow(row: Record<string, string>): ClienteRelacionamentoInsert {
  const mapped: ClienteRelacionamentoInsert = { nome_cliente: '' };
  for (const [csvCol, value] of Object.entries(row)) {
    const key = columnMapping[csvCol.toLowerCase().trim()];
    if (!key) continue;
    switch (key) {
      case 'valor_total_cliente': mapped.valor_total_cliente = parseNumber(value); break;
      case 'quantidade_viagens': mapped.quantidade_viagens = parseInt(value) || 0; break;
      case 'data_primeira_viagem': mapped.data_primeira_viagem = parseDate(value); break;
      case 'data_ultima_viagem': mapped.data_ultima_viagem = parseDate(value); break;
      default: (mapped as any)[key] = String(value || '').trim() || null;
    }
  }
  if (!mapped.nome_cliente) mapped.nome_cliente = 'Sem nome';
  // Auto-detect status
  if (!mapped.status) mapped.status = 'ativo';
  return mapped;
}

export function DataImportRelacionamento() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'importing' | 'success' | 'error'>('idle');

  const { user } = useAuth();
  const importMutation = useImportClientesRelacionamento();
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    setFile(file);
    setStatus('parsing');
    setProgress(10);
    try {
      let data: Record<string, string>[] = [];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        data = result.data as Record<string, string>[];
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', raw: true, cellDates: false });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '', raw: false });
      }
      setProgress(50);
      setPreview(data.slice(0, 5));
      setStatus('idle');
      setProgress(100);
      toast({ title: 'Arquivo processado', description: `${data.length} clientes encontrados.` });
    } catch (error) {
      setStatus('error');
      toast({ variant: 'destructive', title: 'Erro ao processar', description: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  }, [toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) processFile(acceptedFiles[0]);
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!file || !user) return;
    setStatus('importing');
    setProgress(0);
    try {
      let data: Record<string, string>[] = [];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        data = result.data as Record<string, string>[];
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', raw: true, cellDates: false });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '', raw: false });
      }
      setProgress(30);
      const records = data.map(row => ({ ...mapRow(row), imported_by: user.id }));
      setProgress(60);
      await importMutation.mutateAsync(records);
      setProgress(100);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      toast({ variant: 'destructive', title: 'Erro na importação', description: error instanceof Error ? error.message : 'Verifique o arquivo.' });
    }
  };

  const resetImport = () => { setFile(null); setPreview([]); setProgress(0); setStatus('idle'); };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Importar Dados de Relacionamento
          </CardTitle>
          <CardDescription>
            CSV com colunas: Nome Cliente, Valor Total, Quantidade Viagens, Data Primeira Viagem, Data Última Viagem, Status, Segmento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Importação concluída!</h3>
              <p className="text-muted-foreground mb-6">Os dados de relacionamento foram importados com sucesso.</p>
              <Button onClick={resetImport} variant="outline">Importar outro arquivo</Button>
            </div>
          ) : (
            <>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-pink-500 bg-pink-500/10' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-pink-500 font-medium">Solte o arquivo aqui...</p>
                ) : (
                  <>
                    <p className="text-foreground font-medium mb-1">Arraste um arquivo ou clique para selecionar</p>
                    <p className="text-sm text-muted-foreground">CSV, Excel (.xlsx, .xls)</p>
                  </>
                )}
              </div>
              {file && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-pink-500" />
                      <div>
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetImport} className="text-muted-foreground hover:text-destructive">Remover</Button>
                  </div>
                  {preview.length > 0 && (
                    <div className="overflow-x-auto">
                      <p className="text-sm text-muted-foreground mb-2">Preview (primeiros 5):</p>
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-border">{Object.keys(preview[0]).slice(0, 6).map(k => <th key={k} className="text-left p-2 font-medium text-muted-foreground">{k}</th>)}</tr></thead>
                        <tbody>{preview.map((row, i) => <tr key={i} className="border-b border-border/50">{Object.values(row).slice(0, 6).map((v, j) => <td key={j} className="p-2 text-foreground truncate max-w-[150px]">{v}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  )}
                  {(status === 'parsing' || status === 'importing') && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-muted-foreground text-center">{status === 'parsing' ? 'Processando...' : 'Importando...'}</p>
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <p className="text-sm">Erro na importação.</p>
                    </div>
                  )}
                  <Button onClick={handleImport} disabled={status === 'importing' || status === 'parsing'} className="w-full">
                    {status === 'importing' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importando...</> : <><Upload className="mr-2 h-4 w-4" />Importar Relacionamento</>}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
