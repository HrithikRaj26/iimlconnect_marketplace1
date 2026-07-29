"use client";

import React, { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { MAX_TAGS } from "@/constants/listing";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const value = draft.trim().replace(/^#/, "");
    if (!value || tags.includes(value) || tags.length >= MAX_TAGS) {
      setDraft("");
      return;
    }
    onChange([...tags, value]);
    setDraft("");
  };

  return (
    <div className="w-full">
      <label htmlFor="tags" className="mb-1.5 block text-sm font-medium text-gray-800">
        Tags <span className="font-normal text-gray-400">(Optional)</span>
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 p-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        {tags.map((tag) => (
          <Chip key={tag} label={`#${tag}`} tone="brand" onRemove={() => onChange(tags.filter((t) => t !== tag))} />
        ))}
        <input
          id="tags"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={tags.length >= MAX_TAGS ? "Tag limit reached" : "Add tag…"}
          disabled={tags.length >= MAX_TAGS}
          className="min-w-[100px] flex-1 border-none bg-transparent px-1 py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
