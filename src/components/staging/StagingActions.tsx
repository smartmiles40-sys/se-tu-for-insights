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
import { Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useDeleteStaging, useApproveStaging, useRejectStaging } from '@/hooks/useStagingNegocios';

interface StagingActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  showApproveReject?: boolean;
}

export function StagingActions({ selectedIds, onClearSelection, showApproveReject = true }: StagingActionsProps) {
  const deleteMutation = useDeleteStaging();
  const approveMutation = useApproveStaging();
  const rejectMutation = useRejectStaging();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(selectedIds);
    onClearSelection();
  };

  const handleApprove = async () => {
    await approveMutation.mutateAsync(selectedIds);
    onClearSelection();
  };

  const handleReject = async () => {
    await rejectMutation.mutateAsync(selectedIds);
    onClearSelection();
  };

  const hasSelection = selectedIds.length > 0;
  const isLoading = deleteMutation.isPending || approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasSelection && (
        <span className="text-sm text-muted-foreground mr-2">
          {selectedIds.length} selecionado(s)
        </span>
      )}

      {/* Approve Selected */}
      {showApproveReject && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasSelection || isLoading}
              className="gap-2 text-emerald-600 border-emerald-600/30 hover:bg-emerald-600/10"
            >
              <CheckCircle className="h-4 w-4" />
              Aprovar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aprovar registros?</AlertDialogTitle>
              <AlertDialogDescription>
                Os {selectedIds.length} registro(s) selecionado(s) serão movidos para o dashboard principal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700">
                Aprovar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Reject Selected */}
      {showApproveReject && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasSelection || isLoading}
              className="gap-2 text-orange-600 border-orange-600/30 hover:bg-orange-600/10"
            >
              <XCircle className="h-4 w-4" />
              Rejeitar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeitar registros?</AlertDialogTitle>
              <AlertDialogDescription>
                Os {selectedIds.length} registro(s) selecionado(s) serão marcados como rejeitados e não entrarão no dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReject} className="bg-orange-600 hover:bg-orange-700">
                Rejeitar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

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
              permanentemente removidos do staging E do dashboard principal.
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
    </div>
  );
}
