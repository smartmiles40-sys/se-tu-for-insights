import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StagingNegocio, useUpdateStagingNegocio } from '@/hooks/useStagingNegocios';

interface StagingTableProps {
  data: StagingNegocio[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function StagingTable({ data, selectedIds, onSelectionChange }: StagingTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const updateMutation = useUpdateStagingNegocio();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.filter(d => d.status === 'pendente').map(d => d.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(i => i !== id));
    }
  };

  const startEditing = (id: string, field: string, currentValue: string | number | null) => {
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || '');
  };

  const saveEdit = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    let value: string | number | null = editValue;

    // Handle numeric fields
    if (field === 'total') {
      value = parseFloat(editValue.replace(',', '.')) || 0;
    }

    await updateMutation.mutateAsync({
      id,
      updates: { [field]: value || null },
    });

    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Pendente</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const EditableCell = ({ 
    id, 
    field, 
    value, 
    className 
  }: { 
    id: string; 
    field: string; 
    value: string | number | null; 
    className?: string;
  }) => {
    const isEditing = editingCell?.id === id && editingCell?.field === field;

    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-8 w-full min-w-[100px]"
        />
      );
    }

    return (
      <div
        className={cn(
          'cursor-pointer px-2 py-1 -mx-2 -my-1 rounded hover:bg-muted/50 transition-colors min-h-[28px]',
          className
        )}
        onClick={() => startEditing(id, field, value)}
        title="Clique para editar"
      >
        {value ?? '-'}
      </div>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const pendingCount = data.filter(d => d.status === 'pendente').length;
  const allPendingSelected = pendingCount > 0 && selectedIds.length === pendingCount;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allPendingSelected}
                onCheckedChange={handleSelectAll}
                disabled={pendingCount === 0}
              />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Pipeline</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>MQL</TableHead>
            <TableHead>SQL</TableHead>
            <TableHead>Reunião</TableHead>
            <TableHead>Venda</TableHead>
            <TableHead>Fonte</TableHead>
            <TableHead>UTM Source</TableHead>
            <TableHead>Importado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  selectedIds.includes(row.id) && 'bg-muted/50',
                  row.status !== 'pendente' && 'opacity-60'
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onCheckedChange={(checked) => handleSelectRow(row.id, !!checked)}
                    disabled={row.status !== 'pendente'}
                  />
                </TableCell>
                <TableCell>{getStatusBadge(row.status)}</TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="nome" value={row.nome} />
                </TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="pipeline" value={row.pipeline} />
                </TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="vendedor" value={row.vendedor} />
                </TableCell>
                <TableCell>
                  <EditableCell 
                    id={row.id} 
                    field="total" 
                    value={formatCurrency(row.total)} 
                  />
                </TableCell>
                <TableCell>{formatDate(row.data_inicio)}</TableCell>
                <TableCell>
                  <Badge variant={row.mql ? 'default' : 'outline'}>
                    {row.mql ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={row.sql_qualificado ? 'default' : 'outline'}>
                    {row.sql_qualificado ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={row.reuniao_agendada ? 'default' : 'outline'}>
                    {row.reuniao_agendada ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={row.venda_aprovada ? 'default' : 'outline'}>
                    {row.venda_aprovada ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="contato_fonte" value={row.contato_fonte} />
                </TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="utm_source" value={row.utm_source} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(row.imported_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
