
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

    // Generate content using Gemini API
    const content = await generateContentWithGemini(topicTitle);

    return new Response(
      JSON.stringify({ 
        success: true,
        content
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
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

async function generateContentWithGemini(topicTitle: string): Promise<string> {
  try {
    const prompt = `
      Create a comprehensive tutorial on "${topicTitle}" for a learning platform.
      
      Your response should include:
      1. A clear introduction to ${topicTitle}
      2. Core concepts and fundamentals
      3. Practical examples including code snippets where relevant
      4. Tables to organize information when appropriate
      5. Key takeaways and best practices
      
      Format your response in Markdown with proper headings, code blocks with language specification, and tables.
      The content should be educational, accurate, and engaging for someone learning this topic.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
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

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API error:", data);
      throw new Error(`Gemini API error: ${data.error?.message || "Unknown error"}`);
    }

    // Extract text from the response
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error("Failed to generate content");
    }

    return content;
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw error;
  }
}
