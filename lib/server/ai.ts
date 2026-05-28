import Groq from 'groq-sdk';

export const GROQ_MODEL = 'llama-3.1-8b-instant';

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY');
  return new Groq({ apiKey });
}

export function groqBusyResponse() {
  return {
    error: 'AI service is busy. Please try again in a few seconds.',
  };
}

export function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

export function normalizeKeywords(input: unknown): { keyword: string; priority: string }[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(item => {
      if (typeof item === 'string') return { keyword: item, priority: 'medium' };
      if (item && typeof item === 'object') {
        const value = item as Record<string, unknown>;
        const kw = value.keyword || value.text || value.name || '';
        const prio = value.priority || 'medium';
        return { keyword: kw, priority: prio };
      }
      return null;
    })
    .filter((k): k is { keyword: string; priority: string } => Boolean(k && k.keyword))
    .slice(0, 15);
}