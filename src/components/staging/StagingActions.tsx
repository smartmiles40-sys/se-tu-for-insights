import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Check, X, Trash2, CheckCheck } from 'lucide-react';
import { useApproveStaging, useRejectStaging, useDeleteStaging } from '@/hooks/useStagingNegocios';

interface StagingActionsProps {
  selectedIds: string[];
  allPendingIds: string[];
  onClearSelection: () => void;
}

export function StagingActions({ selectedIds, allPendingIds, onClearSelection }: StagingActionsProps) {
  const approveMutation = useApproveStaging();
  const rejectMutation = useRejectStaging();
  const deleteMutation = useDeleteStaging();

  const handleApprove = async () => {
    await approveMutation.mutateAsync(selectedIds);
    onClearSelection();
  };

  const handleApproveAll = async () => {
    await approveMutation.mutateAsync(allPendingIds);
    onClearSelection();
  };

  const handleReject = async () => {
    await rejectMutation.mutateAsync(selectedIds);
    onClearSelection();
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(selectedIds);
    onClearSelection();
  };

  const hasSelection = selectedIds.length > 0;
  const hasPending = allPendingIds.length > 0;
  const isLoading = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasSelection && (
        <span className="text-sm text-muted-foreground mr-2">
          {selectedIds.length} selecionado(s)
        </span>
      )}

      {/* Approve Selected */}
      <Button
        variant="default"
        size="sm"
        onClick={handleApprove}
        disabled={!hasSelection || isLoading}
        className="gap-2 bg-green-600 hover:bg-green-700"
      >
        <Check className="h-4 w-4" />
        Aprovar Selecionados
      </Button>

      {/* Reject Selected */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReject}
        disabled={!hasSelection || isLoading}
        className="gap-2 text-yellow-600 border-yellow-600/30 hover:bg-yellow-600/10"
      >
        <X className="h-4 w-4" />
        Rejeitar
      </Button>

      {/* Delete Selected */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasSelection || isLoading}
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registros?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os {selectedIds.length} registro(s) selecionado(s) serão 
              permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve All Pending */}
      {hasPending && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="gap-2 ml-4"
            >
              <CheckCheck className="h-4 w-4" />
              Aprovar Todos ({allPendingIds.length})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aprovar todos os pendentes?</AlertDialogTitle>
              <AlertDialogDescription>
                {allPendingIds.length} registro(s) serão aprovados e movidos para o dashboard. 
                Certifique-se de que revisou todos os dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleApproveAll} className="bg-green-600 hover:bg-green-700">
                Aprovar Todos
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
