import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODERATION_SYSTEM_INSTRUCTION = `
You are a content moderation AI. Your job is to analyze chat messages from a university campus app and determine if they contain:
- Profanity or vulgar language
- Hate speech, racism, or discrimination
- Direct harassment, slurs, or personal attacks
- Sexually explicit or inappropriate content
- Scams or highly malicious content

You must return a raw JSON object (without markdown code blocks) matching this schema:
{
  "isHarmful": boolean,
  "reason": "string (brief explanation in English, e.g. 'Contains profanity' or 'Hate speech detected', keep it short)"
}
`;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ isHarmful: false });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: `Analyze this chat message: "${text}"`,
      config: {
        systemInstruction: MODERATION_SYSTEM_INSTRUCTION,
        temperature: 0.0,
        responseMimeType: 'application/json',
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('No response from Gemini');
    }

    const json = JSON.parse(resultText);
    return NextResponse.json({
      isHarmful: !!json.isHarmful,
      reason: json.reason || null,
    });
  } catch (error: any) {
    console.error('Moderation API Error:', error);
    // Safe default fallback in case of API failure / network error:
    // Just allow the message but log the warning.
    return NextResponse.json({ isHarmful: false });
  }
}
