"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/moving-border";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { routeQuery } from "@/lib/intentRouter";
import { Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ChatMessage = { role: "user" | "ai"; content: string; options?: { label: string; url: string }[] };

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
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  const { isListening, startListening } = useVoiceSearch((text) => {
    setQuery(text);
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

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setLiveIntent(null);
      setShowDropdown(false);
      return;
    }

    if (searchMode === "regex") {
      routeQuery(query, "regex").then(result => {
        if (result.intent) {
          setLiveIntent(result);
          setShowDropdown(true);
        } else {
          setLiveIntent(null);
        }
      });
    } else {
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
        if (searchMode === "llm") {
          setIsChatOpen(true);
          const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: query }];
          setChatHistory(newHistory);
          const currentQuery = query;
          setQuery("");
          
          const result = await routeQuery(currentQuery, searchMode, results, newHistory);
          if (result.message) {
            setChatHistory([...newHistory, { role: "ai", content: result.message, options: result.options }]);
          }
        } else {
          const result = await routeQuery(query, searchMode, results);
          if (result.redirectTo) {
            router.push(result.redirectTo);
          }
        }
      } finally {
        setIsIntentLoading(false);
      }
    }
  };

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setIsIntentLoading(true);
    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: chatInput }];
    setChatHistory(newHistory);
    const currentInput = chatInput;
    setChatInput("");
    
    try {
      const result = await routeQuery(currentInput, "llm", results, newHistory);
      if (result.message) {
        setChatHistory([...newHistory, { role: "ai", content: result.message, options: result.options }]);
      }
    } finally {
      setIsIntentLoading(false);
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            {greetingFirstPart}
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium h-8">
            {typedSecondPart}
            <span className="animate-pulse text-brand">|</span>
          </p>
        </div>
      )}
      
      <div className="relative w-full">
        <form onSubmit={handleSearch} className="w-full relative z-50">
          <div
            className={`w-full h-14 md:h-16 flex items-center rounded-md border px-2 py-1 md:px-4 md:py-2 transition-all duration-300 ${
              searchMode === "llm"
                ? "border-blue-500 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500/20"
                : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-gray-900/10 focus-within:border-gray-700"
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
              className={`p-2 rounded-md transition-colors mr-1 md:mr-2 ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              title="Voice Search"
            >
              <Mic size={22} strokeWidth={2} />
            </button>

            <button
              type="submit"
              disabled={!query.trim()}
              className={`ml-1 px-4 py-2 md:px-6 md:py-2.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hidden md:block ${
                searchMode === "llm" 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-4 flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-md inline-flex items-center">
            <button
              type="button"
              onClick={() => setSearchMode("regex")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                searchMode === "regex" 
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-850 dark:hover:text-gray-250"
              }`}
            >
              Regex Router
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("llm")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                searchMode === "llm" 
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-850 dark:hover:text-gray-250"
              }`}
            >
              LLM Assist
            </button>
          </div>
        </div>

        {showDropdown && (
          <div className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 rounded-md shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-40 max-h-[70vh] overflow-y-auto">
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
                className="bg-blue-50/80 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 p-5 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
                    Let AI find this for you
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Press <kbd className="bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-sans shadow-sm text-[10px] font-bold mx-0.5">ENTER</kbd> or click here to ask the AI
                  </p>
                </div>
                 <div className="bg-blue-600 text-white p-2.5 rounded-md shadow-xs">
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
                {results.marketplace.length > 0 && (
                  <div className="mb-2">
                     <div className="px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-850/40">Marketplace</div>
                    {results.marketplace.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleResultClick(item.url)}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-10 h-10 rounded-md object-cover mr-4 border border-gray-200 dark:border-gray-800" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-800 mr-4 flex items-center justify-center">
                            <Search size={16} className="text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.ventures.length > 0 && (
                  <div className="mb-2">
                     <div className="px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-850/40">Student Ventures</div>
                    {results.ventures.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleResultClick(item.url)}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-10 h-10 rounded-full object-cover mr-4 border border-gray-200 dark:border-gray-800" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/30 mr-4 flex items-center justify-center">
                            <span className="text-orange-600 dark:text-orange-400 font-bold">{item.title[0]}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.lostFound.length > 0 && (
                  <div className="mb-2">
                     <div className="px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-855/40">Lost & Found</div>
                    {results.lostFound.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleResultClick(item.url)}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-full ${item.type === 'lost' ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400'} mr-4 flex items-center justify-center font-bold text-xs uppercase tracking-tighter`}>
                          {item.type}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle}</p>
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

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            key="chat-overlay"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-md shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-w-2xl w-full h-[80vh] relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0,
                transition: { type: "spring", stiffness: 380, damping: 30 } }}
              exit={{ opacity: 0, scale: 0.94, y: 10,
                transition: { duration: 0.18, ease: "easeIn" } }}
            >
             <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 dark:bg-blue-700"></div>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">AI Assistant</h3>
                  <p className="text-xs text-gray-500">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-md px-5 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  
                  {msg.role === 'ai' && msg.options && msg.options.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 w-full max-w-[90%]">
                      {msg.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => {
                            setIsChatOpen(false);
                            router.push(opt.url);
                          }}
                          className="px-4 py-2 text-sm font-medium rounded-md border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-gray-900 transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2"
                        >
                          {opt.label} <Zap size={14} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {isIntentLoading && (
                <div className="flex items-start">
                  <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 rounded-md px-5 py-4 rounded-tl-sm flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <form onSubmit={handleFollowUp} className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a follow-up..."
                  className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-md py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-white placeholder-gray-500"
                  disabled={isIntentLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isIntentLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 transition-colors shadow-md"
                >
                  <Search size={18} />
                </button>
              </form>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
