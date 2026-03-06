import { useState, useEffect, useRef } from 'react';
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
import { getCurrentMonthBrazil, getCurrentYearBrazil } from '@/lib/dateUtils';

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
  meta_margem_minimo: number;
  meta_margem_satisfatorio: number;
  meta_margem_excelente: number;
  meta_media_closer_minimo: number;
  meta_media_closer_satisfatorio: number;
  meta_media_closer_excelente: number;
  meta_indicacoes_minimo: number;
  meta_indicacoes_satisfatorio: number;
  meta_indicacoes_excelente: number;
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
  meta_conversao_minimo: number;
  meta_conversao_satisfatorio: number;
  meta_conversao_excelente: number;
  meta_margem_minimo: number;
  meta_margem_satisfatorio: number;
  meta_margem_excelente: number;
  meta_media_closer_minimo: number;
  meta_media_closer_satisfatorio: number;
  meta_media_closer_excelente: number;
}

const defaultGlobalMeta: GlobalMeta = {
  meta_faturamento_minimo: 0,
  meta_faturamento_satisfatorio: 0,
  meta_faturamento_excelente: 0,
  meta_conversao_minimo: 0,
  meta_conversao_satisfatorio: 0,
  meta_conversao_excelente: 0,
  meta_margem_minimo: 0,
  meta_margem_satisfatorio: 0,
  meta_margem_excelente: 0,
  meta_media_closer_minimo: 0,
  meta_media_closer_satisfatorio: 0,
  meta_media_closer_excelente: 0,
  meta_indicacoes_minimo: 0,
  meta_indicacoes_satisfatorio: 0,
  meta_indicacoes_excelente: 0,
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
  meta_conversao_minimo: 0,
  meta_conversao_satisfatorio: 0,
  meta_conversao_excelente: 0,
  meta_margem_minimo: 0,
  meta_margem_satisfatorio: 0,
  meta_margem_excelente: 0,
  meta_media_closer_minimo: 0,
  meta_media_closer_satisfatorio: 0,
  meta_media_closer_excelente: 0,
};

export default function MetasPage() {
  // Use Brazil timezone for consistent date handling
  const [selectedMes, setSelectedMes] = useState(getCurrentMonthBrazil());
  const [selectedAno, setSelectedAno] = useState(getCurrentYearBrazil());

  const { data: metas, isLoading: loadingMetas } = useMetas(selectedMes, selectedAno);
  const { data: sdrs, isLoading: loadingSDRs } = useColaboradores('sdr');
  const { data: especialistas, isLoading: loadingEspecialistas } = useColaboradores('especialista');
  const upsertMeta = useUpsertMeta();

  const [globalMeta, setGlobalMeta] = useState<GlobalMeta>(defaultGlobalMeta);
  const [sdrMeta, setSdrMeta] = useState<IndividualMeta>(defaultIndividualMeta);
  const [especialistaMeta, setEspecialistaMeta] = useState<IndividualMeta>(defaultIndividualMeta);

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
        meta_margem_minimo: global.meta_margem_minimo || 0,
        meta_margem_satisfatorio: global.meta_margem_satisfatorio || 0,
        meta_margem_excelente: global.meta_margem_excelente || 0,
        meta_media_closer_minimo: global.meta_media_closer_minimo || 0,
        meta_media_closer_satisfatorio: global.meta_media_closer_satisfatorio || 0,
        meta_media_closer_excelente: global.meta_media_closer_excelente || 0,
        meta_indicacoes_minimo: global.meta_indicacoes_minimo || 0,
        meta_indicacoes_satisfatorio: global.meta_indicacoes_satisfatorio || 0,
        meta_indicacoes_excelente: global.meta_indicacoes_excelente || 0,
        meta_reunioes: global.meta_reunioes || 0,
        meta_agendamentos: global.meta_agendamentos || 0,
      });
    } else {
      setGlobalMeta(defaultGlobalMeta);
    }

    const sdrRecord = metas.find(m => m.tipo === 'sdr' && !m.responsavel);
    if (sdrRecord) {
      setSdrMeta({
        meta_faturamento_minimo: sdrRecord.meta_faturamento_minimo || 0,
        meta_faturamento_satisfatorio: sdrRecord.meta_faturamento_satisfatorio || 0,
        meta_faturamento_excelente: sdrRecord.meta_faturamento_excelente || 0,
        meta_reunioes_minimo: sdrRecord.meta_reunioes_minimo || 0,
        meta_reunioes_satisfatorio: sdrRecord.meta_reunioes_satisfatorio || 0,
        meta_reunioes_excelente: sdrRecord.meta_reunioes_excelente || 0,
        meta_agendamentos_minimo: sdrRecord.meta_agendamentos_minimo || 0,
        meta_agendamentos_satisfatorio: sdrRecord.meta_agendamentos_satisfatorio || 0,
        meta_agendamentos_excelente: sdrRecord.meta_agendamentos_excelente || 0,
        meta_conversao_minimo: sdrRecord.meta_conversao_minimo || 0,
        meta_conversao_satisfatorio: sdrRecord.meta_conversao_satisfatorio || 0,
        meta_conversao_excelente: sdrRecord.meta_conversao_excelente || 0,
        meta_margem_minimo: sdrRecord.meta_margem_minimo || 0,
        meta_margem_satisfatorio: sdrRecord.meta_margem_satisfatorio || 0,
        meta_margem_excelente: sdrRecord.meta_margem_excelente || 0,
        meta_media_closer_minimo: sdrRecord.meta_media_closer_minimo || 0,
        meta_media_closer_satisfatorio: sdrRecord.meta_media_closer_satisfatorio || 0,
        meta_media_closer_excelente: sdrRecord.meta_media_closer_excelente || 0,
      });
    } else {
      setSdrMeta(defaultIndividualMeta);
    }

    const espRecord = metas.find(m => m.tipo === 'especialista' && !m.responsavel);
    if (espRecord) {
      setEspecialistaMeta({
        meta_faturamento_minimo: espRecord.meta_faturamento_minimo || 0,
        meta_faturamento_satisfatorio: espRecord.meta_faturamento_satisfatorio || 0,
        meta_faturamento_excelente: espRecord.meta_faturamento_excelente || 0,
        meta_reunioes_minimo: espRecord.meta_reunioes_minimo || 0,
        meta_reunioes_satisfatorio: espRecord.meta_reunioes_satisfatorio || 0,
        meta_reunioes_excelente: espRecord.meta_reunioes_excelente || 0,
        meta_agendamentos_minimo: espRecord.meta_agendamentos_minimo || 0,
        meta_agendamentos_satisfatorio: espRecord.meta_agendamentos_satisfatorio || 0,
        meta_agendamentos_excelente: espRecord.meta_agendamentos_excelente || 0,
        meta_conversao_minimo: espRecord.meta_conversao_minimo || 0,
        meta_conversao_satisfatorio: espRecord.meta_conversao_satisfatorio || 0,
        meta_conversao_excelente: espRecord.meta_conversao_excelente || 0,
        meta_margem_minimo: espRecord.meta_margem_minimo || 0,
        meta_margem_satisfatorio: espRecord.meta_margem_satisfatorio || 0,
        meta_margem_excelente: espRecord.meta_margem_excelente || 0,
        meta_media_closer_minimo: espRecord.meta_media_closer_minimo || 0,
        meta_media_closer_satisfatorio: espRecord.meta_media_closer_satisfatorio || 0,
        meta_media_closer_excelente: espRecord.meta_media_closer_excelente || 0,
      });
    } else {
      setEspecialistaMeta(defaultIndividualMeta);
    }
  }, [metas]);

  const handleSaveGlobal = async () => {
    await upsertMeta.mutateAsync({
      tipo: 'global',
      mes: selectedMes,
      ano: selectedAno,
      ...globalMeta,
    });
  };

  const handleSaveSDR = async () => {
    await upsertMeta.mutateAsync({
      tipo: 'sdr',
      responsavel: null,
      mes: selectedMes,
      ano: selectedAno,
      ...sdrMeta,
    });
  };

  const handleSaveEspecialista = async () => {
    await upsertMeta.mutateAsync({
      tipo: 'especialista',
      responsavel: null,
      mes: selectedMes,
      ano: selectedAno,
      ...especialistaMeta,
    });
  };

  const updateSdrMeta = (field: keyof IndividualMeta, value: number) => {
    setSdrMeta(prev => ({ ...prev, [field]: value }));
  };

  const updateEspecialistaMeta = (field: keyof IndividualMeta, value: number) => {
    setEspecialistaMeta(prev => ({ ...prev, [field]: value }));
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

  const NumericInput = ({ value, onCommit, isCurrency, ...props }: { value: number; onCommit: (v: number) => void; isCurrency?: boolean } & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur' | 'type'>) => {
    const [localValue, setLocalValue] = useState(value ? String(value) : '');
    const committedRef = useRef(value);

    useEffect(() => {
      if (value !== committedRef.current) {
        committedRef.current = value;
        setLocalValue(value ? String(value) : '');
      }
    }, [value]);

    return (
      <Input
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          const parsed = isCurrency ? parseFloat(localValue) || 0 : parseInt(localValue) || 0;
          committedRef.current = parsed;
          onCommit(parsed);
          setLocalValue(parsed ? String(parsed) : '');
        }}
        {...props}
      />
    );
  };

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
          <NumericInput
            value={values.minimo}
            onCommit={(v) => onChange('minimo', v)}
            isCurrency={isCurrency}
            placeholder="0"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-yellow-400">Satisfatório</Label>
          <NumericInput
            value={values.satisfatorio}
            onCommit={(v) => onChange('satisfatorio', v)}
            isCurrency={isCurrency}
            placeholder="0"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-green-400">Excelente</Label>
          <NumericInput
            value={values.excelente}
            onCommit={(v) => onChange('excelente', v)}
            isCurrency={isCurrency}
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

        <Tabs defaultValue="sdrs" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
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

                {/* Margem Global - 3 levels */}
                <ThreeLevelInput
                  label="Margem Global (%)"
                  icon={TrendingUp}
                  iconColor="text-orange-400"
                  values={{
                    minimo: globalMeta.meta_margem_minimo,
                    satisfatorio: globalMeta.meta_margem_satisfatorio,
                    excelente: globalMeta.meta_margem_excelente,
                  }}
                  onChange={(level, value) => setGlobalMeta(prev => ({ ...prev, [`meta_margem_${level}`]: value }))}
                  isPercent
                />

                {/* Média por Closer - 3 levels */}
                <ThreeLevelInput
                  label="Média por Closer (R$)"
                  icon={DollarSign}
                  iconColor="text-pink-400"
                  values={{
                    minimo: globalMeta.meta_media_closer_minimo,
                    satisfatorio: globalMeta.meta_media_closer_satisfatorio,
                    excelente: globalMeta.meta_media_closer_excelente,
                  }}
                  onChange={(level, value) => setGlobalMeta(prev => ({ ...prev, [`meta_media_closer_${level}`]: value }))}
                  isCurrency
                />

                {/* Indicações por Especialista - 3 levels */}
                <ThreeLevelInput
                  label="Indicações por Especialista"
                  icon={Users}
                  iconColor="text-indigo-400"
                  values={{
                    minimo: globalMeta.meta_indicacoes_minimo,
                    satisfatorio: globalMeta.meta_indicacoes_satisfatorio,
                    excelente: globalMeta.meta_indicacoes_excelente,
                  }}
                  onChange={(level, value) => setGlobalMeta(prev => ({ ...prev, [`meta_indicacoes_${level}`]: value }))}
                />

                {/* Reuniões e Agendamentos - single value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      Meta Reuniões
                    </Label>
                    <NumericInput
                      value={globalMeta.meta_reunioes}
                      onCommit={(v) => setGlobalMeta(prev => ({ ...prev, meta_reunioes: v }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-yellow-400" />
                      Meta Agendamentos
                    </Label>
                    <NumericInput
                      value={globalMeta.meta_agendamentos}
                      onCommit={(v) => setGlobalMeta(prev => ({ ...prev, meta_agendamentos: v }))}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Meta SDRs - {meses.find(m => m.value === selectedMes)?.label} {selectedAno}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ThreeLevelInput
                  label="Receita Originada (R$)"
                  icon={DollarSign}
                  iconColor="text-cyan-400"
                  values={{
                    minimo: sdrMeta.meta_faturamento_minimo,
                    satisfatorio: sdrMeta.meta_faturamento_satisfatorio,
                    excelente: sdrMeta.meta_faturamento_excelente,
                  }}
                  onChange={(level, value) => updateSdrMeta(`meta_faturamento_${level}` as keyof IndividualMeta, value)}
                  isCurrency
                />
                <ThreeLevelInput
                  label="Comparecimento (%)"
                  icon={TrendingUp}
                  iconColor="text-green-400"
                  values={{
                    minimo: sdrMeta.meta_conversao_minimo,
                    satisfatorio: sdrMeta.meta_conversao_satisfatorio,
                    excelente: sdrMeta.meta_conversao_excelente,
                  }}
                  onChange={(level, value) => updateSdrMeta(`meta_conversao_${level}` as keyof IndividualMeta, value)}
                  isPercent
                />
                <ThreeLevelInput
                  label="Qualificação Lead → MQL (%)"
                  icon={TrendingUp}
                  iconColor="text-orange-400"
                  values={{
                    minimo: sdrMeta.meta_margem_minimo,
                    satisfatorio: sdrMeta.meta_margem_satisfatorio,
                    excelente: sdrMeta.meta_margem_excelente,
                  }}
                  onChange={(level, value) => updateSdrMeta(`meta_margem_${level}` as keyof IndividualMeta, value)}
                  isPercent
                />
                <ThreeLevelInput
                  label="Reuniões Realizadas"
                  icon={Calendar}
                  iconColor="text-emerald-400"
                  values={{
                    minimo: sdrMeta.meta_agendamentos_minimo,
                    satisfatorio: sdrMeta.meta_agendamentos_satisfatorio,
                    excelente: sdrMeta.meta_agendamentos_excelente,
                  }}
                  onChange={(level, value) => updateSdrMeta(`meta_agendamentos_${level}` as keyof IndividualMeta, value)}
                />
                <Button
                  onClick={handleSaveSDR}
                  disabled={upsertMeta.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Metas SDRs
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Especialistas Tab */}
          <TabsContent value="especialistas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-400" />
                  Meta Especialistas - {meses.find(m => m.value === selectedMes)?.label} {selectedAno}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ThreeLevelInput
                  label="Faturamento Global (R$)"
                  icon={DollarSign}
                  iconColor="text-cyan-400"
                  values={{
                    minimo: especialistaMeta.meta_faturamento_minimo,
                    satisfatorio: especialistaMeta.meta_faturamento_satisfatorio,
                    excelente: especialistaMeta.meta_faturamento_excelente,
                  }}
                  onChange={(level, value) => updateEspecialistaMeta(`meta_faturamento_${level}` as keyof IndividualMeta, value)}
                  isCurrency
                />
                <ThreeLevelInput
                  label="Média por Especialista (R$)"
                  icon={DollarSign}
                  iconColor="text-pink-400"
                  values={{
                    minimo: especialistaMeta.meta_media_closer_minimo,
                    satisfatorio: especialistaMeta.meta_media_closer_satisfatorio,
                    excelente: especialistaMeta.meta_media_closer_excelente,
                  }}
                  onChange={(level, value) => updateEspecialistaMeta(`meta_media_closer_${level}` as keyof IndividualMeta, value)}
                  isCurrency
                />
                <ThreeLevelInput
                  label="Margem Global (%)"
                  icon={TrendingUp}
                  iconColor="text-orange-400"
                  values={{
                    minimo: especialistaMeta.meta_margem_minimo,
                    satisfatorio: especialistaMeta.meta_margem_satisfatorio,
                    excelente: especialistaMeta.meta_margem_excelente,
                  }}
                  onChange={(level, value) => updateEspecialistaMeta(`meta_margem_${level}` as keyof IndividualMeta, value)}
                  isPercent
                />
                <ThreeLevelInput
                  label="Conversão MQL → Venda (%)"
                  icon={TrendingUp}
                  iconColor="text-green-400"
                  values={{
                    minimo: especialistaMeta.meta_conversao_minimo,
                    satisfatorio: especialistaMeta.meta_conversao_satisfatorio,
                    excelente: especialistaMeta.meta_conversao_excelente,
                  }}
                  onChange={(level, value) => updateEspecialistaMeta(`meta_conversao_${level}` as keyof IndividualMeta, value)}
                  isPercent
                />
                <ThreeLevelInput
                  label="Reuniões Realizadas"
                  icon={Calendar}
                  iconColor="text-purple-400"
                  values={{
                    minimo: especialistaMeta.meta_reunioes_minimo,
                    satisfatorio: especialistaMeta.meta_reunioes_satisfatorio,
                    excelente: especialistaMeta.meta_reunioes_excelente,
                  }}
                  onChange={(level, value) => updateEspecialistaMeta(`meta_reunioes_${level}` as keyof IndividualMeta, value)}
                />
                <Button
                  onClick={handleSaveEspecialista}
                  disabled={upsertMeta.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Metas Especialistas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
