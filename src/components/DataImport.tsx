import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useImportNegocios, Negocio } from '@/hooks/useNegocios';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// Mapeamento das colunas do CSV para o banco (mais flexível)
const columnMapping: Record<string, keyof Negocio> = {
  // ID do CRM
  'id': 'crm_id',
  'crm_id': 'crm_id',
  
  // Nome
  'nome': 'nome',
  'título': 'nome',
  'titulo': 'nome',
  
  // Pipeline
  'pipeline de negócio': 'pipeline',
  'pipeline de negocio': 'pipeline',
  'pipeline': 'pipeline',
  
  // Fase
  'fase: em andamento': 'fase',
  'fase: perdidos': 'fase',
  'fase: fechados': 'fase',
  'fase': 'fase',
  
  // Data de Início
  'data de início': 'data_inicio',
  'data de inicio': 'data_inicio',
  'data_inicio': 'data_inicio',
  'data criação': 'data_inicio',
  'data criacao': 'data_inicio',
  
  // Datas específicas
  'data do agendamento': 'data_agendamento',
  'data_agendamento': 'data_agendamento',
  'data da reunião realizada': 'data_reuniao_realizada',
  'data da reuniao realizada': 'data_reuniao_realizada',
  'data_reuniao_realizada': 'data_reuniao_realizada',
  'data do mql': 'data_mql',
  'data_mql': 'data_mql',
  'data do sql': 'data_sql',
  'data_sql': 'data_sql',
  'data da venda realizada': 'data_venda',
  'data_venda': 'data_venda',
  'data de no show': 'data_noshow',
  'data_noshow': 'data_noshow',
  'data prevista de fechamento': 'data_prevista',
  'data_prevista': 'data_prevista',
  'primeiro contato lead': 'primeiro_contato',
  'primeiro_contato': 'primeiro_contato',
  'data de movimentação do card': 'data_movimentacao',
  'data de movimentacao do card': 'data_movimentacao',
  'data_movimentacao': 'data_movimentacao',
  
  // Vendedor
  'vendedor': 'vendedor',
  'responsável': 'vendedor',
  'responsavel': 'vendedor',
  
  // SDR
  'quem fez o agendamento?': 'sdr',
  'quem fez o agendamento': 'sdr',
  'sdr': 'sdr',
  
  // Responsáveis adicionais
  'quem realizou a venda?': 'quem_vendeu',
  'quem realizou a venda': 'quem_vendeu',
  'quem_vendeu': 'quem_vendeu',
  'responsável pela reunião': 'responsavel_reuniao',
  'responsavel pela reuniao': 'responsavel_reuniao',
  'responsavel_reuniao': 'responsavel_reuniao',
  
  // Info etapa
  'informações da etapa': 'info_etapa',
  'informacoes da etapa': 'info_etapa',
  'info_etapa': 'info_etapa',
  
  // MQL/SQL com variações
  'mql': 'mql',
  'mql (preencha com "sim)': 'mql',
  'mql (preencha com "sim")': 'mql',
  'sql': 'sql_qualificado',
  'sql (preencha com "sim")': 'sql_qualificado',
  'sql_qualificado': 'sql_qualificado',
  
  // Reuniões
  'reunião agendada?': 'reuniao_agendada',
  'reunião agendada': 'reuniao_agendada',
  'reuniao agendada?': 'reuniao_agendada',
  'reuniao agendada': 'reuniao_agendada',
  'reuniao_agendada': 'reuniao_agendada',
  'reunião realizada?': 'reuniao_realizada',
  'reunião realizada': 'reuniao_realizada',
  'reuniao realizada?': 'reuniao_realizada',
  'reuniao realizada': 'reuniao_realizada',
  'reuniao_realizada': 'reuniao_realizada',
  
  // No show
  'no show?': 'no_show',
  'no show': 'no_show',
  'no_show': 'no_show',
  
  // Venda aprovada
  'venda aprovada': 'venda_aprovada',
  'venda_aprovada': 'venda_aprovada',
  'venda aprovada (preencha com "sim")': 'venda_aprovada',
  
  // Total / Custo
  'total': 'total',
  'valor': 'total',
  'valor total': 'total',
  'lead: total': 'total',
  'custo': 'custo',
  'custo total da venda': 'custo',
  
  // Tipo de venda
  'tipo de venda': 'tipo_venda',
  'tipo_venda': 'tipo_venda',
  'venda realizada - tipo': 'tipo_venda',
  
  // Motivo de perda
  'motivo de perda': 'motivo_perda',
  'motivo_perda': 'motivo_perda',
  
  // UTM completo
  'lead: utm_source': 'utm_source',
  'utm_source': 'utm_source',
  'utm source': 'utm_source',
  'lead: utm_medium': 'utm_medium',
  'utm_medium': 'utm_medium',
  'utm medium': 'utm_medium',
  'lead: utm_campaign': 'utm_campaign',
  'utm_campaign': 'utm_campaign',
  'utm campaign': 'utm_campaign',
  'lead: utm_content': 'utm_content',
  'utm_content': 'utm_content',
  'utm content': 'utm_content',
  'lead: utm_term': 'utm_term',
  'utm_term': 'utm_term',
  'utm term': 'utm_term',
  
  // Fontes
  'lead: fonte': 'lead_fonte',
  'lead_fonte': 'lead_fonte',
  'fonte': 'lead_fonte',
  'contato: fonte': 'contato_fonte',
  'contato_fonte': 'contato_fonte',
};

function parseBoolean(value: string | undefined | null): boolean {
  if (!value) return false;
  const lower = value.toString().toLowerCase().trim();
  return ['sim', 'yes', 'true', '1', 'x'].includes(lower);
}

function parseNumber(value: string | undefined | null): number {
  if (!value) return 0;
  // Handle Brazilian currency format: R$ 1.234,56
  const cleaned = value
    .toString()
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Validate that a date string is valid for PostgreSQL (year >= 1 and <= 9999)
function isValidDate(dateStr: string): boolean {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1]);
  const month = parseInt(match[2]);
  const day = parseInt(match[3]);
  // PostgreSQL date range: 4713 BC to 5874897 AD, but let's be practical
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

function parseDate(value: string | number | undefined | null): string | null {
  if (value === null || value === undefined || value === '') return null;
  
  // Handle Excel serial date numbers (days since 1899-12-30)
  // Valid Excel dates are typically between 1 (1900-01-01) and ~60000 (2064)
  if (typeof value === 'number') {
    // Reject invalid serial numbers (0 or negative would give dates before 1900)
    if (value < 1 || value > 60000) return null;
    
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;
    return isValidDate(result) ? result : null;
  }
  
  const dateStr = String(value).trim();
  
  // Skip empty or zero-like values
  if (dateStr === '0' || dateStr === '00/00/0000' || dateStr.includes('0000')) return null;
  
  // Format: DD/MM/YYYY or MM/DD/YYYY - detect automatically
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, first, second, year] = slashMatch;
    const yearNum = parseInt(year);
    
    // Reject obviously invalid years
    if (yearNum < 1900 || yearNum > 2100) return null;
    
    const firstNum = parseInt(first);
    const secondNum = parseInt(second);
    
    let day: string, month: string;
    
    // If first number > 12, it must be day (Brazilian DD/MM/YYYY)
    // If second number > 12, it must be day (American MM/DD/YYYY)
    // Ambiguous case: assume Brazilian format DD/MM/YYYY
    if (firstNum > 12) {
      day = first;
      month = second;
    } else if (secondNum > 12) {
      day = second;
      month = first;
    } else {
      day = first;
      month = second;
    }
    
    const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return isValidDate(result) ? result : null;
  }
  
  // Format: YYYY-MM-DD (ISO)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const result = dateStr.substring(0, 10);
    return isValidDate(result) ? result : null;
  }
  
  // Excel serial date as string
  const numValue = parseFloat(dateStr);
  if (!isNaN(numValue) && numValue >= 1 && numValue < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + numValue * 86400000);
    const result = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return isValidDate(result) ? result : null;
  }
  
  return null;
}

function mapRowToNegocio(row: Record<string, string>, userId: string): Partial<Negocio> {
  const mapped: Partial<Negocio> = {
    imported_by: userId,
  };

  for (const [csvColumn, value] of Object.entries(row)) {
    const normalizedColumn = csvColumn.toLowerCase().trim();
    const dbColumn = columnMapping[normalizedColumn];
    
    if (dbColumn) {
      switch (dbColumn) {
        // Campos booleanos
        case 'mql':
        case 'sql_qualificado':
        case 'reuniao_agendada':
        case 'reuniao_realizada':
        case 'no_show':
        case 'venda_aprovada':
          (mapped as any)[dbColumn] = parseBoolean(value);
          break;
        
        // Campos numéricos - nunca sobrescrever valor maior com zero
        case 'total':
          const parsedTotal = parseNumber(value);
          if (parsedTotal > (mapped.total || 0)) {
            mapped.total = parsedTotal;
          }
          break;
        case 'custo':
          const parsedCusto = parseNumber(value);
          if (parsedCusto > (mapped.custo || 0)) {
            mapped.custo = parsedCusto;
          }
          break;
        
        // Campos de data
        case 'data_inicio':
          mapped.data_inicio = parseDate(value);
          break;
        case 'data_agendamento':
          mapped.data_agendamento = parseDate(value);
          break;
        case 'data_reuniao_realizada':
          mapped.data_reuniao_realizada = parseDate(value);
          break;
        case 'data_mql':
          mapped.data_mql = parseDate(value);
          break;
        case 'data_sql':
          mapped.data_sql = parseDate(value);
          break;
        case 'data_venda':
          mapped.data_venda = parseDate(value);
          break;
        case 'data_noshow':
          mapped.data_noshow = parseDate(value);
          break;
        case 'data_prevista':
          mapped.data_prevista = parseDate(value);
          break;
        case 'primeiro_contato':
          mapped.primeiro_contato = parseDate(value);
          break;
        case 'data_movimentacao':
          mapped.data_movimentacao = parseDate(value);
          break;
        
        // Campos de texto
        default:
          // Convert to string first since Excel may return numbers
          const strValue = value !== null && value !== undefined ? String(value).trim() : null;
          (mapped as any)[dbColumn] = strValue || null;
      }
    }
  }

  return mapped;
}

export function DataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'importing' | 'success' | 'error'>('idle');
  
  const { user } = useAuth();
  const importMutation = useImportNegocios();
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    setFile(file);
    setStatus('parsing');
    setProgress(10);

    try {
      let data: Record<string, string>[] = [];

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = await file.text();
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });
        data = result.data as Record<string, string>[];
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel with raw values to preserve date formats
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', raw: true, cellDates: false });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '', raw: false });
      } else {
        throw new Error('Formato de arquivo não suportado. Use CSV ou Excel.');
      }

      setProgress(50);
      setPreview(data.slice(0, 5));
      setStatus('idle');
      setProgress(100);

      toast({
        title: 'Arquivo processado',
        description: `${data.length} registros encontrados. Clique em "Importar" para continuar.`,
      });
    } catch (error) {
      setStatus('error');
      toast({
        variant: 'destructive',
        title: 'Erro ao processar arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, [toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
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
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });
        data = result.data as Record<string, string>[];
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', raw: true, cellDates: false });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '', raw: false });
      }

      setProgress(30);

      console.log('Parsed data sample:', data.slice(0, 3));
      console.log('Column names:', Object.keys(data[0] || {}));
      
      // Find record 17309 for debugging
      const testRecord = data.find(row => row['ID'] === '17309' || row['id'] === '17309');
      if (testRecord) {
        console.log('Record 17309 raw data:', {
          id: testRecord['ID'] || testRecord['id'],
          data_inicio: testRecord['Data de início'] || testRecord['data de início'],
          data_venda: testRecord['Data da venda realizada'] || testRecord['data da venda realizada'],
          total: testRecord['Total'] || testRecord['total']
        });
      }
      
      const negocios = data.map((row, index) => {
        const mapped = mapRowToNegocio(row, user.id);
        
        // Debug first 3 rows
        if (index < 3) {
          console.log(`Row ${index} mapping:`, {
            raw_data_inicio: row['Data de início'],
            mapped_data_inicio: mapped.data_inicio,
            raw_total: row['Total'],
            mapped_total: mapped.total
          });
        }
        
        return mapped;
      });
      
      console.log('Mapped negocios sample:', negocios.slice(0, 3));
      
      setProgress(60);

      await importMutation.mutateAsync(negocios);
      
      setProgress(100);
      setStatus('success');
    } catch (error) {
      console.error('Import error:', error);
      setStatus('error');
      toast({
        variant: 'destructive',
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Verifique o arquivo e tente novamente.',
      });
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreview([]);
    setProgress(0);
    setStatus('idle');
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Dados
          </CardTitle>
          <CardDescription>
            Faça upload de um arquivo CSV ou Excel com os dados do CRM. 
            Os dados existentes serão substituídos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Importação concluída!
              </h3>
              <p className="text-muted-foreground mb-6">
                Os dados foram importados com sucesso.
              </p>
              <Button onClick={resetImport} variant="outline">
                Importar outro arquivo
              </Button>
            </div>
          ) : (
            <>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragActive 
                    ? 'border-accent bg-accent/10' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-primary font-medium">Solte o arquivo aqui...</p>
                ) : (
                  <>
                    <p className="text-foreground font-medium mb-1">
                      Arraste um arquivo ou clique para selecionar
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Formatos aceitos: CSV, Excel (.xlsx, .xls)
                    </p>
                  </>
                )}
              </div>

              {file && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetImport}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Remover
                    </Button>
                  </div>

                  {preview.length > 0 && (
                    <div className="overflow-x-auto">
                      <p className="text-sm text-muted-foreground mb-2">
                        Preview (primeiros 5 registros):
                      </p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            {Object.keys(preview[0]).slice(0, 6).map((key) => (
                              <th key={key} className="text-left p-2 font-medium text-muted-foreground">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, i) => (
                            <tr key={i} className="border-b border-border/50">
                              {Object.values(row).slice(0, 6).map((val, j) => (
                                <td key={j} className="p-2 text-foreground truncate max-w-[150px]">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {(status === 'parsing' || status === 'importing') && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        {status === 'parsing' ? 'Processando arquivo...' : 'Importando dados...'}
                      </p>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <p className="text-sm">Erro na importação. Verifique o arquivo e tente novamente.</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleImport}
                      disabled={status === 'importing' || status === 'parsing'}
                      className="flex-1"
                    >
                      {status === 'importing' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Importar dados
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
