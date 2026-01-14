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

// Parse date field - supports Brazilian DD/MM/YYYY format
function parseDateField(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  
  // Detect Brazilian format DD/MM/YYYY
  const brDateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDateMatch) {
    const [, day, month, year] = brDateMatch;
    const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log(`parseDateField: "${value}" (BR format) -> "${result}"`);
    return result;
  }
  
  // Try other formats as fallback
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      console.log(`parseDateField: "${value}" -> null (invalid date)`);
      return null;
    }
    const result = date.toISOString().split('T')[0];
    console.log(`parseDateField: "${value}" -> "${result}"`);
    return result;
  } catch {
    console.log(`parseDateField: "${value}" -> null (parse error)`);
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

    // Helper to get value from query params or body (case-insensitive for body)
    const getValue = (key: string): string | null => {
      // First try exact match from query params
      const queryValue = params.get(key);
      if (queryValue) return queryValue;
      
      // For body, try exact match first, then case-insensitive
      if (bodyData[key]) return bodyData[key];
      
      // Case-insensitive search in body
      const lowerKey = key.toLowerCase();
      for (const [k, v] of Object.entries(bodyData)) {
        if (k.toLowerCase() === lowerKey) return v;
      }
      
      return null;
    };

    // Map incoming fields to staging_negocios table
    // Field mappings from n8n:
    // valor -> total, data_venda, data_sql, data_mql, data_reuniao -> data_reuniao_realizada
    // responsavel_reuniao, venda_realizada -> quem_vendeu, primeiro_lead -> primeiro_contato
    // data_agendamento, responsavel_agendamento -> sdr, fonte -> lead_fonte
    // fase, fechado -> venda_aprovada, pipeline, nome, id -> crm_id
    
    const dataMql = parseDateField(getValue('data_mql'));
    const dataSql = parseDateField(getValue('data_sql'));
    const dataAgendamento = parseDateField(getValue('data_agendamento'));
    // Support both "data_reuniao" and "data_reunião" (with accent)
    const dataReuniaoRealizada = parseDateField(getValue('data_reuniao') || getValue('data_reunião'));
    const dataVenda = parseDateField(getValue('data_venda'));
    
    console.log('Date parsing summary:', {
      data_mql: { raw: getValue('data_mql'), parsed: dataMql },
      data_sql: { raw: getValue('data_sql'), parsed: dataSql },
      data_agendamento: { raw: getValue('data_agendamento'), parsed: dataAgendamento },
      data_reuniao: { raw: getValue('data_reuniao') || getValue('data_reunião'), parsed: dataReuniaoRealizada },
      data_venda: { raw: getValue('data_venda'), parsed: dataVenda },
    });
    const dataNoshow = parseDateField(getValue('data_noshow'));
    const primeiroContato = parseDateField(getValue('primeiro_lead'));
    
    // Parse fechado as boolean for venda_aprovada
    const fechadoValue = getValue('fechado');
    const vendaAprovada = fechadoValue ? parseBooleanField(fechadoValue) : !!dataVenda;

    // Handle crm_id - convert empty string to null to avoid unique constraint violations
    const rawCrmId = getValue('id');
    const crmId = rawCrmId && rawCrmId.trim() !== '' ? rawCrmId.trim() : null;
    
    console.log(`crm_id processing: raw="${rawCrmId}" -> final="${crmId}"`);

    const stagingRecord = {
      // Core business fields
      crm_id: crmId,
      nome: getValue('nome'),
      pipeline: getValue('pipeline'),
      vendedor: getValue('responsavel_id') || getValue('venda_realizada') || getValue('quem_vendeu'),
      sdr: getValue('responsavel_agendamento') || getValue('quem_agendou'),
      contato_fonte: getValue('fonte_contato') || getValue('fonte'),
      lead_fonte: getValue('fonte') || getValue('lead_qlf'),
      data_inicio: parseDateField(getValue('data_inicio')),
      total: parseNumericField(getValue('valor')),
      custo: parseNumericField(getValue('custo')) || parseNumericField(getValue('custo_total')),
      tipo_venda: getValue('tipo_venda') || getValue('venda_tipo_realizada'),
      motivo_perda: getValue('motivo_perda'),
      fase: getValue('fase'),
      quem_vendeu: getValue('venda_realizada') || getValue('quem_vendeu'),
      responsavel_reuniao: getValue('responsavel_reuniao'),
      info_etapa: getValue('info_etapa'),
      
      // Boolean fields - set to true if corresponding date exists
      mql: !!dataMql,
      sql_qualificado: !!dataSql,
      reuniao_agendada: !!dataAgendamento,
      reuniao_realizada: !!dataReuniaoRealizada,
      no_show: !!dataNoshow,
      venda_aprovada: vendaAprovada,
      
      // Date fields
      data_mql: dataMql,
      data_sql: dataSql,
      data_agendamento: dataAgendamento,
      data_reuniao_realizada: dataReuniaoRealizada,
      data_venda: dataVenda,
      data_noshow: dataNoshow,
      data_prevista: parseDateField(getValue('data_prevista')),
      primeiro_contato: primeiroContato,
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

    // Check if record with this crm_id already exists (only if crm_id is not null)
    // When crm_id is null, always insert as a new record
    let existingRecord = null;
    
    if (crmId) {
      const { data: existing } = await supabase
        .from('staging_negocios')
        .select('id, status')
        .eq('crm_id', crmId)
        .maybeSingle();
      existingRecord = existing;
      console.log(`Checking existing record for crm_id="${crmId}": ${existing ? 'found' : 'not found'}`);
    } else {
      console.log('crm_id is null, will insert as new record');
    }

    let data;
    let error;
    let isUpdate = false;

    if (existingRecord) {
      // Update existing record - ONLY update fields that have values (partial update)
      isUpdate = true;
      console.log(`Found existing record with crm_id ${crmId}, performing partial update...`);
      
      // Filter out empty/null/zero fields to preserve existing values
      const updateData: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(stagingRecord)) {
        // Always include these metadata fields
        if (key === 'source' || key === 'batch_id') {
          updateData[key] = value;
          continue;
        }
        
        // Skip null/undefined values
        if (value === null || value === undefined) continue;
        
        // For numbers: skip if 0 (means not provided)
        if (typeof value === 'number' && value === 0) continue;
        
        // For strings: skip if empty
        if (typeof value === 'string' && value.trim() === '') continue;
        
        // For booleans: only include if corresponding date exists
        // This prevents false from overwriting true when date is not sent
        if (typeof value === 'boolean') {
          // Map boolean fields to their corresponding date fields
          const boolDateMap: Record<string, string> = {
            mql: 'data_mql',
            sql_qualificado: 'data_sql',
            reuniao_agendada: 'data_agendamento',
            reuniao_realizada: 'data_reuniao_realizada',
            no_show: 'data_noshow',
            venda_aprovada: 'data_venda',
          };
          
          const dateField = boolDateMap[key];
          if (dateField) {
            // Only update boolean if the corresponding date was provided
            const dateValue = stagingRecord[dateField as keyof typeof stagingRecord];
            if (!dateValue) continue;
          }
        }
        
        updateData[key] = value;
      }
      
      // Always set these
      updateData.status = 'pendente';
      updateData.updated_at = new Date().toISOString();
      
      console.log('Partial update data:', JSON.stringify(updateData, null, 2));
      
      const result = await supabase
        .from('staging_negocios')
        .update(updateData)
        .eq('crm_id', crmId)
        .select('id, batch_id')
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Insert new record with all fields
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
