"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GlobalSearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";
  const router = useRouter();
  
  const [results, setResults] = useState<{
    marketplace: any[];
    ventures: any[];
    lostFound: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
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
    };

    fetchResults();
  }, [query]);

  const hasResults = results && (results.marketplace.length > 0 || results.ventures.length > 0 || results.lostFound.length > 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full pb-20">
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4 p-2 text-gray-500 hover:text-gray-900 bg-white rounded-full shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div className="relative w-full flex items-center bg-white rounded-full shadow-sm border border-gray-200 px-4 py-3">
            <Search size={20} className="text-gray-400 mr-3" />
            <span className="text-gray-900 font-medium text-lg">Search results for: "{query}"</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 size={48} className="animate-spin text-blue-500" />
          </div>
        ) : !hasResults ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center py-24 flex flex-col justify-center items-center">
            <Search size={48} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No results found</h2>
            <p className="text-gray-500">We couldn't find anything matching "{query}". Try adjusting your keywords.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Marketplace Results */}
            {results.marketplace.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-800">Marketplace</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.marketplace.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => router.push(item.url)}
                      className="flex items-center px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover mr-6 border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 mr-6 flex items-center justify-center">
                          <Search size={24} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-600 font-medium mt-1">{item.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Venture Hub Results */}
            {results.ventures.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-800">Student Ventures</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.ventures.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => router.push(item.url)}
                      className="flex items-center px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-16 h-16 rounded-full object-cover mr-6 border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-orange-100 mr-6 flex items-center justify-center">
                          <span className="text-orange-600 font-bold text-xl">{item.title[0]}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-600 mt-1">{item.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lost & Found Results */}
            {results.lostFound.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-800">Lost & Found</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.lostFound.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => router.push(item.url)}
                      className="flex items-center px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className={`w-16 h-16 rounded-full ${item.type === 'lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} mr-6 flex items-center justify-center font-bold text-sm uppercase tracking-wider shadow-sm`}>
                        {item.type}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-600 mt-1">{item.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
