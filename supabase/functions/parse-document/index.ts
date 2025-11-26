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
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Processing file:', file.name, 'Type:', file.type);

    let content = '';

    // Handle different file types
    if (file.type === 'text/plain') {
      content = await file.text();
    } else if (file.type === 'application/pdf' || 
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For PDF and DOCX, we'd ideally use a parsing library
      // For now, return a placeholder that indicates the file type
      content = `[${file.type.includes('pdf') ? 'PDF' : 'DOCX'} Document - ${file.name}]\n\nDocument content would be extracted here. For this demo, please use TXT files for full functionality, or the parsed content will be available once document parsing libraries are integrated.`;
    } else {
      throw new Error('Unsupported file type');
    }

    // Generate a simple summary (first 200 characters)
    const summary = content.slice(0, 200) + (content.length > 200 ? '...' : '');

    console.log('Document parsed successfully, length:', content.length);

    return new Response(
      JSON.stringify({ 
        content,
        summary,
        fileName: file.name,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error parsing document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to parse document' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
