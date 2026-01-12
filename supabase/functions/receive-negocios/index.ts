import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Convert "sim" (or variations) to boolean true, anything else to false
function parseBooleanField(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return normalized === 'sim' || normalized === 's' || normalized === 'yes' || normalized === 'true' || normalized === '1';
}

// Parse numeric value, handling Brazilian format (comma as decimal separator)
function parseNumericField(value: string | null | undefined): number {
  if (!value) return 0;
  // Trim whitespace first, then replace comma with dot for decimal
  const trimmed = String(value).trim();
  const normalized = trimmed.replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(normalized);
  console.log(`parseNumericField: input="${value}" -> trimmed="${trimmed}" -> normalized="${normalized}" -> parsed=${parsed}`);
  return isNaN(parsed) ? 0 : parsed;
}

// Parse date field
function parseDateField(value: string | null | undefined): string | null {
  if (!value) return null;
  // Try to parse the date - accept various formats
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch {
    return null;
  }
}

// Extract password from Basic Auth header
function extractBasicAuthPassword(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }
  try {
    const base64Credentials = authHeader.substring(6);
    const credentials = atob(base64Credentials);
    // Format is "username:password" - we only care about the password
    const colonIndex = credentials.indexOf(':');
    if (colonIndex === -1) return null;
    return credentials.substring(colonIndex + 1);
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API Key - support both x-api-key header and Basic Auth
    const apiKeyHeader = req.headers.get('x-api-key');
    const authHeader = req.headers.get('authorization');
    const basicAuthPassword = extractBasicAuthPassword(authHeader);
    
    // Use x-api-key if provided, otherwise try Basic Auth password
    const providedKey = apiKeyHeader || basicAuthPassword;
    const expectedApiKey = Deno.env.get('N8N_WEBHOOK_API_KEY');

    if (!expectedApiKey) {
      console.error('N8N_WEBHOOK_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!providedKey || providedKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authentication successful via', apiKeyHeader ? 'x-api-key header' : 'Basic Auth');

    // Get data from query parameters (as shown in user's n8n URL)
    const url = new URL(req.url);
    const params = url.searchParams;

    // Also support POST body for more complex integrations
    let bodyData: Record<string, string> = {};
    if (req.method === 'POST') {
      try {
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          bodyData = await req.json();
          console.log('Raw body data received:', JSON.stringify(bodyData, null, 2));
        }
      } catch (e) {
        console.error('Error parsing body:', e);
      }
    }
    
    // Log query params
    const queryParams: Record<string, string> = {};
    params.forEach((value, key) => { queryParams[key] = value; });
    if (Object.keys(queryParams).length > 0) {
      console.log('Query params received:', JSON.stringify(queryParams, null, 2));
    }

    // Helper to get value from query params or body
    const getValue = (key: string): string | null => {
      return params.get(key) || bodyData[key] || null;
    };

    // Map incoming fields to staging_negocios table
    // For MQL, SQL, Reunião, Venda - these come as dates, set boolean to true if date exists
    const dataMql = parseDateField(getValue('mql')) || parseDateField(getValue('data_mql'));
    const dataSql = parseDateField(getValue('sql')) || parseDateField(getValue('data_sql'));
    const dataAgendamento = parseDateField(getValue('reuniao_agendada')) || parseDateField(getValue('data_agendamento'));
    const dataReuniaoRealizada = parseDateField(getValue('reuniao_realizada_check')) || parseDateField(getValue('data_reuniao_realizada'));
    const dataVenda = parseDateField(getValue('venda_aprovada')) || parseDateField(getValue('data_venda'));
    const dataNoshow = parseDateField(getValue('no_show')) || parseDateField(getValue('data_noshow'));

    const stagingRecord = {
      // Core business fields
      crm_id: getValue('id'),
      nome: getValue('nome_negocio') || getValue('criado_crm'),
      pipeline: getValue('pipeline'),
      vendedor: getValue('responsavel_id'),
      sdr: getValue('quem_agendou'),
      contato_fonte: getValue('fonte_contato'),
      lead_fonte: getValue('lead_qlf'),
      data_inicio: parseDateField(getValue('data_inicio')),
      total: parseNumericField(getValue('valor')),
      custo: parseNumericField(getValue('custo')) || parseNumericField(getValue('custo_total')),
      tipo_venda: getValue('tipo_venda') || getValue('venda_tipo_realizada'),
      motivo_perda: getValue('motivo_perda'),
      fase: getValue('fase'),
      quem_vendeu: getValue('quem_vendeu'),
      responsavel_reuniao: getValue('responsavel_reuniao'),
      info_etapa: getValue('info_etapa'),
      
      // Boolean fields - set to true if corresponding date exists
      mql: !!dataMql,
      sql_qualificado: !!dataSql,
      reuniao_agendada: !!dataAgendamento,
      reuniao_realizada: !!dataReuniaoRealizada,
      no_show: !!dataNoshow,
      venda_aprovada: !!dataVenda,
      
      // Date fields
      data_mql: dataMql,
      data_sql: dataSql,
      data_agendamento: dataAgendamento,
      data_reuniao_realizada: dataReuniaoRealizada,
      data_venda: dataVenda,
      data_noshow: dataNoshow,
      data_prevista: parseDateField(getValue('data_prevista')),
      primeiro_contato: parseDateField(getValue('primeiro_contato')),
      data_movimentacao: parseDateField(getValue('data_movimentacao')),
      
      // UTM fields
      utm_source: getValue('utm_source'),
      utm_medium: getValue('utm_medium'),
      utm_campaign: getValue('utm_campaign'),
      utm_content: getValue('utm_content'),
      utm_term: getValue('utm_term'),
      
      // Metadata
      source: 'n8n',
      batch_id: crypto.randomUUID(),
    };

    console.log('Received data from n8n:', JSON.stringify(stagingRecord, null, 2));

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if record with this crm_id already exists
    const crmId = stagingRecord.crm_id;
    let existingRecord = null;
    
    if (crmId) {
      const { data: existing } = await supabase
        .from('staging_negocios')
        .select('id, status')
        .eq('crm_id', crmId)
        .maybeSingle();
      existingRecord = existing;
    }

    let data;
    let error;
    let isUpdate = false;

    if (existingRecord) {
      // Update existing record - preserve status if already approved/rejected
      isUpdate = true;
      console.log(`Found existing record with crm_id ${crmId}, updating...`);
      
      const updateData = {
        ...stagingRecord,
        // Keep status as 'pendente' on update so it can be re-reviewed
        status: 'pendente',
        updated_at: new Date().toISOString(),
      };
      
      const result = await supabase
        .from('staging_negocios')
        .update(updateData)
        .eq('crm_id', crmId)
        .select('id, batch_id')
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      const insertData = {
        ...stagingRecord,
        status: 'pendente',
      };
      
      const result = await supabase
        .from('staging_negocios')
        .insert(insertData)
        .select('id, batch_id')
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error saving to staging_negocios:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save data', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully ${isUpdate ? 'updated' : 'inserted'} staging record:`, data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isUpdate ? 'Data updated successfully' : 'Data received and queued for review',
        operation: isUpdate ? 'update' : 'insert',
        id: data?.id,
        batch_id: data?.batch_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in receive-negocios:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
