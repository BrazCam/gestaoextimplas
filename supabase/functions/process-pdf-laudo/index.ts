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
    const { pdfBase64, mimeType, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!pdfBase64) {
      throw new Error("PDF data is required");
    }

    let systemPrompt = "";
    let userQuery = "";

    if (action === "extract_text") {
      systemPrompt = "Você é um leitor óptico de caracteres (OCR) e extrator de texto especializado em laudos de manutenção de extintores. Dada uma imagem ou documento PDF, extraia o texto de forma completa e na ordem em que aparece. Não adicione nenhum comentário ou formatação Markdown. Apenas o texto puro extraído.";
      userQuery = "Extraia todo o texto deste laudo de manutenção de extintores (PDF). Foque especialmente em tabelas com informações de cilindros, tipos de extintores, marcas e datas de teste hidrostático.";
    } else if (action === "extract_json") {
      systemPrompt = `Você é um especialista em extração de dados estruturados de laudos de manutenção de extintores. 
Analise o texto fornecido e extraia APENAS os dados de extintores em formato JSON.
Retorne APENAS um array JSON válido, sem nenhum texto adicional, explicação ou formatação markdown.
Cada objeto no array deve ter exatamente estas propriedades:
- numero_cilindro_ou_recipiente: string (o número do cilindro)
- ano_ultimo_th_ou_reteste: string (ano do último teste hidrostático ou próximo vencimento)
- tipo_extintor: string (tipo do extintor: Pó Químico ABC, CO2, Água, AP, etc)
- marca_fabricante: string (marca ou fabricante)

Se não conseguir extrair algum campo, use "Desconhecido".
IMPORTANTE: Retorne APENAS o array JSON, exemplo: [{"numero_cilindro_ou_recipiente": "123", ...}]`;
      userQuery = `Analise este texto de laudo de extintores e extraia os dados estruturados conforme solicitado:\n\n${pdfBase64}`;
    } else {
      throw new Error("Invalid action. Use 'extract_text' or 'extract_json'");
    }

    const payload: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: action === "extract_text" ? [
          { type: "text", text: userQuery },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${pdfBase64}` } }
        ] : userQuery }
      ],
    };

    console.log(`Processing ${action} request...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log(`${action} completed successfully`);

    return new Response(JSON.stringify({ 
      success: true, 
      content,
      action 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing PDF:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro ao processar PDF" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
