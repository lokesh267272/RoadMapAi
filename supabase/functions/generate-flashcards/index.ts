
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Update to use the Gemini API key that's already working in the system
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, content, userId } = await req.json();
    
    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "API key not configured",
          flashcards: [
            { term: "Sample Term 1", definition: "This is a sample flashcard. The Gemini API key is not configured." },
            { term: "Sample Term 2", definition: "Please configure the GEMINI_API_KEY in your Supabase project settings." },
            { term: "Sample Term 3", definition: "Once configured, real flashcards will be generated based on your topics." }
          ]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct the prompt for Gemini
    const prompt = `Create 5 flashcards based on the following learning topic.

Topic Title: ${topic}
Topic Content: ${content || ""}

Structure the response in this valid JSON format:
{
  "flashcards": [
    {
      "term": "The key term or concept",
      "definition": "A clear, concise explanation or definition of the term"
    },
    ...
  ]
}

Avoid markdown, do not add extra text. The flashcards should be beginner-friendly and related only to this topic.`;

    console.log("Calling Gemini API with prompt", prompt.substring(0, 100) + "...");

    // Call Gemini API - Updated to use the working model endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
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
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    
    // Log for debugging
    console.log("Gemini API response status:", response.status);
    
    // Extract the text response from Gemini
    let textResponse = "";
    if (responseData.candidates && responseData.candidates.length > 0) {
      const candidate = responseData.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        textResponse = candidate.content.parts[0].text;
      }
    }
    
    // Extract the JSON flashcards from the text
    let flashcardsData = { flashcards: [] };
    try {
      // Find the JSON part of the response using regex
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        flashcardsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    } catch (error) {
      console.error("Error parsing flashcards:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse flashcards from API response",
          flashcards: [
            { term: "Error", definition: "Failed to parse the AI response into flashcards." },
            { term: "Reason", definition: error.message || "Unknown parsing error" }
          ]
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(flashcardsData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-flashcards function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate flashcards",
        flashcards: [
          { term: "Error Occurred", definition: "An error occurred while generating flashcards." },
          { term: "Details", definition: error.message || "Unknown error" },
          { term: "Suggestion", definition: "Please try again or use a different topic." }
        ]
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
