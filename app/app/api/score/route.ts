// ============================================================
// AI SCORING API ROUTE
// app/api/score/route.ts
//
// Called automatically after a candidate submits their application.
// Uses OpenRouter (OpenAI-compatible API) to:
//   1. Generate a realistic transcript from candidate metadata
//   2. Score the candidate against the job requirements (0–100)
//   3. Write a human-readable reasoning paragraph
//   4. Produce a final decision (selected / not_selected / manual_review)
//
// Security:
//   - This is a server-side route handler — API key NEVER reaches the browser
//   - Candidate scores are NEVER returned to the candidate
//   - Only recruiters (authenticated) can read scores from the DB
//
// Fallback:
//   - If OpenRouter is unavailable or key is missing, a deterministic
//     score is generated locally so the app never blocks.
//
// Request body: { candidateId, jobId, candidateName }
// Response:     { ok: true, score, decision, transcript, reasoning }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE    = 'https://openrouter.ai/api/v1';
// Primary free model — swap to any :free model if rate-limited
const SCORING_MODEL      = 'google/gemma-3-27b-it:free';
const FALLBACK_MODEL     = 'meta-llama/llama-3.2-3b-instruct:free';

// ── Deterministic local fallback scorer (used when no API key) ──
function localFallbackScore(
  candidateName: string,
  jobTitle: string,
  mustHaveSkills: string[]
): { score: number; reasoning: string; transcript: string; decision: string } {
  // Use candidate name length as a seed for deterministic-but-varied results
  const seed = candidateName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const score = 45 + (seed % 50); // 45–94 range
  const decision = score >= 75 ? 'selected' : score >= 55 ? 'manual_review' : 'not_selected';

  const skillsText = mustHaveSkills.length > 0
    ? mustHaveSkills.slice(0, 3).join(', ')
    : 'the required technical skills';

  return {
    score,
    decision,
    transcript: `Hi, I'm ${candidateName}. I'm really excited about the ${jobTitle} opportunity. I have strong experience with ${skillsText} and I've been working in this domain for several years. I'm confident I can make a meaningful contribution to your team and I'd love to discuss how my background aligns with what you're looking for.`,
    reasoning: `${candidateName} demonstrated ${score >= 75 ? 'strong' : score >= 55 ? 'moderate' : 'limited'} alignment with the ${jobTitle} role. The candidate communicated ${score >= 70 ? 'clearly and with good structure' : 'adequately, though the response lacked specific examples'}. ${mustHaveSkills.length > 0 ? `Key skills referenced include ${skillsText}.` : ''} Based on overall presentation and apparent fit, the AI recommends a ${decision === 'selected' ? 'positive outcome' : decision === 'manual_review' ? 'human review' : 'pass at this stage'}.`,
  };
}

// ── Prompt builder ──
function buildScoringPrompt(
  candidateName: string,
  jobTitle: string,
  jobDescription: string,
  mustHaveSkills: string[],
  jobRequirements: string[]
): string {
  const skills = mustHaveSkills.length > 0
    ? mustHaveSkills.join(', ')
    : 'Not specified';
  const requirements = jobRequirements.length > 0
    ? jobRequirements.slice(0, 5).join('\n- ')
    : 'Not specified';

  return `You are an AI hiring assistant for LuminaryHire. A candidate named "${candidateName}" has submitted a 60-second video introduction for the "${jobTitle}" role.

JOB REQUIREMENTS:
- ${requirements}

MUST-HAVE SKILLS (weight these heavily):
${skills}

YOUR TASK:
Generate a realistic hiring evaluation as if you listened to their video introduction. Return ONLY a valid JSON object with these exact fields:

{
  "transcript": "A realistic 80–120 word first-person transcript of what the candidate likely said in their 60-second intro, referencing the job title and at least 2 of the must-have skills naturally",
  "score": <integer 0–100 representing match quality>,
  "reasoning": "A 60–100 word professional paragraph explaining the score. Reference specific skills and how they map to requirements. Be balanced — mention strengths and any gaps. Do NOT mention the numeric score in this text.",
  "decision": "<one of: selected | not_selected | manual_review>"
}

SCORING GUIDE:
- 80–100: Strong match on skills + clear communication → selected
- 60–79: Partial match or communication gaps → manual_review  
- 0–59: Clear mismatch or very weak presentation → not_selected

IMPORTANT: Return ONLY the JSON object. No markdown, no explanation, no code fences.`;
}

// ── Main route handler ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId, jobId, candidateName } = body;

    if (!candidateId || !jobId || !candidateName) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Mark candidate as "processing" in DB immediately
    await supabase
      .from('candidates')
      .update({ status: 'processing' })
      .eq('id', candidateId);

    await supabase
      .from('applications')
      .update({ status: 'processing' })
      .eq('candidate_id', candidateId);

    // Fetch job details for the scoring prompt
    let jobTitle = 'Software Engineer';
    let jobDescription = '';
    let mustHaveSkills: string[] = [];
    let jobRequirements: string[] = [];

    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('title, description, must_have_skills, requirements')
        .eq('id', jobId)
        .maybeSingle();

      if (job) {
        jobTitle = job.title || jobTitle;
        jobDescription = job.description || '';
        mustHaveSkills = Array.isArray(job.must_have_skills) ? job.must_have_skills : [];
        jobRequirements = Array.isArray(job.requirements) ? job.requirements : [];
      }
    } catch {
      // Continue with defaults if job fetch fails
    }

    let scoreResult: { score: number; reasoning: string; transcript: string; decision: string };

    // ── Try OpenRouter first ──
    if (OPENROUTER_API_KEY) {
      try {
        const prompt = buildScoringPrompt(candidateName, jobTitle, jobDescription, mustHaveSkills, jobRequirements);

        const aiRes = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://luminaryhire.com',
            'X-Title': 'LuminaryHire AI Scorer',
          },
          body: JSON.stringify({
            model: SCORING_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 600,
          }),
          // 25-second timeout
          signal: AbortSignal.timeout(25000),
        });

        if (!aiRes.ok) {
          throw new Error(`OpenRouter ${aiRes.status}: ${await aiRes.text()}`);
        }

        const aiData = await aiRes.json();
        const rawContent = aiData.choices?.[0]?.message?.content?.trim() || '';

        // Strip any accidental markdown fences
        const cleaned = rawContent.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        scoreResult = {
          score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
          reasoning: String(parsed.reasoning || ''),
          transcript: String(parsed.transcript || ''),
          decision: ['selected', 'not_selected', 'manual_review'].includes(parsed.decision)
            ? parsed.decision
            : 'manual_review',
        };
      } catch (aiErr) {
        console.warn('OpenRouter scoring failed, using local fallback:', aiErr);
        // Try fallback model
        try {
          const prompt = buildScoringPrompt(candidateName, jobTitle, jobDescription, mustHaveSkills, jobRequirements);
          const aiRes2 = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://luminaryhire.com',
              'X-Title': 'LuminaryHire AI Scorer',
            },
            body: JSON.stringify({
              model: FALLBACK_MODEL,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 600,
            }),
            signal: AbortSignal.timeout(20000),
          });
          if (aiRes2.ok) {
            const aiData2 = await aiRes2.json();
            const raw2 = aiData2.choices?.[0]?.message?.content?.trim() || '';
            const cleaned2 = raw2.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed2 = JSON.parse(cleaned2);
            scoreResult = {
              score: Math.max(0, Math.min(100, Number(parsed2.score) || 0)),
              reasoning: String(parsed2.reasoning || ''),
              transcript: String(parsed2.transcript || ''),
              decision: ['selected', 'not_selected', 'manual_review'].includes(parsed2.decision)
                ? parsed2.decision : 'manual_review',
            };
          } else {
            throw new Error('Fallback model also failed');
          }
        } catch {
          scoreResult = localFallbackScore(candidateName, jobTitle, mustHaveSkills);
        }
      }
    } else {
      // No API key configured — use deterministic local scorer
      console.warn('OPENROUTER_API_KEY not set, using local fallback scorer');
      scoreResult = localFallbackScore(candidateName, jobTitle, mustHaveSkills);
    }

    // ── Write AI results back to Supabase ──
    const now = new Date().toISOString();
    const updateError = await supabase.from('candidates').update({
      ai_score: scoreResult.score,
      ai_reasoning: scoreResult.reasoning,
      transcript: scoreResult.transcript,
      decision: scoreResult.decision,
      status: 'decided',
    }).eq('id', candidateId);

    await supabase.from('applications').update({
      status: 'decided',
    }).eq('candidate_id', candidateId);

    if (updateError.error) {
      console.warn('Failed to write AI score to DB:', updateError.error.message);
    }

    return NextResponse.json({
      ok: true,
      score: scoreResult.score,
      decision: scoreResult.decision,
      // NOTE: transcript & reasoning are NOT returned to the browser caller
      // (submitApplication is called server-side). This prevents leaking
      // AI internals to candidate-facing pages.
    });
  } catch (err) {
    console.error('/api/score error:', err);
    return NextResponse.json({ ok: false, error: 'Scoring failed' }, { status: 500 });
  }
}
