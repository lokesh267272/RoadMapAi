
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
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

    const responseData = await response.json();
    
    // Log for debugging
    console.log("Gemini API response:", JSON.stringify(responseData));
    
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
        JSON.stringify({ error: "Failed to parse flashcards from API response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(flashcardsData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-flashcards function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate flashcards" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
