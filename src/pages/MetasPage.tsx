import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMetas, useUpsertMeta } from '@/hooks/useMetas';
import { useColaboradores } from '@/hooks/useColaboradores';
import { Loader2, Target, Users, UserCheck, Save, TrendingUp, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export default function MetasPage() {
  const today = new Date();
  const [selectedMes, setSelectedMes] = useState(today.getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState(today.getFullYear());

  const { data: metas, isLoading: loadingMetas } = useMetas(selectedMes, selectedAno);
  const { data: sdrs, isLoading: loadingSDRs } = useColaboradores('sdr');
  const { data: especialistas, isLoading: loadingEspecialistas } = useColaboradores('especialista');
  const upsertMeta = useUpsertMeta();

  // Form states
  const [globalMeta, setGlobalMeta] = useState({
    meta_faturamento: 0,
    meta_vendas: 0,
    meta_reunioes: 0,
    meta_agendamentos: 0,
  });

  const [sdrMetas, setSdrMetas] = useState<Record<string, typeof globalMeta>>({});
  const [especialistaMetas, setEspecialistaMetas] = useState<Record<string, typeof globalMeta>>({});

  // Initialize form with existing data
  useEffect(() => {
    if (!metas) return;

    const global = metas.find(m => m.tipo === 'global');
    if (global) {
      setGlobalMeta({
        meta_faturamento: global.meta_faturamento || 0,
        meta_vendas: global.meta_vendas || 0,
        meta_reunioes: global.meta_reunioes || 0,
        meta_agendamentos: global.meta_agendamentos || 0,
      });
    } else {
      setGlobalMeta({
        meta_faturamento: 0,
        meta_vendas: 0,
        meta_reunioes: 0,
        meta_agendamentos: 0,
      });
    }

    const sdrMap: Record<string, typeof globalMeta> = {};
    const especialistaMap: Record<string, typeof globalMeta> = {};

    metas.forEach(m => {
      if (m.tipo === 'sdr' && m.responsavel) {
        sdrMap[m.responsavel] = {
          meta_faturamento: m.meta_faturamento || 0,
          meta_vendas: m.meta_vendas || 0,
          meta_reunioes: m.meta_reunioes || 0,
          meta_agendamentos: m.meta_agendamentos || 0,
        };
      }
      if (m.tipo === 'especialista' && m.responsavel) {
        especialistaMap[m.responsavel] = {
          meta_faturamento: m.meta_faturamento || 0,
          meta_vendas: m.meta_vendas || 0,
          meta_reunioes: m.meta_reunioes || 0,
          meta_agendamentos: m.meta_agendamentos || 0,
        };
      }
    });

    setSdrMetas(sdrMap);
    setEspecialistaMetas(especialistaMap);
  }, [metas]);

  const handleSaveGlobal = async () => {
    await upsertMeta.mutateAsync({
      tipo: 'global',
      mes: selectedMes,
      ano: selectedAno,
      ...globalMeta,
    });
  };

  const handleSaveSdr = async (sdr: string) => {
    const meta = sdrMetas[sdr] || { meta_faturamento: 0, meta_vendas: 0, meta_reunioes: 0, meta_agendamentos: 0 };
    await upsertMeta.mutateAsync({
      tipo: 'sdr',
      responsavel: sdr,
      mes: selectedMes,
      ano: selectedAno,
      ...meta,
    });
  };

  const handleSaveEspecialista = async (especialista: string) => {
    const meta = especialistaMetas[especialista] || { meta_faturamento: 0, meta_vendas: 0, meta_reunioes: 0, meta_agendamentos: 0 };
    await upsertMeta.mutateAsync({
      tipo: 'especialista',
      responsavel: especialista,
      mes: selectedMes,
      ano: selectedAno,
      ...meta,
    });
  };

  const updateSdrMeta = (sdr: string, field: string, value: number) => {
    setSdrMetas(prev => ({
      ...prev,
      [sdr]: {
        ...prev[sdr] || { meta_faturamento: 0, meta_vendas: 0, meta_reunioes: 0, meta_agendamentos: 0 },
        [field]: value,
      },
    }));
  };

  const updateEspecialistaMeta = (especialista: string, field: string, value: number) => {
    setEspecialistaMetas(prev => ({
      ...prev,
      [especialista]: {
        ...prev[especialista] || { meta_faturamento: 0, meta_vendas: 0, meta_reunioes: 0, meta_agendamentos: 0 },
        [field]: value,
      },
    }));
  };

  if (loadingMetas || loadingSDRs || loadingEspecialistas) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const noColaboradores = (!sdrs || sdrs.length === 0) && (!especialistas || especialistas.length === 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Metas</h1>
            <p className="text-muted-foreground">Configure as metas globais e individuais</p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedMes.toString()}
              onValueChange={(v) => setSelectedMes(parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedAno.toString()}
              onValueChange={(v) => setSelectedAno(parseInt(v))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((a) => (
                  <SelectItem key={a} value={a.toString()}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {noColaboradores && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium text-yellow-500">Nenhum colaborador cadastrado</p>
                <p className="text-sm text-muted-foreground">
                  Cadastre SDRs e Especialistas nas Configurações para definir metas individuais.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/configuracoes">Ir para Configurações</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Global
            </TabsTrigger>
            <TabsTrigger value="sdrs" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              SDRs
            </TabsTrigger>
            <TabsTrigger value="especialistas" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Especialistas
            </TabsTrigger>
          </TabsList>

          {/* Global Tab */}
          <TabsContent value="global" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Meta Global - {meses.find(m => m.value === selectedMes)?.label} {selectedAno}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-cyan-400" />
                      Meta Faturamento
                    </Label>
                    <Input
                      type="number"
                      value={globalMeta.meta_faturamento}
                      onChange={(e) => setGlobalMeta(prev => ({ ...prev, meta_faturamento: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      Meta Vendas
                    </Label>
                    <Input
                      type="number"
                      value={globalMeta.meta_vendas}
                      onChange={(e) => setGlobalMeta(prev => ({ ...prev, meta_vendas: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      Meta Reuniões
                    </Label>
                    <Input
                      type="number"
                      value={globalMeta.meta_reunioes}
                      onChange={(e) => setGlobalMeta(prev => ({ ...prev, meta_reunioes: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-yellow-400" />
                      Meta Agendamentos
                    </Label>
                    <Input
                      type="number"
                      value={globalMeta.meta_agendamentos}
                      onChange={(e) => setGlobalMeta(prev => ({ ...prev, meta_agendamentos: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button onClick={handleSaveGlobal} disabled={upsertMeta.isPending}>
                    {upsertMeta.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Meta Global
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SDRs Tab */}
          <TabsContent value="sdrs" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {!sdrs || sdrs.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Nenhum SDR cadastrado. Cadastre SDRs nas Configurações.
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/configuracoes">Ir para Configurações</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                sdrs.map((sdr) => (
                  <Card key={sdr.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-400" />
                        {sdr.nome}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Meta Agendamentos</Label>
                          <Input
                            type="number"
                            value={sdrMetas[sdr.nome]?.meta_agendamentos || 0}
                            onChange={(e) => updateSdrMeta(sdr.nome, 'meta_agendamentos', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Meta Reuniões</Label>
                          <Input
                            type="number"
                            value={sdrMetas[sdr.nome]?.meta_reunioes || 0}
                            onChange={(e) => updateSdrMeta(sdr.nome, 'meta_reunioes', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleSaveSdr(sdr.nome)} 
                        disabled={upsertMeta.isPending}
                        size="sm"
                        className="mt-4 w-full"
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Salvar
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Especialistas Tab */}
          <TabsContent value="especialistas" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {!especialistas || especialistas.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Nenhum especialista cadastrado. Cadastre especialistas nas Configurações.
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/configuracoes">Ir para Configurações</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                especialistas.map((especialista) => (
                  <Card key={especialista.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-400" />
                        {especialista.nome}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Meta Faturamento</Label>
                          <Input
                            type="number"
                            value={especialistaMetas[especialista.nome]?.meta_faturamento || 0}
                            onChange={(e) => updateEspecialistaMeta(especialista.nome, 'meta_faturamento', parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Meta Vendas</Label>
                          <Input
                            type="number"
                            value={especialistaMetas[especialista.nome]?.meta_vendas || 0}
                            onChange={(e) => updateEspecialistaMeta(especialista.nome, 'meta_vendas', parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleSaveEspecialista(especialista.nome)} 
                        disabled={upsertMeta.isPending}
                        size="sm"
                        className="mt-4 w-full"
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Salvar
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
