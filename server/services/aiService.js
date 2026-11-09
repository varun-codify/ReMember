const axios = require('axios');

/**
 * AI service — thin OpenAI-compatible chat client used for natural-language
 * capture parsing and enrichment. Works with any OpenAI-compatible endpoint;
 * defaults to Groq's free tier.
 *
 *   AI_API_KEY    required to enable
 *   AI_BASE_URL   default https://api.groq.com/openai/v1
 *   AI_MODEL      default llama-3.3-70b-versatile (swap to llama-3.1-8b-instant for more headroom)
 */

const aiBaseUrl = () => process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1';
const aiModel = () => process.env.AI_MODEL || 'llama-3.3-70b-versatile';

const isEnabled = () => !!process.env.AI_API_KEY;

async function chat(messages, { temperature = 0.2 } = {}) {
  if (!isEnabled()) return null;
  const response = await axios.post(
    `${aiBaseUrl()}/chat/completions`,
    {
      model: aiModel(),
      messages,
      temperature
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 12000
    }
  );
  return response.data?.choices?.[0]?.message?.content || null;
}

// The model may wrap JSON in markdown fences or add prose — extract the first
// balanced JSON object we can parse.
function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate);
  } catch (e) {
    /* fall through */
  }
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch (e) {
      /* fall through */
    }
  }
  return null;
}

const cleanTags = (tags) =>
  Array.isArray(tags)
    ? tags
        .map((t) => String(t).trim().toLowerCase().slice(0, 30))
        .filter(Boolean)
        .slice(0, 6)
    : [];

/**
 * Parse a natural-language note into structured capture data.
 * Returns null when AI is disabled or parsing fails.
 */
async function parseCapture(text) {
  if (!isEnabled()) return null;

  // Cap input size so a careless paste can't burn tokens
  text = String(text).slice(0, 600);

  const today = new Date().toISOString().slice(0, 10);
  const system = `You parse short notes into structured data for a personal memory app. Respond with JSON only, no prose:
{
  "type": "task" | "video" | "website" | "password" | null,
  "title": string,
  "url": string or null,
  "dueDate": ISO date string or null (e.g. "${today}" for today, "2026-08-10" for a named day),
  "priority": "low" | "medium" | "high",
  "category": "ai"|"productivity"|"learning"|"utilities"|"development"|"design"|"other" (websites only, otherwise null),
  "tags": array of 2-5 short lowercase tags,
  "description": one-sentence note
}
Rules:
- Default "type" is "task" unless a URL is present (YouTube → "video", anything else → "website").
- A password capture ("my gmail password is...", "remember netflix login") → "password" with title = site name; never include the secret itself in title/description.
- Resolve relative dates ("friday", "tomorrow", "in 3 days") against today: ${today}.`;

  const content = await chat([
    { role: 'system', content: system },
    { role: 'user', content: String(text) }
  ]);

  const parsed = extractJson(content);
  if (!parsed) return null;

  const validTypes = ['task', 'video', 'website', 'password'];
  // Guard against a hallucinated/garbage date — an invalid value would trip a
  // Mongoose CastError on task creation.
  const dueDate =
    parsed.dueDate && !isNaN(Date.parse(parsed.dueDate)) ? parsed.dueDate : null;

  return {
    type: validTypes.includes(parsed.type) ? parsed.type : 'task',
    title: parsed.title || String(text).slice(0, 200),
    url: parsed.url || null,
    dueDate,
    priority: ['low', 'medium', 'high'].includes(parsed.priority) ? parsed.priority : 'medium',
    category: parsed.category || 'other',
    tags: cleanTags(parsed.tags),
    description: parsed.description || ''
  };
}

/**
 * Enrich a saved video/website with an AI summary + tags.
 * Returns null when AI is disabled or enrichment fails.
 */
async function enrich({ title, notes = '' }) {
  if (!isEnabled()) return null;

  const system =
    'Return JSON only: {"summary": one sentence under 140 characters, "tags": array of 2-5 short lowercase tags}.';
  const content = await chat([
    { role: 'system', content: system },
    { role: 'user', content: `Title: ${title}\nNotes: ${notes || '(none)'}` }
  ]);

  const parsed = extractJson(content);
  if (!parsed) return null;

  return {
    summary: parsed.summary || '',
    tags: cleanTags(parsed.tags)
  };
}

/**
 * Generate a one/two-sentence summary + key points + a category suggestion
 * for a saved item (video, website, note). Returns null when AI is disabled.
 */
async function summarizeContent({ title, content = '' }) {
  if (!isEnabled()) return null;

  const system =
    'You are the AI assistant inside a personal learning/memory app. Given a saved item\'s title and content, respond with JSON only:\n' +
    '{"summary": "one or two sentences, under 180 characters", "keyPoints": ["3 to 5 concise bullet points"], ' +
    '"suggestedCategory": "ai"|"productivity"|"learning"|"utilities"|"development"|"design"|"other"}\n' +
    'If the content is empty, infer what you can from the title alone.';

  const clipped = String(content).replace(/\s+/g, ' ').slice(0, 8000);
  const response = await chat([
    { role: 'system', content: system },
    { role: 'user', content: `Title: ${title}\nContent:\n${clipped || '(no content)'}` }
  ]);

  const parsed = extractJson(response);
  if (!parsed) return null;

  return {
    summary: String(parsed.summary || '').slice(0, 300),
    keyPoints: Array.isArray(parsed.keyPoints)
      ? parsed.keyPoints.map((k) => String(k).slice(0, 300)).filter(Boolean).slice(0, 6)
      : [],
    suggestedCategory: parsed.suggestedCategory || null
  };
}

/* ======================= Assistant (chat + quiz) ======================= */

const sanitizeQuiz = (questions) =>
  Array.isArray(questions)
    ? questions
        .map((q) => ({
          question: String(q.question || '').slice(0, 300),
          options: Array.isArray(q.options)
            ? q.options.map((o) => String(o).slice(0, 200)).slice(0, 4)
            : [],
          answer: Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4 ? q.answer : 0
        }))
        .filter((q) => q.question && q.options.length === 4)
        .slice(0, 6)
    : [];

/**
 * The memory-aware chat used by the AI Assistant. `context` is an attached
 * item's text; `library` is a compact index of the user's saved items.
 * Returns { reply, quiz? }. Null when AI is disabled.
 */
async function chatWithMemory({ message, history = [], context = null, library = [], mode = 'chat' }) {
  if (!isEnabled()) return null;

  const system = `You are ReMember AI, the assistant inside the user's personal knowledge memory app.
Rules:
- Be concise, friendly, and concrete. Use short paragraphs and "- " bullets.
- Answer questions about the user's library ("find", "everything I saved", "do I have...") using ONLY the SAVED ITEMS list. Never invent items.
- When an ATTACHED ITEM is provided, answer questions about it using that content.
- For quiz requests, respond with JSON ONLY: {"questions":[{"question":"...","options":["a","b","c","d"],"answer":0}]} — exactly 4 options each, answer = index of the correct one, 3-6 questions.
- If the answer isn't in the provided context, say so honestly.`;

  const parts = [];
  if (context) parts.push(`ATTACHED ITEM:\n${context}`);
  if (library && library.length) {
    parts.push(`USER'S SAVED ITEMS (title — type — tags):\n${library.join('\n')}`);
  }
  const userContent = parts.length ? `${message}\n\n---\n${parts.join('\n\n')}` : message;

  const messages = [
    { role: 'system', content: system },
    ...history.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000)
    })),
    { role: 'user', content: userContent }
  ];

  if (mode === 'quiz') {
    const content = await chat(
      [...messages, { role: 'system', content: 'Respond with JSON only, as specified.' }],
      { temperature: 0.7 }
    );
    const parsed = extractJson(content);
    const quiz = sanitizeQuiz(parsed && parsed.questions);
    if (quiz.length) {
      return { reply: 'Here is a quick quiz based on your saved items. 🎓', quiz };
    }
    return { reply: "I couldn't generate a quiz this time — try again." };
  }

  const content = await chat(messages);
  return { reply: content || "I'm not sure what to say — try rephrasing." };
}

/**
 * Suggest related topics/resources for a given topic. Returns null when AI is
 * disabled or the model output can't be parsed.
 */
async function suggestTopics({ topic }) {
  if (!isEnabled()) return null;
  const system =
    'Return JSON only: {"suggestions":[{"topic":"...","why":"one short sentence"}]} — exactly 4 suggestions.';
  const content = await chat([
    { role: 'system', content: system },
    { role: 'user', content: `The user is learning about "${topic}". Suggest 4 related topics or resources to learn next.` }
  ]);
  const parsed = extractJson(content);
  if (!parsed || !Array.isArray(parsed.suggestions)) return null;
  return parsed.suggestions
    .map((s) => ({ topic: String(s.topic || '').slice(0, 80), why: String(s.why || '').slice(0, 160) }))
    .filter((s) => s.topic)
    .slice(0, 4);
}

module.exports = { isEnabled, parseCapture, enrich, summarizeContent, chatWithMemory, suggestTopics };
