import dictionary from "../data/intentDictionary.json";

type IntentKeys = keyof typeof dictionary;

export interface IntentResult {
  intent: IntentKeys | null;
  extractedEntity: string;
  redirectTo: string | null;
}

export async function routeQuery(query: string, mode: "regex" | "llm"): Promise<IntentResult> {
  const normalizedQuery = query.toLowerCase().trim();
  let extractedEntity = query;
  let finalIntent: IntentKeys | null = null;

  if (mode === "llm") {
    try {
      const res = await fetch("/api/llm-router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        const data = await res.json();
        finalIntent = data.intent;
        extractedEntity = data.extractedEntity || query;
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
    switch (finalIntent as IntentKeys) {
      case "CREATE_LOST_REPORT":
        // If they lost something, they want to search the Found items.
        redirectTo = `/lost-found?tab=found&q=${encodeURIComponent(extractedEntity)}`;
        break;
      case "CREATE_FOUND_REPORT":
        // If they found something, they want to search the Lost items.
        redirectTo = `/lost-found?tab=lost&q=${encodeURIComponent(extractedEntity)}`;
        break;
      case "MARKETPLACE_SEARCH":
        redirectTo = `/marketplace?q=${encodeURIComponent(extractedEntity || query)}`;
        break;
      case "VENTURE_SEARCH":
        redirectTo = `/ventures?q=${encodeURIComponent(extractedEntity || query)}`;
        break;
    }
  }

  return {
    intent: finalIntent,
    extractedEntity,
    redirectTo
  };
}
