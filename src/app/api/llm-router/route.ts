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

  If the query does not clearly match any of these intents, return null for the intent in the suggestion.
  You must extract the core entity the user is talking about (e.g. "I lost my black earphones" -> extractedEntity: "black earphones").
  
  You will receive "messages" containing the conversation history. The last message is the latest query. You may also receive "searchResults" containing database matches.
  
  Generate a conversational, friendly "message" acknowledging their query and referencing the results if applicable.
  Then, provide an array of 1 to 3 "suggestions" for where to route the user. For example, if they mention a laptop, suggest both searching the marketplace and reporting it lost.
  
  You must return a raw JSON object (without markdown code blocks) matching this schema:
  {
    "message": "string (your friendly response)",
    "suggestions": [
      {
        "title": "string (e.g. 'Search Marketplace for Laptops')",
        "intent": "CREATE_LOST_REPORT" | "CREATE_FOUND_REPORT" | "MARKETPLACE_SEARCH" | "VENTURE_SEARCH" | null,
        "extractedEntity": "string"
      }
    ]
  }
  `;

export async function POST(req: Request) {
  try {
    const { query, searchResults, messages } = await req.json();

    if (!query && (!messages || messages.length === 0)) {
      return NextResponse.json({ error: 'Query or messages are required' }, { status: 400 });
    }

    const chatHistory = messages ? messages : [{ role: 'user', content: query }];
    
    // Construct the prompt with chat history and context
    let prompt = "Conversation History:\n";
    chatHistory.forEach((msg: any) => {
      prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    });
    prompt += `\nDatabase Search Results context for the latest query:\n${JSON.stringify(searchResults || {})}`;

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
      message: json.message || "I can help with that.",
      suggestions: json.suggestions || [],
    });
  } catch (error: any) {
    console.error('LLM Router Error:', error);
    return NextResponse.json({ error: 'Failed to process intent', details: error.message }, { status: 500 });
  }
}
