"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/moving-border";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { routeQuery } from "@/lib/intentRouter";
import { Sparkles, Zap } from "lucide-react";

const greetings = {
  morning: [
    "Ready to build something new today?",
    "Let's make today productive.",
    "What are you looking for this morning?",
    "Grab a coffee and let's get started!",
    "It's a beautiful morning to find something great.",
    "Rise and shine! What's on the agenda today?",
    "Hoping you have a fantastic morning!"
  ],
  afternoon: [
    "Hope your day is going well!",
    "Keep up the great work.",
    "What can we help you find this afternoon?",
    "Halfway through the day! You've got this.",
    "Need a mid-day break? Explore what's new.",
    "Good afternoon! How can we assist you?",
    "Hope you're having a productive afternoon!"
  ],
  evening: [
    "Wrapping up the day?",
    "Evening! Let's get things sorted.",
    "What are you looking for tonight?",
    "Unwind and explore the marketplace.",
    "Good evening! Find exactly what you need.",
    "Time to relax. What's on your mind?",
    "Hope you had a great day! Anything we can help with?"
  ]
};

export default function GlobalSearchBar({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [greetingFirstPart, setGreetingFirstPart] = useState("");
  const [greetingSecondPart, setGreetingSecondPart] = useState("");
  const [typedSecondPart, setTypedSecondPart] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    marketplace: any[];
    ventures: any[];
    lostFound: any[];
  } | null>(null);
  const [liveIntent, setLiveIntent] = useState<any>(null);
  const [isIntentLoading, setIsIntentLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMode, setSearchMode] = useState<"regex" | "llm">("regex");
  const { isListening, startListening } = useVoiceSearch((text) => {
    setQuery(text);
    // Optionally trigger search automatically on voice stop, but let's just prefill for now.
  });

  useEffect(() => {
    const hour = new Date().getHours();
    let timeOfDay: "morning" | "afternoon" | "evening" = "morning";
    
    if (hour >= 12 && hour < 17) {
      timeOfDay = "afternoon";
    } else if (hour >= 17) {
      timeOfDay = "evening";
    }

    const options = greetings[timeOfDay];
    const randomGreeting = options[Math.floor(Math.random() * options.length)];
    
    const timeGreeting = timeOfDay === "morning" ? "Good morning" : timeOfDay === "afternoon" ? "Good afternoon" : "Good evening";
    const namePart = firstName ? `, ${firstName}` : "";
    
    setGreetingFirstPart(`${timeGreeting}${namePart}!`);
    setGreetingSecondPart(randomGreeting);
  }, [firstName]);

  useEffect(() => {
    if (!greetingSecondPart) return;
    let i = 0;
    setTypedSecondPart("");
    
    // Add a small delay before typing starts for a better effect
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        setTypedSecondPart(greetingSecondPart.slice(0, i + 1));
        i++;
        if (i >= greetingSecondPart.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(startDelay);
  }, [greetingSecondPart]);

  // Debounced Search Effect
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setLiveIntent(null);
      setShowDropdown(false);
      return;
    }

    if (searchMode === "regex") {
      // Regex is fast enough to run live
      routeQuery(query, "regex").then(result => {
        if (result.intent) {
          setLiveIntent(result);
          setShowDropdown(true);
        } else {
          setLiveIntent(null);
        }
      });
    } else {
      // LLM is slower, don't run it on every keystroke, let the form submit handle it.
      // Alternatively, we could debounce it, but since API calls cost money/time, 
      // we'll just clear live intent for now.
      setLiveIntent(null);
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      setShowDropdown(true);
      try {
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      setIsIntentLoading(true);
      try {
        const result = await routeQuery(query, searchMode);
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      } finally {
        setIsIntentLoading(false);
      }
    }
  };

  const handleResultClick = (url: string) => {
    setShowDropdown(false);
    setQuery("");
    router.push(url);
  };

  const hasResults = results && (results.marketplace.length > 0 || results.ventures.length > 0 || results.lostFound.length > 0);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center mb-16 px-4 pt-12">
      {greetingFirstPart && (
        <div className="mb-8 text-center tracking-tight">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
            {greetingFirstPart}
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-medium h-8">
            {typedSecondPart}
            <span className="animate-pulse text-brand">|</span>
          </p>
        </div>
      )}
      
      <div className="relative w-full">
        <form onSubmit={handleSearch} className="w-full relative z-50">
          <Button
            as="div"
            borderRadius="9999px"
            containerClassName={`w-full h-14 md:h-16 transition-shadow duration-300 ${
              searchMode === "llm"
                ? "shadow-[0_8px_30px_rgba(59,130,246,0.25)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.35)] ring-2 ring-blue-500/20"
                : "shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
            }`}
            className={`px-2 py-1 md:px-4 md:py-2 transition-colors duration-300 ${
              searchMode === "llm" ? "bg-blue-50/50" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-center p-2 text-gray-400">
              {isLoading || isIntentLoading ? (
                <Loader2 size={22} strokeWidth={2.5} className={`animate-spin ${searchMode === 'llm' ? 'text-blue-600' : 'text-blue-500'}`} />
              ) : searchMode === "llm" ? (
                <Sparkles size={22} strokeWidth={2.5} className="text-blue-500" />
              ) : (
                <Search size={22} strokeWidth={2.5} />
              )}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchMode === "llm" ? "Ask the AI to find anything..." : "Ask anything, search across all modules..."}
              className={`flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm md:text-lg px-2 transition-colors duration-300 ${
                searchMode === "llm" ? "text-blue-900 placeholder-blue-300" : "text-gray-800 placeholder-gray-400"
              }`}
              onFocus={() => { if (query.trim().length >= 2) setShowDropdown(true); }}
              onBlur={() => { setTimeout(() => setShowDropdown(false), 200); }}
            />
            
            <button
              type="button"
              onClick={startListening}
              className={`p-2 rounded-full transition-colors mr-1 md:mr-2 ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              title="Voice Search"
            >
              <Mic size={22} strokeWidth={2} />
            </button>

            <button
              type="submit"
              disabled={!query.trim()}
              className={`ml-1 px-4 py-2 md:px-6 md:py-2.5 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hidden md:block ${
                searchMode === "llm" 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              Search
            </button>
          </Button>
        </form>

        {/* Search Mode Toggle */}
        <div className="mt-4 flex justify-center">
          <div className="bg-gray-100 p-1 rounded-full inline-flex items-center">
            <button
              type="button"
              onClick={() => setSearchMode("regex")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                searchMode === "regex" 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Zap size={14} />
              Fast Mode
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("llm")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                searchMode === "llm" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Sparkles size={14} />
              AI Mode
            </button>
          </div>
        </div>

        {/* Live Search Dropdown */}
        {showDropdown && (
          <div className="absolute top-16 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-40 max-h-[70vh] overflow-y-auto">
            
            {liveIntent && searchMode === "regex" && (
              <div 
                onClick={() => handleResultClick(liveIntent.redirectTo)}
                className="bg-blue-50 border-b border-blue-100 p-4 cursor-pointer hover:bg-blue-100 transition-colors flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                    <Zap size={16} className="text-blue-600" />
                    Quick Action Suggested
                  </h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Click here to navigate directly to <span className="font-bold">{liveIntent.intent.replace(/_/g, " ")}</span>
                  </p>
                </div>
                <div className="bg-blue-600 text-white p-2 rounded-full">
                  <Zap size={16} />
                </div>
              </div>
            )}
            
            {searchMode === "llm" && query.trim().length >= 2 && (
              <div 
                onClick={handleSearch as any}
                className="bg-blue-50/80 border-b border-blue-100 p-5 cursor-pointer hover:bg-blue-100 transition-colors flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-600" />
                    Let AI find this for you
                  </h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Press <kbd className="bg-white text-blue-900 px-1.5 py-0.5 rounded border border-blue-200 font-sans shadow-sm text-[10px] font-bold mx-0.5">ENTER</kbd> or click here to ask the AI
                  </p>
                </div>
                <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-md">
                  <Sparkles size={18} />
                </div>
              </div>
            )}

            {!isLoading && !hasResults && !liveIntent && query.length >= 2 && searchMode === "regex" && (
              <div className="p-8 text-center text-gray-500">
                No results found for "{query}". Try a different keyword!
              </div>
            )}

            {results && hasResults && (
              <div className="flex flex-col py-2">
                {/* Marketplace Results */}
                {results.marketplace.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Marketplace</div>
                    {results.marketplace.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleResultClick(item.url)}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-10 h-10 rounded-md object-cover mr-4 border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-gray-100 mr-4 flex items-center justify-center">
                            <Search size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500">{item.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Venture Hub Results */}
                {results.ventures.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Student Ventures</div>
                    {results.ventures.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleResultClick(item.url)}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-10 h-10 rounded-full object-cover mr-4 border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-orange-100 mr-4 flex items-center justify-center">
                            <span className="text-orange-600 font-bold">{item.title[0]}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lost & Found Results */}
                {results.lostFound.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Lost & Found</div>
                    {results.lostFound.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleResultClick(item.url)}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-full ${item.type === 'lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} mr-4 flex items-center justify-center font-bold text-xs uppercase tracking-tighter`}>
                          {item.type}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
