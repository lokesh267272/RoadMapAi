
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

    // Create a transform stream for the response
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Start the async process to generate content
    generateTutorContent(topicTitle, writer, encoder);

    // Return the readable stream in the response
    return new Response(readable, {
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

async function generateTutorContent(
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

    // Make request to Gemini API with streaming enabled
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(apiUrl, {
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
      const errorText = await response.text();
      console.error("Gemini API error response:", errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is not readable");
    }

    // Process the streaming response
    const reader = response.body.getReader();
    let fullContent = "";
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value);
        let content = "";
        
        try {
          // Parse the chunk as JSON
          const parsedData = JSON.parse(chunk);
          
          if (parsedData.candidates && 
              parsedData.candidates[0] && 
              parsedData.candidates[0].content && 
              parsedData.candidates[0].content.parts) {
            
            for (const part of parsedData.candidates[0].content.parts) {
              if (part.text) {
                content += part.text;
              }
            }
            
            if (content) {
              fullContent += content;
              // Send each content chunk to the client
              await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
        } catch (parseError) {
          // Handle line-by-line parsing
          try {
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const parsedLine = JSON.parse(line);
                if (parsedLine.candidates && 
                    parsedLine.candidates[0] && 
                    parsedLine.candidates[0].content && 
                    parsedLine.candidates[0].content.parts) {
                  
                  for (const part of parsedLine.candidates[0].content.parts) {
                    if (part.text) {
                      content += part.text;
                    }
                  }
                }
              } catch (lineParseError) {
                console.log("Could not parse line as JSON:", line.slice(0, 50) + "...");
              }
            }
            
            if (content) {
              fullContent += content;
              await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          } catch (lineProcessError) {
            console.error("Error processing lines:", lineProcessError);
          }
        }
      }
      
      // Send the completion message with the full content
      await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, fullContent })}\n\n`));
    } finally {
      await writer.close();
    }
  } catch (error) {
    console.error("Error generating tutor content:", error);
    
    try {
      // Send error message to client
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
      await writer.close();
    } catch (closeError) {
      console.error("Error closing writer:", closeError);
    }
  }
}
