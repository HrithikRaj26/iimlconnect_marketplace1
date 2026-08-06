import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are an intelligent intent router for a campus application.
Your job is to read the user's query and classify it into one of the following intents:
- "CREATE_LOST_REPORT": User lost an item and needs to report it.
- "CREATE_FOUND_REPORT": User found an item and needs to report it.
- "MARKETPLACE_SEARCH": User wants to buy, sell, or is looking for marketplace items (like tickets, electronics, books).
- "VENTURE_SEARCH": User is looking for student businesses, startups, freelancers, or services.

  If the query does not clearly match any of these intents, return null for the intent.
  You must also extract the core entity the user is talking about (e.g. "I lost my black earphones" -> extractedEntity: "black earphones").
  
  Additionally, you will receive "searchResults" containing database matches. 
  Generate a short, friendly, conversational "message" (1-2 sentences) acknowledging their query and referencing the results if applicable (e.g., "Hey, I see a few Spiderman tickets available! Let me take you there."). If no results are passed, just acknowledge what they are looking for and say you're taking them there.
  
  You must return a raw JSON object (without markdown code blocks) matching this schema:
  {
    "intent": "CREATE_LOST_REPORT" | "CREATE_FOUND_REPORT" | "MARKETPLACE_SEARCH" | "VENTURE_SEARCH" | null,
    "extractedEntity": "string",
    "message": "string"
  }
  `;

export async function POST(req: Request) {
  try {
    const { query, searchResults } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const prompt = `User Query: "${query}"\n\nDatabase Search Results context:\n${JSON.stringify(searchResults || {})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error('No text returned from Gemini');
    }

    // Try parsing the JSON (the model is instructed to output raw JSON)
    const json = JSON.parse(text);

    return NextResponse.json({
      intent: json.intent,
      extractedEntity: json.extractedEntity || query,
      message: json.message || "Taking you there right now...",
    });
  } catch (error: any) {
    console.error('LLM Router Error:', error);
    return NextResponse.json({ error: 'Failed to process intent', details: error.message }, { status: 500 });
  }
}
