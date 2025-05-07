
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicId, topicTitle } = await req.json();
    
    if (!topicTitle) {
      throw new Error("Missing topic title");
    }

    if (!GEMINI_API_KEY) {
      throw new Error("Missing Gemini API key");
    }

    // Prepare the response for streaming
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // Start generating content using Gemini API with streaming
    generateStreamingContentWithGemini(topicTitle, writer, encoder);

    return new Response(responseStream.readable, { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    console.error("Error in generate-tutor-content:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateStreamingContentWithGemini(
  topicTitle: string, 
  writer: WritableStreamDefaultWriter<Uint8Array>, 
  encoder: TextEncoder
) {
  try {
    const prompt = `
      You are an expert tutor helping learners understand the topic: "${topicTitle}".

      Please generate a concise and structured tutorial. Follow these rules:

      1. If the topic is **technical (e.g., programming, math)**:
         - Include clear explanations of core concepts.
         - Use relevant code examples (if applicable).
         - DO NOT use tables for any purpose.
         - Keep the response under 1000 words.

      2. If the topic is **non-technical (e.g., soft skills, history, goals)**:
         - Focus on practical insights and conceptual clarity.
         - Avoid code and DO NOT use tables.
         - Prefer bullet points and short paragraphs.
         - Keep it under 700 words.

      End your response with a short summary of key takeaways.
      
      Format your response in Markdown with proper headings and code blocks with language specification. 
      DO NOT INCLUDE ANY TABLES IN THE OUTPUT.
      The content should be educational, accurate, and engaging for someone learning this topic.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    let fullContent = "";
    
    // Read from the stream and process the chunks
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Decode the chunk
      const chunk = new TextDecoder().decode(value);
      
      try {
        // Parse each line as a separate JSON object
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.includes('"text":')) {
            try {
              const jsonData = JSON.parse(line);
              const textContent = jsonData.candidates?.[0]?.content?.parts?.[0]?.text;
              
              if (textContent) {
                fullContent += textContent;
                
                // Write the text content to the response stream
                await writer.write(encoder.encode(`data: ${JSON.stringify({ content: textContent })}\n\n`));
              }
            } catch (e) {
              console.error("Error parsing JSON line:", e);
            }
          }
        }
      } catch (parseError) {
        console.error("Error processing chunk:", parseError);
      }
    }
    
    // Send the end of stream message
    await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, fullContent })}\n\n`));
  } catch (error) {
    console.error("Error generating streaming content with Gemini:", error);
    
    // Send error message to the stream
    await writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
  } finally {
    try {
      await writer.close();
    } catch (e) {
      console.error("Error closing writer:", e);
    }
  }
}
