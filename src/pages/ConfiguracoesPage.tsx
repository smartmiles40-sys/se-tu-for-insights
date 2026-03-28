import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/hooks/useSettings';
import { Building2, Palette, Globe, Loader2, Save } from 'lucide-react';

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belém (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' },
];

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
];

export default function ConfiguracoesPage() {
  const { settings, isLoading, saveIdentity, saveAppearance, saveRegionalization } = useSettings();

  const [agencyName, setAgencyName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#c8f135');
  const [secondaryColor, setSecondaryColor] = useState('#0d2b22');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [language, setLanguage] = useState('pt-BR');

  useEffect(() => {
    if (!isLoading && settings) {
      setAgencyName(settings.agency_identity.name);
      setLogoUrl(settings.agency_identity.logo_url);
      setDarkMode(settings.appearance.dark_mode);
      setPrimaryColor(settings.appearance.primary_color);
      setSecondaryColor(settings.appearance.secondary_color);
      setTimezone(settings.regionalization.timezone);
      setLanguage(settings.regionalization.language);
    }
  }, [isLoading, settings]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando configurações...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie as preferências do painel da agência.
          </p>
        </div>

        <Tabs defaultValue="identity">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="identity" className="gap-2">
              <Building2 className="h-4 w-4" /> Identidade
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" /> Aparência
            </TabsTrigger>
            <TabsTrigger value="regionalization" className="gap-2">
              <Globe className="h-4 w-4" /> Regionalização
            </TabsTrigger>
          </TabsList>

          {/* ABA: IDENTIDADE */}
          <TabsContent value="identity">
            <Card>
              <CardHeader>
                <CardTitle>Identidade da Agência</CardTitle>
                <CardDescription>Nome e logotipo exibidos no painel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Logo da Agência</Label>
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-16 w-16 rounded-lg object-contain border bg-muted"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted">
                        <Building2 className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Cole a URL da imagem (https://...)"
                        value={logoUrl ?? ''}
                        onChange={(e) => setLogoUrl(e.target.value || null)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Cole a URL pública da imagem. Recomendado: PNG com fundo transparente.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="agency-name">Nome da Agência</Label>
                  <Input
                    id="agency-name"
                    placeholder="Ex: Se Tu For! Eu Vou Viagens"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                  />
                </div>

                <Button
                  onClick={() => saveIdentity.mutate({ name: agencyName, logo_url: logoUrl })}
                  disabled={saveIdentity.isPending}
                  className="w-full gap-2"
                >
                  {saveIdentity.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Save className="h-4 w-4" />}
                  Salvar Identidade
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: APARÊNCIA */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Modo escuro e cores do painel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Modo Escuro</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativa o tema escuro em todo o painel.
                    </p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cor Primária</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-12 rounded cursor-pointer border bg-transparent p-1"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Secundária</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 w-12 rounded cursor-pointer border bg-transparent p-1"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">PREVIEW</p>
                  <div className="flex gap-3">
                    <div
                      className="h-10 flex-1 rounded-md flex items-center justify-center text-sm font-medium"
                      style={{ backgroundColor: primaryColor, color: secondaryColor }}
                    >
                      Primária
                    </div>
                    <div
                      className="h-10 flex-1 rounded-md flex items-center justify-center text-sm font-medium"
                      style={{ backgroundColor: secondaryColor, color: primaryColor }}
                    >
                      Secundária
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => saveAppearance.mutate({
                    dark_mode: darkMode,
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                  })}
                  disabled={saveAppearance.isPending}
                  className="w-full gap-2"
                >
                  {saveAppearance.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Save className="h-4 w-4" />}
                  Salvar Aparência
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: REGIONALIZAÇÃO */}
          <TabsContent value="regionalization">
            <Card>
              <CardHeader>
                <CardTitle>Regionalização</CardTitle>
                <CardDescription>Fuso horário e idioma do painel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Afeta exibição de datas e horários no painel.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => saveRegionalization.mutate({ timezone, language })}
                  disabled={saveRegionalization.isPending}
                  className="w-full gap-2"
                >
                  {saveRegionalization.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Save className="h-4 w-4" />}
                  Salvar Regionalização
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
}
