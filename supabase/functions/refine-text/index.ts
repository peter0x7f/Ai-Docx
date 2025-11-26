import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { selectedText, prompt, documentSummary, fullDocument } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Refining text with prompt:', prompt);
    console.log('Selected text length:', selectedText.length);

    // First, do web research on the topic
    const researchPrompt = `Based on this text: "${selectedText}", research and provide recent, relevant information that could enhance it. Context from document: ${documentSummary}`;

    const researchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Provide factual, relevant information that can be used to enhance academic or professional writing. Focus on recent developments and authoritative sources.',
          },
          {
            role: 'user',
            content: researchPrompt,
          },
        ],
      }),
    });

    if (!researchResponse.ok) {
      const errorText = await researchResponse.text();
      console.error('Research API error:', researchResponse.status, errorText);
      throw new Error(`Research failed: ${researchResponse.status}`);
    }

    const researchData = await researchResponse.json();
    const researchFindings = researchData.choices[0].message.content;

    console.log('Research findings obtained, length:', researchFindings.length);

    // Now refine the text with the research
    const refinementPrompt = `
Original text: "${selectedText}"

Research findings: ${researchFindings}

User instructions: ${prompt}

Document context: ${documentSummary}

Task: Refine the original text according to the user's instructions, incorporating relevant research findings. Maintain the original intent while improving clarity, accuracy, and depth. Return ONLY the refined text without any preamble or explanation.`;

    const refinementResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert editor and writer. Refine text according to instructions while incorporating research findings. Always maintain the original meaning and context.',
          },
          {
            role: 'user',
            content: refinementPrompt,
          },
        ],
      }),
    });

    if (!refinementResponse.ok) {
      const errorText = await refinementResponse.text();
      console.error('Refinement API error:', refinementResponse.status, errorText);
      throw new Error(`Refinement failed: ${refinementResponse.status}`);
    }

    const refinementData = await refinementResponse.json();
    const refinedText = refinementData.choices[0].message.content;

    console.log('Text refinement complete');

    return new Response(
      JSON.stringify({ 
        refinedText,
        researchFindings,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in refine-text function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
