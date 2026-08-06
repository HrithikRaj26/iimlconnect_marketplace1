import dictionary from "../data/intentDictionary.json";

type IntentKeys = keyof typeof dictionary;

export interface IntentResult {
  intent: IntentKeys | null;
  extractedEntity: string;
  redirectTo: string | null;
  message?: string;
  options?: { label: string; url: string }[];
}

export async function routeQuery(query: string, mode: "regex" | "llm", contextResults?: any, messages?: any[]): Promise<IntentResult> {
  const normalizedQuery = query.toLowerCase().trim();
  let extractedEntity = query;
  let finalIntent: IntentKeys | null = null;
  let aiMessage: string | undefined;
  let options: { label: string; url: string }[] | undefined;

  const mapIntentToUrl = (intent: string | null, entity: string, fallbackQuery: string) => {
    switch (intent) {
      case "CREATE_LOST_REPORT":
        return `/lost-found?tab=found&q=${encodeURIComponent(entity)}`;
      case "CREATE_FOUND_REPORT":
        return `/lost-found?tab=lost&q=${encodeURIComponent(entity)}`;
      case "MARKETPLACE_SEARCH":
        return `/marketplace?q=${encodeURIComponent(entity || fallbackQuery)}`;
      case "VENTURE_SEARCH":
        return `/ventures?q=${encodeURIComponent(entity || fallbackQuery)}`;
      default:
        return `/search?q=${encodeURIComponent(fallbackQuery)}`;
    }
  };

  if (mode === "llm") {
    try {
      const res = await fetch("/api/llm-router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, searchResults: contextResults, messages })
      });
      if (res.ok) {
        const data = await res.json();
        aiMessage = data.message;
        
        if (data.suggestions && Array.isArray(data.suggestions)) {
          options = data.suggestions.map((s: any) => ({
            label: s.title,
            url: mapIntentToUrl(s.intent, s.extractedEntity, query)
          }));
          
          if (options && options.length > 0) {
            finalIntent = data.suggestions[0].intent;
            extractedEntity = data.suggestions[0].extractedEntity || query;
          }
        }
      } else {
        throw new Error(`API returned ${res.status}`);
      }
    } catch (e) {
      console.error("LLM routing failed, falling back to regex.", e);
      mode = "regex"; // fallback if fetch fails
    }
  }

  if (mode === "regex") {
    for (const [intent, triggers] of Object.entries(dictionary)) {
      for (const trigger of triggers) {
        const regex = new RegExp(`\\b${trigger}\\b`, "i");
        const match = normalizedQuery.match(regex);

        if (match) {
          extractedEntity = normalizedQuery.replace(regex, "").trim();
          extractedEntity = extractedEntity.replace(/^(a|an|the|my|some)\s+/i, "");
          finalIntent = intent as IntentKeys;
          break;
        }
      }
      if (finalIntent) break;
    }
  }

  let redirectTo = `/search?q=${encodeURIComponent(query)}`;

  if (finalIntent) {
    redirectTo = mapIntentToUrl(finalIntent, extractedEntity, query);
  }

  return {
    intent: finalIntent,
    extractedEntity,
    redirectTo,
    message: aiMessage,
    options
  };
}
