import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Load agent configuration from YAML
async function loadAgentConfig() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/yourusername/yourrepo/main/public/agent-config.yaml');
    // For now, return hardcoded config since we can't dynamically load from repo
    // In production, you'd want to store this in Supabase or use environment variables
    return {
      research_agent: {
        system_prompt: `You are a research assistant specialized in academic and professional writing.
Provide factual, relevant, and up-to-date information from authoritative sources.
Focus on recent developments, studies, and credible references.
Be thorough but concise in your research findings.`,
        instructions: [
          'Search for recent information related to the selected text',
          'Prioritize academic sources, scientific papers, and credible publications',
          'Include statistics, facts, and expert opinions when relevant',
          'Note any contradictions or debates in the field',
          'Keep research focused and relevant to the context'
        ]
      },
      refinement_agent: {
        system_prompt: `You are an expert editor and writing assistant.
Your role is to enhance text by incorporating research findings while maintaining the author's voice and intent.
Focus on clarity, accuracy, and professional quality.`,
        instructions: [
          'Incorporate research findings naturally into the text',
          'Maintain the original structure and flow where appropriate',
          'Improve clarity and readability',
          'Add depth and supporting details from research',
          "Preserve the author's tone and style",
          'Return ONLY the refined text without explanations or preambles',
          'Keep the refined text similar in length to the original unless expansion is explicitly requested',
          'Ensure factual accuracy based on research findings'
        ]
      }
    };
  } catch (error) {
    console.error('Error loading agent config:', error);
    throw error;
  }
}

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

    // Load agent configuration
    const config = await loadAgentConfig();

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
            content: config.research_agent.system_prompt,
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

Task: Refine the original text according to the user's instructions, incorporating relevant research findings. ${config.refinement_agent.instructions.join(' ')}`;

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
            content: config.refinement_agent.system_prompt,
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
