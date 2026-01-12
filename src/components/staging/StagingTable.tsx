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
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
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
    if (field === 'total' || field === 'custo') {
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

  const EditableDateCell = ({
    id,
    field,
    value,
  }: {
    id: string;
    field: string;
    value: string | null;
  }) => {
    const [open, setOpen] = useState(false);

    const handleDateSelect = async (date: Date | undefined) => {
      const dateValue = date ? format(date, 'yyyy-MM-dd') : null;
      await updateMutation.mutateAsync({
        id,
        updates: { [field]: dateValue },
      });
      setOpen(false);
    };

    const parsedDate = value ? new Date(value + 'T00:00:00') : undefined;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 justify-start text-left font-normal px-2 -mx-2 hover:bg-muted/50',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {value ? formatDate(value) : '-'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleDateSelect}
            initialFocus
            locale={ptBR}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    );
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
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
            <TableHead>SDR</TableHead>
            <TableHead>Quem Vendeu</TableHead>
            <TableHead>Resp. Reunião</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead>CRM ID</TableHead>
            <TableHead>Fase</TableHead>
            <TableHead>Tipo Venda</TableHead>
            <TableHead>Fonte</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>1º Contato</TableHead>
            <TableHead>Agendamento</TableHead>
            <TableHead>Reunião</TableHead>
            <TableHead>Data MQL</TableHead>
            <TableHead>Data SQL</TableHead>
            <TableHead>Data Venda</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={22} className="h-24 text-center text-muted-foreground">
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
                  <EditableCell id={row.id} field="sdr" value={row.sdr} />
                </TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="quem_vendeu" value={row.quem_vendeu} />
                </TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="responsavel_reuniao" value={row.responsavel_reuniao} />
                </TableCell>
                <TableCell>
                  <EditableCell 
                    id={row.id} 
                    field="total" 
                    value={formatCurrency(row.total)} 
                  />
                </TableCell>
                <TableCell>
                  <EditableCell 
                    id={row.id} 
                    field="custo" 
                    value={formatCurrency(row.custo)} 
                  />
                </TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="crm_id" value={row.crm_id} />
                </TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="fase" value={row.fase} />
                </TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="tipo_venda" value={row.tipo_venda} />
                </TableCell>
                <TableCell>
                  <EditableCell id={row.id} field="contato_fonte" value={row.contato_fonte} />
                </TableCell>
                <TableCell>
                  <EditableDateCell id={row.id} field="data_inicio" value={row.data_inicio} />
                </TableCell>
                <TableCell>
                  <EditableDateCell id={row.id} field="primeiro_contato" value={row.primeiro_contato} />
                </TableCell>
                <TableCell>
                  <EditableDateCell id={row.id} field="data_agendamento" value={row.data_agendamento} />
                </TableCell>
                <TableCell>
                  <EditableDateCell id={row.id} field="data_reuniao_realizada" value={row.data_reuniao_realizada} />
                </TableCell>
                <TableCell>
                  <EditableDateCell id={row.id} field="data_mql" value={row.data_mql} />
                </TableCell>
                <TableCell>
                  <EditableDateCell id={row.id} field="data_sql" value={row.data_sql} />
                </TableCell>
                <TableCell>
                  <EditableDateCell id={row.id} field="data_venda" value={row.data_venda} />
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
