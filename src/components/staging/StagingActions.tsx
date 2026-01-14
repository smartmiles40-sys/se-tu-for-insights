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
import { Trash2 } from 'lucide-react';
import { useDeleteStaging } from '@/hooks/useStagingNegocios';

interface StagingActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export function StagingActions({ selectedIds, onClearSelection }: StagingActionsProps) {
  const deleteMutation = useDeleteStaging();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(selectedIds);
    onClearSelection();
  };

  const hasSelection = selectedIds.length > 0;
  const isLoading = deleteMutation.isPending;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasSelection && (
        <span className="text-sm text-muted-foreground mr-2">
          {selectedIds.length} selecionado(s)
        </span>
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
            Excluir Selecionados
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
