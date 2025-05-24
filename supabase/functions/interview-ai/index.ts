
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, sessionId, userInput, sessionData } = await req.json()

    console.log('Interview AI action:', action)

    if (action === 'start_session') {
      // Create new interview session
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: sessionData.userId,
          interview_type: sessionData.interviewType,
          target_role: sessionData.targetRole,
          experience_level: sessionData.experienceLevel,
          company_focus: sessionData.companyFocus,
          focus_areas: sessionData.focusAreas,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      // Generate initial greeting and first question
      const prompt = `You are an experienced AI interview coach conducting a ${sessionData.interviewType} interview for a ${sessionData.targetRole} position at ${sessionData.experienceLevel} level. ${sessionData.companyFocus ? `The company focus is: ${sessionData.companyFocus}` : ''}

Focus areas: ${sessionData.focusAreas?.join(', ') || 'General interview skills'}

Start the interview with a warm, professional greeting. Then ask your first relevant question based on the role and experience level. Keep questions realistic and job-relevant.

Respond in valid JSON format only (no markdown or code blocks):
{
  "greeting": "Your professional greeting",
  "question": "Your first interview question",
  "questionType": "technical",
  "questionCategory": "relevant category",
  "difficulty": "medium"
}`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      })

      const geminiData = await response.json()
      console.log('Gemini raw response:', geminiData)
      
      let aiResponseText = geminiData.candidates[0].content.parts[0].text
      
      // Clean up the response text by removing markdown code blocks if present
      aiResponseText = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      console.log('Cleaned AI response:', aiResponseText)
      
      const aiResponse = JSON.parse(aiResponseText)

      // Store the first question
      const { data: question } = await supabase
        .from('interview_questions')
        .insert({
          session_id: session.id,
          question_text: aiResponse.question,
          question_type: aiResponse.questionType,
          question_category: aiResponse.questionCategory,
          difficulty_level: aiResponse.difficulty,
          question_index: 0,
          asked_at: new Date().toISOString()
        })
        .select()
        .single()

      return new Response(JSON.stringify({
        sessionId: session.id,
        greeting: aiResponse.greeting,
        question: aiResponse.question,
        questionId: question.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'submit_answer') {
      // Get current question and session details
      const { data: session } = await supabase
        .from('interview_sessions')
        .select('*, interview_questions(*)')
        .eq('id', sessionId)
        .single()

      const currentQuestion = session.interview_questions.find(q => q.question_index === session.current_question_index)

      // Analyze the user's response with Gemini
      const analysisPrompt = `You are an expert interview coach. Analyze this candidate's response to the interview question.

Question: "${currentQuestion.question_text}"
Candidate's Answer: "${userInput}"

Interview Context:
- Role: ${session.target_role}
- Type: ${session.interview_type}
- Experience Level: ${session.experience_level}

Provide detailed feedback in valid JSON format only (no markdown or code blocks):
{
  "score": 4.2,
  "feedback": {
    "strengths": ["specific strength 1", "specific strength 2"],
    "improvements": ["specific improvement 1", "specific improvement 2"],
    "communication": {
      "clarity": 4.0,
      "structure": 3.5,
      "confidence": 4.0
    },
    "content": {
      "relevance": 4.0,
      "completeness": 3.8,
      "examples": 3.5
    }
  },
  "improvedAnswer": "Here's how you could enhance your response: [provide specific improved version]",
  "nextQuestion": "Your next relevant interview question",
  "nextQuestionType": "behavioral",
  "nextQuestionCategory": "relevant category"
}`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2000,
          }
        })
      })

      const geminiData = await response.json()
      let analysisText = geminiData.candidates[0].content.parts[0].text
      
      // Clean up the response text
      analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      
      const analysis = JSON.parse(analysisText)

      // Store the user's response and feedback
      await supabase
        .from('interview_responses')
        .insert({
          session_id: sessionId,
          question_id: currentQuestion.id,
          user_response: userInput,
          response_score: analysis.score,
          feedback: analysis.feedback,
          communication_metrics: analysis.feedback.communication,
          content_analysis: analysis.feedback.content,
          improvement_suggestions: analysis.feedback.improvements,
          positive_points: analysis.feedback.strengths
        })

      // Create next question if not final
      let nextQuestion = null
      if (session.current_question_index < 4) { // Limit to 5 questions
        const { data: newQuestion } = await supabase
          .from('interview_questions')
          .insert({
            session_id: sessionId,
            question_text: analysis.nextQuestion,
            question_type: analysis.nextQuestionType,
            question_category: analysis.nextQuestionCategory,
            difficulty_level: 'medium',
            question_index: session.current_question_index + 1,
            asked_at: new Date().toISOString()
          })
          .select()
          .single()

        // Update session progress
        await supabase
          .from('interview_sessions')
          .update({ 
            current_question_index: session.current_question_index + 1,
            total_questions: session.current_question_index + 2
          })
          .eq('id', sessionId)

        nextQuestion = {
          id: newQuestion.id,
          text: analysis.nextQuestion
        }
      } else {
        // Complete the session
        const overallScore = analysis.score // Could calculate average across all responses
        await supabase
          .from('interview_sessions')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            overall_score: overallScore,
            session_feedback: { summary: 'Interview completed successfully' }
          })
          .eq('id', sessionId)
      }

      return new Response(JSON.stringify({
        score: analysis.score,
        feedback: analysis.feedback,
        improvedAnswer: analysis.improvedAnswer,
        nextQuestion: nextQuestion,
        isComplete: session.current_question_index >= 4
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'get_session_history') {
      const { data: sessions } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          interview_questions(*),
          interview_responses(*)
        `)
        .eq('user_id', sessionData.userId)
        .order('created_at', { ascending: false })

      return new Response(JSON.stringify({ sessions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Interview AI error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
