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
      id: "TEST-001",
      nome_negocio: "Teste Fluxo n8n",
      pipeline: "Vendas",
      responsavel_id: "João Silva",
      quem_agendou: "Maria SDR",
      fonte_contato: "Google Ads",
      valor: "25000,00",
      data_inicio: "2025-01-12",
      mql: "sim",
      sql: "sim",
      reuniao_agendada: "sim",
      reuniao_realizada_check: "sim",
      venda_aprovada: "sim",
      data_venda: "2025-01-12",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "teste-janeiro"
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
