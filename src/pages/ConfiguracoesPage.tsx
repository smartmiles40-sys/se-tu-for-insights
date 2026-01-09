import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { 
  useAllColaboradores, 
  useCreateColaborador, 
  useUpdateColaborador, 
  useDeleteColaborador,
  Colaborador 
} from '@/hooks/useColaboradores';
import { useMetas, useDeleteMeta, Meta } from '@/hooks/useMetas';
import { Loader2, Users, UserCheck, Plus, Pencil, Trash2, Settings, Target } from 'lucide-react';

export default function ConfiguracoesPage() {
  const { data: colaboradores, isLoading: loadingColaboradores } = useAllColaboradores();
  const { data: metas, isLoading: loadingMetas } = useMetas();
  const createColaborador = useCreateColaborador();
  const updateColaborador = useUpdateColaborador();
  const deleteColaborador = useDeleteColaborador();
  const deleteMeta = useDeleteMeta();

  // Form states
  const [newNome, setNewNome] = useState('');
  const [newTipo, setNewTipo] = useState<'sdr' | 'especialista'>('especialista');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleAddColaborador = async () => {
    if (!newNome.trim()) return;
    
    await createColaborador.mutateAsync({
      nome: newNome.trim(),
      tipo: newTipo,
    });
    
    setNewNome('');
    setDialogOpen(false);
  };

  const handleUpdateColaborador = async () => {
    if (!editingColaborador || !editingColaborador.nome.trim()) return;
    
    await updateColaborador.mutateAsync({
      id: editingColaborador.id,
      nome: editingColaborador.nome.trim(),
      tipo: editingColaborador.tipo,
      ativo: editingColaborador.ativo,
    });
    
    setEditingColaborador(null);
    setEditDialogOpen(false);
  };

  const handleDeleteColaborador = async (id: string) => {
    await deleteColaborador.mutateAsync(id);
  };

  const handleDeleteMeta = async (id: string) => {
    await deleteMeta.mutateAsync(id);
  };

  const sdrs = colaboradores?.filter(c => c.tipo === 'sdr') || [];
  const especialistas = colaboradores?.filter(c => c.tipo === 'especialista') || [];

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  if (loadingColaboradores || loadingMetas) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Configurações
            </h1>
            <p className="text-muted-foreground">Gerencie colaboradores e metas</p>
          </div>
        </div>

        <Tabs defaultValue="colaboradores" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="colaboradores" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Colaboradores
            </TabsTrigger>
            <TabsTrigger value="metas" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Metas Cadastradas
            </TabsTrigger>
          </TabsList>

          {/* Colaboradores Tab */}
          <TabsContent value="colaboradores" className="mt-6 space-y-6">
            {/* Add Colaborador Button */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Colaborador</DialogTitle>
                  <DialogDescription>
                    Adicione um novo SDR ou Especialista à equipe.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newNome}
                      onChange={(e) => setNewNome(e.target.value)}
                      placeholder="Nome do colaborador"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={newTipo} onValueChange={(v: 'sdr' | 'especialista') => setNewTipo(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="especialista">Especialista</SelectItem>
                        <SelectItem value="sdr">SDR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddColaborador} disabled={createColaborador.isPending || !newNome.trim()}>
                    {createColaborador.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* SDRs List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  SDRs ({sdrs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sdrs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum SDR cadastrado. Clique em "Adicionar Colaborador" para começar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sdrs.map((sdr) => (
                      <div 
                        key={sdr.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{sdr.nome}</span>
                          {!sdr.ativo && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditingColaborador(sdr);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir colaborador?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O colaborador "{sdr.nome}" será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteColaborador(sdr.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Especialistas List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-400" />
                  Especialistas ({especialistas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {especialistas.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum especialista cadastrado. Clique em "Adicionar Colaborador" para começar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {especialistas.map((esp) => (
                      <div 
                        key={esp.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{esp.nome}</span>
                          {!esp.ativo && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditingColaborador(esp);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir colaborador?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O colaborador "{esp.nome}" será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteColaborador(esp.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metas Tab */}
          <TabsContent value="metas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Metas Cadastradas ({metas?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!metas || metas.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma meta cadastrada. Acesse a página de Metas para configurar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {metas.map((meta) => (
                      <div 
                        key={meta.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={meta.tipo === 'global' ? 'default' : meta.tipo === 'sdr' ? 'secondary' : 'outline'}>
                              {meta.tipo === 'global' ? 'Global' : meta.tipo === 'sdr' ? 'SDR' : 'Especialista'}
                            </Badge>
                            {meta.responsavel && (
                              <span className="font-medium">{meta.responsavel}</span>
                            )}
                            <span className="text-muted-foreground">
                              - {meses[meta.mes - 1]} {meta.ano}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                            {meta.meta_faturamento > 0 && (
                              <span>Faturamento: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(meta.meta_faturamento)}</span>
                            )}
                            {meta.meta_vendas > 0 && (
                              <span>Vendas: {meta.meta_vendas}</span>
                            )}
                            {meta.meta_reunioes > 0 && (
                              <span>Reuniões: {meta.meta_reunioes}</span>
                            )}
                            {meta.meta_agendamentos > 0 && (
                              <span>Agendamentos: {meta.meta_agendamentos}</span>
                            )}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A meta será removida permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMeta(meta.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
              <DialogDescription>
                Altere as informações do colaborador.
              </DialogDescription>
            </DialogHeader>
            {editingColaborador && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editingColaborador.nome}
                    onChange={(e) => setEditingColaborador({...editingColaborador, nome: e.target.value})}
                    placeholder="Nome do colaborador"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={editingColaborador.tipo} 
                    onValueChange={(v: 'sdr' | 'especialista') => setEditingColaborador({...editingColaborador, tipo: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especialista">Especialista</SelectItem>
                      <SelectItem value="sdr">SDR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch
                    checked={editingColaborador.ativo}
                    onCheckedChange={(checked) => setEditingColaborador({...editingColaborador, ativo: checked})}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateColaborador} disabled={updateColaborador.isPending}>
                {updateColaborador.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
