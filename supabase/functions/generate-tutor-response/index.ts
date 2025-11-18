
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Updated CORS headers with specific allowed domains
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get("ENVIRONMENT") === "production" 
    ? "https://roadmapai.netlify.app"
    : "http://localhost:8080",
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

// Helper function to check if the origin is allowed
function getAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return corsHeaders["Access-Control-Allow-Origin"];
  
  const allowedOrigins = [
    "https://roadmapai.netlify.app",
    "https://preview--roadmapai.lovable.app", 
    "http://localhost:8080"
  ];
  
  return allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : corsHeaders["Access-Control-Allow-Origin"];
}

interface Message {
  role: string;
  content: string;
}

serve(async (req) => {
  // Set dynamic origin based on request
  const requestOrigin = req.headers.get("origin");
  const dynamicCorsHeaders = {
    ...corsHeaders,
    "Access-Control-Allow-Origin": getAllowedOrigin(requestOrigin)
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: dynamicCorsHeaders });
  }

  try {
    const { topicId, topicTitle, message, history } = await req.json();
    
    if (!topicTitle || !message) {
      throw new Error("Missing required parameters");
    }

    if (!GEMINI_API_KEY) {
      throw new Error("Missing Gemini API key");
    }

    // Generate response using Gemini API
    const response = await generateResponseWithGemini(topicTitle, message, history);

    return new Response(
      JSON.stringify({ 
        success: true,
        response
      }),
      { 
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in generate-tutor-response:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateResponseWithGemini(topicTitle: string, userMessage: string, history: Message[]): Promise<string> {
  try {
    // Format conversation history for Gemini
    const formattedHistory = history.map(msg => {
      return {
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      };
    });

    // System prompt to guide the AI's behavior
    const systemPrompt = {
      role: "model",
      parts: [{
        text: `You are an expert AI tutor specializing in "${topicTitle}". 
        Provide helpful, accurate, and educational responses to questions about this topic.
        Use Markdown formatting to structure your responses with headings, code blocks, and tables where appropriate.
        Keep explanations clear, concise, and tailored to the student's level of understanding.`
      }]
    };

    // Add system prompt at the beginning
    const messages = [systemPrompt, ...formattedHistory];

    // Add the new user message
    messages.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
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
      throw new Error("Failed to generate response");
    }

    return content;
  } catch (error) {
    console.error("Error generating response with Gemini:", error);
    throw error;
  }
}
