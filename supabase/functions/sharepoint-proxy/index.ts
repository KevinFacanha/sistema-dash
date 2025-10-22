import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SHAREPOINT_URL = 'https://grupoaleimports.sharepoint.com/sites/Comercial/_layouts/15/download.aspx?SourceUrl=/sites/Comercial/Documentos%20Compartilhados/Comercial/Acompanhamento%20BI/CONTA%201%20-%20Analise%20BI%20-%20Curva%20ABC%20cpx.xlsx';

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('📥 Buscando arquivo do SharePoint...');
    
    const response = await fetch(SHAREPOINT_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`❌ Erro ao buscar do SharePoint: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar arquivo do SharePoint',
          status: response.status,
          statusText: response.statusText
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`✅ Arquivo baixado com sucesso: ${arrayBuffer.byteLength} bytes`);

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar requisição',
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});