"use client";

import React, { useEffect, useState } from "react";
import { Plus, Save, Trash2, Zap } from "lucide-react";

type IntentDictionary = Record<string, string[]>;

export default function IntentsAdminPage() {
  const [dictionary, setDictionary] = useState<IntentDictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [activeIntent, setActiveIntent] = useState<string>("CREATE_LOST_REPORT");

  useEffect(() => {
    fetch("/api/admin/intents")
      .then((res) => res.json())
      .then((data) => {
        setDictionary(data);
        setLoading(false);
      });
  }, []);

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !dictionary) return;

    setDictionary({
      ...dictionary,
      [activeIntent]: [...(dictionary[activeIntent] || []), newWord.trim().toLowerCase()],
    });
    setNewWord("");
  };

  const handleRemoveWord = (intentKey: string, wordToRemove: string) => {
    if (!dictionary) return;
    setDictionary({
      ...dictionary,
      [intentKey]: dictionary[intentKey].filter((w) => w !== wordToRemove),
    });
  };

  const handleSave = async () => {
    if (!dictionary) return;
    setSaving(true);
    try {
      await fetch("/api/admin/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dictionary),
      });
      alert("Saved successfully!");
    } catch (e) {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !dictionary) {
    return <div className="p-8">Loading dictionary...</div>;
  }

  const intents = Object.keys(dictionary);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="text-amber-500" />
              Intent Router Configuration
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage the regex trigger words for conversational search routing.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-2">
            {intents.map((intent) => (
              <button
                key={intent}
                onClick={() => setActiveIntent(intent)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeIntent === intent
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {intent.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Main Area */}
          <div className="md:col-span-3 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Trigger Words for {activeIntent.replace(/_/g, " ")}
            </h2>

            <form onSubmit={handleAddWord} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Add a new phrase (e.g. 'i need a')"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newWord.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center justify-center disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {(dictionary[activeIntent] || []).map((word) => (
                <div
                  key={word}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm text-gray-700"
                >
                  <span>{word}</span>
                  <button
                    onClick={() => handleRemoveWord(activeIntent, word)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
