import { useState, useEffect } from 'react';
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

interface GlobalMeta {
  meta_faturamento_minimo: number;
  meta_faturamento_satisfatorio: number;
  meta_faturamento_excelente: number;
  meta_conversao_minimo: number;
  meta_conversao_satisfatorio: number;
  meta_conversao_excelente: number;
  meta_reunioes: number;
  meta_agendamentos: number;
}

interface IndividualMeta {
  meta_faturamento_minimo: number;
  meta_faturamento_satisfatorio: number;
  meta_faturamento_excelente: number;
  meta_reunioes_minimo: number;
  meta_reunioes_satisfatorio: number;
  meta_reunioes_excelente: number;
  meta_agendamentos_minimo: number;
  meta_agendamentos_satisfatorio: number;
  meta_agendamentos_excelente: number;
}

const defaultGlobalMeta: GlobalMeta = {
  meta_faturamento_minimo: 0,
  meta_faturamento_satisfatorio: 0,
  meta_faturamento_excelente: 0,
  meta_conversao_minimo: 0,
  meta_conversao_satisfatorio: 0,
  meta_conversao_excelente: 0,
  meta_reunioes: 0,
  meta_agendamentos: 0,
};

const defaultIndividualMeta: IndividualMeta = {
  meta_faturamento_minimo: 0,
  meta_faturamento_satisfatorio: 0,
  meta_faturamento_excelente: 0,
  meta_reunioes_minimo: 0,
  meta_reunioes_satisfatorio: 0,
  meta_reunioes_excelente: 0,
  meta_agendamentos_minimo: 0,
  meta_agendamentos_satisfatorio: 0,
  meta_agendamentos_excelente: 0,
};

export default function MetasPage() {
  const today = new Date();
  const [selectedMes, setSelectedMes] = useState(today.getMonth() + 1);
  const [selectedAno, setSelectedAno] = useState(today.getFullYear());

  const { data: metas, isLoading: loadingMetas } = useMetas(selectedMes, selectedAno);
  const { data: sdrs, isLoading: loadingSDRs } = useColaboradores('sdr');
  const { data: especialistas, isLoading: loadingEspecialistas } = useColaboradores('especialista');
  const upsertMeta = useUpsertMeta();

  const [globalMeta, setGlobalMeta] = useState<GlobalMeta>(defaultGlobalMeta);
  const [sdrMetas, setSdrMetas] = useState<Record<string, IndividualMeta>>({});
  const [especialistaMetas, setEspecialistaMetas] = useState<Record<string, IndividualMeta>>({});

  useEffect(() => {
    if (!metas) return;

    const global = metas.find(m => m.tipo === 'global');
    if (global) {
      setGlobalMeta({
        meta_faturamento_minimo: global.meta_faturamento_minimo || 0,
        meta_faturamento_satisfatorio: global.meta_faturamento_satisfatorio || 0,
        meta_faturamento_excelente: global.meta_faturamento_excelente || 0,
        meta_conversao_minimo: global.meta_conversao_minimo || 0,
        meta_conversao_satisfatorio: global.meta_conversao_satisfatorio || 0,
        meta_conversao_excelente: global.meta_conversao_excelente || 0,
        meta_reunioes: global.meta_reunioes || 0,
        meta_agendamentos: global.meta_agendamentos || 0,
      });
    } else {
      setGlobalMeta(defaultGlobalMeta);
    }

    const sdrMap: Record<string, IndividualMeta> = {};
    const especialistaMap: Record<string, IndividualMeta> = {};

    metas.forEach(m => {
      if (m.tipo === 'sdr' && m.responsavel) {
        sdrMap[m.responsavel] = {
          meta_faturamento_minimo: m.meta_faturamento_minimo || 0,
          meta_faturamento_satisfatorio: m.meta_faturamento_satisfatorio || 0,
          meta_faturamento_excelente: m.meta_faturamento_excelente || 0,
          meta_reunioes_minimo: m.meta_reunioes_minimo || 0,
          meta_reunioes_satisfatorio: m.meta_reunioes_satisfatorio || 0,
          meta_reunioes_excelente: m.meta_reunioes_excelente || 0,
          meta_agendamentos_minimo: m.meta_agendamentos_minimo || 0,
          meta_agendamentos_satisfatorio: m.meta_agendamentos_satisfatorio || 0,
          meta_agendamentos_excelente: m.meta_agendamentos_excelente || 0,
        };
      }
      if (m.tipo === 'especialista' && m.responsavel) {
        especialistaMap[m.responsavel] = {
          meta_faturamento_minimo: m.meta_faturamento_minimo || 0,
          meta_faturamento_satisfatorio: m.meta_faturamento_satisfatorio || 0,
          meta_faturamento_excelente: m.meta_faturamento_excelente || 0,
          meta_reunioes_minimo: m.meta_reunioes_minimo || 0,
          meta_reunioes_satisfatorio: m.meta_reunioes_satisfatorio || 0,
          meta_reunioes_excelente: m.meta_reunioes_excelente || 0,
          meta_agendamentos_minimo: m.meta_agendamentos_minimo || 0,
          meta_agendamentos_satisfatorio: m.meta_agendamentos_satisfatorio || 0,
          meta_agendamentos_excelente: m.meta_agendamentos_excelente || 0,
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

  const handleSaveIndividual = async (tipo: 'sdr' | 'especialista', nome: string) => {
    const metaMap = tipo === 'sdr' ? sdrMetas : especialistaMetas;
    const meta = metaMap[nome] || defaultIndividualMeta;
    await upsertMeta.mutateAsync({
      tipo,
      responsavel: nome,
      mes: selectedMes,
      ano: selectedAno,
      ...meta,
    });
  };

  const updateIndividualMeta = (
    tipo: 'sdr' | 'especialista',
    nome: string,
    field: keyof IndividualMeta,
    value: number
  ) => {
    const setter = tipo === 'sdr' ? setSdrMetas : setEspecialistaMetas;
    setter(prev => ({
      ...prev,
      [nome]: {
        ...(prev[nome] || defaultIndividualMeta),
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

  const ThreeLevelInput = ({
    label,
    icon: Icon,
    iconColor,
    values,
    onChange,
    isCurrency = false,
    isPercent = false,
  }: {
    label: string;
    icon: React.ElementType;
    iconColor: string;
    values: { minimo: number; satisfatorio: number; excelente: number };
    onChange: (level: 'minimo' | 'satisfatorio' | 'excelente', value: number) => void;
    isCurrency?: boolean;
    isPercent?: boolean;
  }) => (
    <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        {label}
      </Label>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-red-400">Mínimo</Label>
          <Input
            type="number"
            value={values.minimo}
            onChange={(e) => onChange('minimo', isCurrency ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
            placeholder="0"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-yellow-400">Satisfatório</Label>
          <Input
            type="number"
            value={values.satisfatorio}
            onChange={(e) => onChange('satisfatorio', isCurrency ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
            placeholder="0"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-green-400">Excelente</Label>
          <Input
            type="number"
            value={values.excelente}
            onChange={(e) => onChange('excelente', isCurrency ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
            placeholder="0"
            className="h-9 text-sm"
          />
        </div>
      </div>
      {isPercent && <p className="text-xs text-muted-foreground">Valores em %</p>}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Metas</h1>
            <p className="text-muted-foreground">Configure as metas com 3 níveis: mínimo, satisfatório e excelente</p>
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
              <CardContent className="space-y-6">
                {/* Faturamento - 3 levels */}
                <ThreeLevelInput
                  label="Faturamento (R$)"
                  icon={DollarSign}
                  iconColor="text-cyan-400"
                  values={{
                    minimo: globalMeta.meta_faturamento_minimo,
                    satisfatorio: globalMeta.meta_faturamento_satisfatorio,
                    excelente: globalMeta.meta_faturamento_excelente,
                  }}
                  onChange={(level, value) => setGlobalMeta(prev => ({ ...prev, [`meta_faturamento_${level}`]: value }))}
                  isCurrency
                />

                {/* Conversão - 3 levels */}
                <ThreeLevelInput
                  label="Conversão de Vendas (%)"
                  icon={TrendingUp}
                  iconColor="text-green-400"
                  values={{
                    minimo: globalMeta.meta_conversao_minimo,
                    satisfatorio: globalMeta.meta_conversao_satisfatorio,
                    excelente: globalMeta.meta_conversao_excelente,
                  }}
                  onChange={(level, value) => setGlobalMeta(prev => ({ ...prev, [`meta_conversao_${level}`]: value }))}
                  isPercent
                />

                {/* Reuniões e Agendamentos - single value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
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
                  <div className="space-y-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
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

                <Button onClick={handleSaveGlobal} disabled={upsertMeta.isPending}>
                  {upsertMeta.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar Meta Global
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SDRs Tab */}
          <TabsContent value="sdrs" className="mt-6">
            <div className="space-y-4">
              {!sdrs || sdrs.length === 0 ? (
                <Card>
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
                sdrs.map((sdr) => {
                  const meta = sdrMetas[sdr.nome] || defaultIndividualMeta;
                  return (
                    <Card key={sdr.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-400" />
                          {sdr.nome}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ThreeLevelInput
                          label="Faturamento Originado (R$)"
                          icon={DollarSign}
                          iconColor="text-cyan-400"
                          values={{
                            minimo: meta.meta_faturamento_minimo,
                            satisfatorio: meta.meta_faturamento_satisfatorio,
                            excelente: meta.meta_faturamento_excelente,
                          }}
                          onChange={(level, value) => updateIndividualMeta('sdr', sdr.nome, `meta_faturamento_${level}` as keyof IndividualMeta, value)}
                          isCurrency
                        />
                        <ThreeLevelInput
                          label="Reuniões"
                          icon={Calendar}
                          iconColor="text-purple-400"
                          values={{
                            minimo: meta.meta_reunioes_minimo,
                            satisfatorio: meta.meta_reunioes_satisfatorio,
                            excelente: meta.meta_reunioes_excelente,
                          }}
                          onChange={(level, value) => updateIndividualMeta('sdr', sdr.nome, `meta_reunioes_${level}` as keyof IndividualMeta, value)}
                        />
                        <ThreeLevelInput
                          label="Agendamentos"
                          icon={Target}
                          iconColor="text-yellow-400"
                          values={{
                            minimo: meta.meta_agendamentos_minimo,
                            satisfatorio: meta.meta_agendamentos_satisfatorio,
                            excelente: meta.meta_agendamentos_excelente,
                          }}
                          onChange={(level, value) => updateIndividualMeta('sdr', sdr.nome, `meta_agendamentos_${level}` as keyof IndividualMeta, value)}
                        />
                        <Button
                          onClick={() => handleSaveIndividual('sdr', sdr.nome)}
                          disabled={upsertMeta.isPending}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Metas de {sdr.nome}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Especialistas Tab */}
          <TabsContent value="especialistas" className="mt-6">
            <div className="space-y-4">
              {!especialistas || especialistas.length === 0 ? (
                <Card>
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
                especialistas.map((especialista) => {
                  const meta = especialistaMetas[especialista.nome] || defaultIndividualMeta;
                  return (
                    <Card key={especialista.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-400" />
                          {especialista.nome}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ThreeLevelInput
                          label="Faturamento (R$)"
                          icon={DollarSign}
                          iconColor="text-cyan-400"
                          values={{
                            minimo: meta.meta_faturamento_minimo,
                            satisfatorio: meta.meta_faturamento_satisfatorio,
                            excelente: meta.meta_faturamento_excelente,
                          }}
                          onChange={(level, value) => updateIndividualMeta('especialista', especialista.nome, `meta_faturamento_${level}` as keyof IndividualMeta, value)}
                          isCurrency
                        />
                        <ThreeLevelInput
                          label="Reuniões"
                          icon={Calendar}
                          iconColor="text-purple-400"
                          values={{
                            minimo: meta.meta_reunioes_minimo,
                            satisfatorio: meta.meta_reunioes_satisfatorio,
                            excelente: meta.meta_reunioes_excelente,
                          }}
                          onChange={(level, value) => updateIndividualMeta('especialista', especialista.nome, `meta_reunioes_${level}` as keyof IndividualMeta, value)}
                        />
                        <ThreeLevelInput
                          label="Agendamentos"
                          icon={Target}
                          iconColor="text-yellow-400"
                          values={{
                            minimo: meta.meta_agendamentos_minimo,
                            satisfatorio: meta.meta_agendamentos_satisfatorio,
                            excelente: meta.meta_agendamentos_excelente,
                          }}
                          onChange={(level, value) => updateIndividualMeta('especialista', especialista.nome, `meta_agendamentos_${level}` as keyof IndividualMeta, value)}
                        />
                        <Button
                          onClick={() => handleSaveIndividual('especialista', especialista.nome)}
                          disabled={upsertMeta.isPending}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Metas de {especialista.nome}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
