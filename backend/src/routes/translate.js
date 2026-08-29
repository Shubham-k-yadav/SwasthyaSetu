import { Router } from 'express';

const router = Router();

// In-memory LRU translation cache to ensure 0ms instant rendering for repeated phrases
const translationCache = new Map();

/**
 * AI Translation Engine with Gemini, OpenAI & Free Engine Support
 */
async function translateText(text, targetLang = 'hi') {
  if (!text || targetLang === 'en') return text;
  
  const cacheKey = `${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // 1. Try Google Gemini AI API if GEMINI_API_KEY is configured in backend/.env
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Translate the following medical/healthcare text into target language code "${targetLang}" accurately. Return ONLY the translated string with no explanations or quotes:\n\n${text}` }]
          }]
        })
      });
      const data = await response.json();
      const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (translated) {
        translationCache.set(cacheKey, translated);
        return translated;
      }
    } catch (err) {
      console.warn('Gemini AI Translation failed, using fallback engine:', err.message);
    }
  }

  // 2. Try OpenAI API if OPENAI_API_KEY is configured in backend/.env
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are a medical translator. Translate text accurately to "${targetLang}". Return ONLY translated text.` },
            { role: 'user', content: text }
          ]
        })
      });
      const data = await response.json();
      const translated = data?.choices?.[0]?.message?.content?.trim();
      if (translated) {
        translationCache.set(cacheKey, translated);
        return translated;
      }
    } catch (err) {
      console.warn('OpenAI Translation failed, using fallback engine:', err.message);
    }
  }

  // 3. High-Speed Free Google Translation Proxy Engine (Active by default)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      const translated = data[0].map(item => item[0]).join('');
      translationCache.set(cacheKey, translated);
      return translated;
    }
  } catch (err) {
    console.warn('Free Translation Engine warning:', err.message);
  }
  
  return text; // Fallback to original text if offline
}

// POST /api/translate
router.post('/', async (req, res) => {
  try {
    const { text, texts, targetLang = 'hi' } = req.body;

    if (Array.isArray(texts)) {
      const results = await Promise.all(texts.map(t => translateText(t, targetLang)));
      return res.json({ translations: results });
    }

    if (!text) {
      return res.status(400).json({ error: 'Text to translate is required' });
    }

    const translated = await translateText(text, targetLang);
    res.json({ translatedText: translated, targetLang });
  } catch (error) {
    console.error('Translation route error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;
