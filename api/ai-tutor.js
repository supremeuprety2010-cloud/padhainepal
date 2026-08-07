import supabase from './db-client.js';

const DAILY_LIMIT = 10;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    return 'AI Tutor is not configured yet. Please add your GEMINI_API_KEY to enable this feature. For now, try searching for your question in the Practice section or Doubts Forum!';
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.4 },
    }),
  });
  if (!res.ok) throw new Error('Gemini API error');
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user_id, question, grade, subject, history = [] } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'Question required' });

    // Rate limit check
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase.from('ai_usage').select('*', { count: 'exact', head: true }).eq('user_id', user_id).gte('created_at', today);
    if ((count || 0) >= DAILY_LIMIT) {
      return res.status(429).json({ error: `Daily limit of ${DAILY_LIMIT} questions reached. Resets at midnight!` });
    }

    // Semantic cache check
    const { data: cached } = await supabase.from('ai_cache').select('answer').ilike('question_hash', question.toLowerCase().substring(0, 100)).limit(1);
    if (cached && cached.length > 0) {
      await supabase.from('ai_usage').insert({ user_id, question: question.substring(0, 500), cached: true }).catch(() => {});
      const remaining = Math.max(0, DAILY_LIMIT - (count || 0) - 1);
      return res.status(200).json({ answer: cached[0].answer, remaining, cached: true });
    }

    // Build curriculum-aware prompt
    const historyText = history.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
    const prompt = `You are Nep AI, an expert tutor for Nepal's NEB (National Examinations Board) curriculum for Grade ${grade || '8-12'} students${subject ? ` studying ${subject}` : ''}. 

You must:
- Answer in simple, clear English that a 13-17 year old Nepali student can understand
- Reference NEB syllabus and exam patterns when relevant
- Give step-by-step explanations for math/science problems
- Keep answers concise but complete (under 400 words)
- Use examples relevant to Nepal when helpful
- If it's a math problem, show working step by step

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Student question: ${question}

Tutor answer:`;

    const answer = await callGemini(prompt);

    // Cache the response
    await supabase.from('ai_cache').insert({ question_hash: question.toLowerCase().substring(0, 100), question: question.substring(0, 500), answer }).catch(() => {});

    // Log usage
    await supabase.from('ai_usage').insert({ user_id, question: question.substring(0, 500), cached: false }).catch(() => {});

    const remaining = Math.max(0, DAILY_LIMIT - (count || 0) - 1);
    return res.status(200).json({ answer, remaining, cached: false });
  } catch (err) {
    console.error('AI Tutor error:', err);
    res.status(500).json({ error: err.message });
  }
}
