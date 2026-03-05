import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Trash2, Search, Loader2, Users, Upload, FileSpreadsheet } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ClienteRow {
  id: string;
  nome_cliente: string;
  valor_total_cliente: number;
  quantidade_viagens: number;
  data_primeira_viagem: string | null;
  data_ultima_viagem: string | null;
  status: string;
  segmento: string | null;
  created_at: string;
}

export function RelacionamentoManager() {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'importing' | 'success'>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes_relacionamento_manager'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes_relacionamento')
        .select('*')
        .order('valor_total_cliente', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ClienteRow[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('clientes_relacionamento')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes_relacionamento_manager'] });
      queryClient.invalidateQueries({ queryKey: ['clientes_relacionamento'] });
      toast({ title: 'Registros excluídos', description: `${selectedIds.length} registro(s) removido(s).` });
      setSelectedIds([]);
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir os registros.' });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('clientes_relacionamento')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes_relacionamento_manager'] });
      queryClient.invalidateQueries({ queryKey: ['clientes_relacionamento'] });
      toast({ title: 'Todos os dados excluídos', description: 'A tabela de relacionamento foi limpa.' });
      setSelectedIds([]);
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir os dados.' });
    },
  });

  const filtered = useMemo(() => {
    if (!clientes) return [];
    if (!search) return clientes;
    const s = search.toLowerCase();
    return clientes.filter(c =>
      c.nome_cliente.toLowerCase().includes(s) ||
      c.segmento?.toLowerCase().includes(s) ||
      c.status.toLowerCase().includes(s)
    );
  }, [clientes, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(c => c.id));
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const totalRegistros = clientes?.length || 0;
  const isDeleting = deleteMutation.isPending || deleteAllMutation.isPending;

  // CSV/Excel import logic
  const columnMapping: Record<string, string> = {
    'nome_cliente': 'nome_cliente', 'nome do cliente': 'nome_cliente', 'nome cliente': 'nome_cliente',
    'cliente': 'nome_cliente', 'nome': 'nome_cliente',
    'valor_total_cliente': 'valor_total_cliente', 'valor total cliente': 'valor_total_cliente',
    'valor total': 'valor_total_cliente', 'valor': 'valor_total_cliente', 'total': 'valor_total_cliente',
    'receita': 'valor_total_cliente', 'faturamento': 'valor_total_cliente',
    'quantidade_viagens': 'quantidade_viagens', 'quantidade viagens': 'quantidade_viagens',
    'qtd viagens': 'quantidade_viagens', 'viagens': 'quantidade_viagens', 'quantidade': 'quantidade_viagens',
    'data_primeira_viagem': 'data_primeira_viagem', 'data primeira viagem': 'data_primeira_viagem', 'primeira viagem': 'data_primeira_viagem',
    'data_ultima_viagem': 'data_ultima_viagem', 'data ultima viagem': 'data_ultima_viagem', 'ultima viagem': 'data_ultima_viagem', 'última viagem': 'data_ultima_viagem',
    'status': 'status', 'segmento': 'segmento',
  };

  const parseNumber = (v: string | null | undefined): number => {
    if (!v) return 0;
    const cleaned = v.toString().replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const parseDate = (v: string | number | null | undefined): string | null => {
    if (!v) return null;
    if (typeof v === 'number') {
      if (v < 1 || v > 60000) return null;
      const d = new Date(new Date(1899, 11, 30).getTime() + v * 86400000);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const s = String(v).trim();
    const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) {
      const [, a, b, y] = slash;
      const day = parseInt(a) > 12 ? a : b;
      const month = parseInt(a) > 12 ? b : a;
      return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.substring(0, 10);
    return null;
  };

  const mapRow = (row: Record<string, string>) => {
    const mapped: Record<string, any> = { nome_cliente: '' };
    for (const [col, val] of Object.entries(row)) {
      const key = columnMapping[col.toLowerCase().trim()];
      if (!key) continue;
      if (key === 'valor_total_cliente') mapped[key] = parseNumber(val);
      else if (key === 'quantidade_viagens') mapped[key] = parseInt(val) || 0;
      else if (key.startsWith('data_')) mapped[key] = parseDate(val);
      else mapped[key] = String(val || '').trim() || null;
    }
    if (!mapped.nome_cliente) mapped.nome_cliente = 'Sem nome';
    if (!mapped.status) mapped.status = 'ativo';
    return mapped;
  };

  const handleImportFile = useCallback(async (file: File) => {
    if (!user) return;
    setImportStatus('parsing');
    setImportProgress(10);
    try {
      let data: Record<string, string>[] = [];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        data = Papa.parse(text, { header: true, skipEmptyLines: true }).data as Record<string, string>[];
      } else {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array', raw: true, cellDates: false });
        data = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
      }
      setImportProgress(30);
      setImportStatus('importing');

      // Delete existing
      await supabase.from('clientes_relacionamento').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setImportProgress(50);

      const records = data.map(row => ({ ...mapRow(row), imported_by: user.id }));
      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from('clientes_relacionamento').insert(batch as any);
        if (error) throw error;
        setImportProgress(50 + Math.round((i / records.length) * 50));
      }

      setImportProgress(100);
      setImportStatus('success');
      queryClient.invalidateQueries({ queryKey: ['clientes_relacionamento_manager'] });
      queryClient.invalidateQueries({ queryKey: ['clientes_relacionamento'] });
      toast({ title: 'Importação concluída', description: `${records.length} clientes importados.` });
      setTimeout(() => setImportStatus('idle'), 2000);
    } catch (error) {
      setImportStatus('idle');
      toast({ variant: 'destructive', title: 'Erro na importação', description: error instanceof Error ? error.message : 'Verifique o arquivo.' });
    }
  }, [user, queryClient, toast]);

  const onDrop = useCallback((files: File[]) => {
    if (files.length > 0) handleImportFile(files[0]);
  }, [handleImportFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    maxFiles: 1,
    noClick: importStatus !== 'idle',
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-pink-500" />
            <div>
              <CardTitle>Relacionamento</CardTitle>
              <CardDescription>
                {totalRegistros} cliente(s) na base de relacionamento. Selecione para excluir.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <span className="text-sm text-muted-foreground mr-2">{selectedIds.length} selecionado(s)</span>
            )}
            {isDeleting && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={selectedIds.length === 0 || isDeleting} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                  Excluir Selecionados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir {selectedIds.length} registro(s)?</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate(selectedIds)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={totalRegistros === 0 || isDeleting} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                  Excluir Todos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir todos os {totalRegistros} registros?</AlertDialogTitle>
                  <AlertDialogDescription>Todos os dados de relacionamento serão permanentemente removidos. Esta ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteAllMutation.mutate()} className="bg-destructive hover:bg-destructive/90">Excluir Todos</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Import dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-pink-500 bg-pink-500/10' : 'border-border hover:border-primary/50 hover:bg-muted/50'
          } ${importStatus !== 'idle' ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input {...getInputProps()} />
          {importStatus === 'importing' || importStatus === 'parsing' ? (
            <div className="space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">{importStatus === 'parsing' ? 'Processando arquivo...' : 'Importando...'}</p>
              <Progress value={importProgress} className="h-1.5 max-w-xs mx-auto" />
            </div>
          ) : importStatus === 'success' ? (
            <p className="text-sm text-emerald-500 font-medium">✓ Importação concluída!</p>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Arraste um CSV/Excel ou clique para importar</p>
                <p className="text-xs text-muted-foreground">Colunas: Nome Cliente, Valor Total, Qtd Viagens, Datas, Status, Segmento</p>
              </div>
            </div>
          )}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, segmento ou status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="text-xs">Cliente</TableHead>
                  <TableHead className="text-xs text-right">Valor Total</TableHead>
                  <TableHead className="text-xs text-right">Viagens</TableHead>
                  <TableHead className="text-xs">Primeira Viagem</TableHead>
                  <TableHead className="text-xs">Última Viagem</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Segmento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id} className={selectedIds.includes(c.id) ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                    </TableCell>
                    <TableCell className="text-sm font-medium">{c.nome_cliente}</TableCell>
                    <TableCell className="text-sm text-right font-bold text-emerald-500">{formatCurrency(c.valor_total_cliente)}</TableCell>
                    <TableCell className="text-sm text-right">{c.quantidade_viagens}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.data_primeira_viagem)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(c.data_ultima_viagem)}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.segmento || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
