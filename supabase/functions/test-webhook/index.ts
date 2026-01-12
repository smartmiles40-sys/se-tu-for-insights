import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhook_url } = await req.json();
    
    const testData = {
      id: "CRM-2025-001",
      nome_negocio: "Teste Completo n8n",
      pipeline: "Vendas B2B",
      responsavel_id: "Carlos Vendedor",
      quem_agendou: "Ana SDR",
      fonte_contato: "Google Ads",
      lead_qlf: "Inbound Marketing",
      data_inicio: "2025-01-05",
      valor: "45000,00",
      custo: "1500,00",
      tipo_venda: "Consultoria",
      motivo_perda: "",
      fase: "Fechamento",
      quem_vendeu: "Carlos Vendedor",
      responsavel_reuniao: "Carlos Vendedor",
      info_etapa: "Proposta enviada",
      mql: "2025-01-06",
      sql: "2025-01-07",
      reuniao_agendada: "2025-01-08",
      reuniao_realizada_check: "2025-01-09",
      no_show: "",
      venda_aprovada: "2025-01-12",
      data_prevista: "2025-01-15",
      primeiro_contato: "2025-01-04",
      data_movimentacao: "2025-01-12",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "campanha-janeiro-2025",
      utm_content: "banner-principal",
      utm_term: "consultoria empresarial"
    };

    console.log("Sending test data to webhook:", webhook_url);
    
    const response = await fetch(webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    const responseText = await response.text();
    console.log("Webhook response:", response.status, responseText);

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: response.status,
        response: responseText 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
