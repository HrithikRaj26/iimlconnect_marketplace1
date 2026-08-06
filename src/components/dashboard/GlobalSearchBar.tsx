"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/moving-border";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

const greetings = {
  morning: [
    "Ready to build something new today?",
    "Let's make today productive.",
    "What are you looking for this morning?",
  ],
  afternoon: [
    "Hope your day is going well!",
    "Keep up the great work.",
    "What can we help you find this afternoon?",
  ],
  evening: [
    "Wrapping up the day?",
    "Evening! Let's get things sorted.",
    "What are you looking for tonight?",
  ]
};

export default function GlobalSearchBar({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [greeting, setGreeting] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    marketplace: any[];
    ventures: any[];
    lostFound: any[];
  } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { isListening, startListening } = useVoiceSearch((text) => setQuery(text));

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
    
    setGreeting(`${timeGreeting}${namePart}! ${randomGreeting}`);
  }, [firstName]);

  // Debounced Search Effect
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setShowDropdown(false);
      return;
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
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
      {greeting && (
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8 text-center tracking-tight">
          {greeting}
        </h1>
      )}
      
      <div className="relative w-full">
        <form onSubmit={handleSearch} className="w-full relative z-50">
          <Button
            as="div"
            borderRadius="9999px"
            containerClassName="w-full h-14 md:h-16 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow duration-300"
            className="bg-white px-2 py-1 md:px-4 md:py-2"
          >
            <div className="flex items-center justify-center p-2 text-gray-400">
              {isLoading ? (
                <Loader2 size={22} strokeWidth={2.5} className="animate-spin text-blue-500" />
              ) : (
                <Search size={22} strokeWidth={2.5} />
              )}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything, search across all modules..."
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 text-sm md:text-lg px-2 placeholder-gray-400"
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
              className="ml-1 bg-gray-900 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full font-medium transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hidden md:block"
            >
              Search
            </button>
          </Button>
        </form>

        {/* Live Search Dropdown */}
        {showDropdown && (
          <div className="absolute top-16 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-40 max-h-[70vh] overflow-y-auto">
            {!isLoading && !hasResults && query.length >= 2 && (
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
