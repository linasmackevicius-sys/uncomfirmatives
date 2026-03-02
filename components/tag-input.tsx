"use client";

import { useState, useRef, useEffect } from "react";
import type { Tag } from "@/lib/types";

interface Props {
  tags: Tag[];
  allTags: Tag[];
  onChange: (tagIds: number[]) => void;
  onCreateTag?: (name: string) => Promise<Tag>;
}

export default function TagInput({ tags, allTags, onChange, onCreateTag }: Props) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(tags.map((t) => t.id));

  const filtered = allTags.filter(
    (t) =>
      !selectedIds.has(t.id) &&
      t.name.toLowerCase().includes(query.toLowerCase())
  );

  const canCreate =
    query.trim() !== "" &&
    !allTags.some((t) => t.name.toLowerCase() === query.trim().toLowerCase());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addTag(tag: Tag) {
    onChange([...tags.map((t) => t.id), tag.id]);
    setQuery("");
  }

  function removeTag(id: number) {
    onChange(tags.filter((t) => t.id !== id).map((t) => t.id));
  }

  async function handleCreate() {
    if (!onCreateTag || !query.trim()) return;
    const newTag = await onCreateTag(query.trim());
    addTag(newTag);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Backspace" && query === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1].id);
    }
    if (e.key === "Enter" && canCreate && onCreateTag) {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === "Enter" && filtered.length === 1) {
      e.preventDefault();
      addTag(filtered[0]);
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div className="tag-input-wrapper" ref={wrapperRef}>
      <div
        className="tag-input"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="tag-chip"
            style={tag.color ? { backgroundColor: tag.color } : undefined}
          >
            {tag.name}
            <button
              className="tag-chip-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag.id);
              }}
              type="button"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="tag-input-field"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
        />
      </div>
      {showDropdown && (filtered.length > 0 || canCreate) && (
        <div className="tag-dropdown">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              className="tag-dropdown-item"
              onClick={() => addTag(tag)}
              type="button"
            >
              {tag.color && (
                <span
                  className="tag-dropdown-dot"
                  style={{ backgroundColor: tag.color }}
                />
              )}
              {tag.name}
            </button>
          ))}
          {canCreate && onCreateTag && (
            <button
              className="tag-dropdown-item tag-dropdown-create"
              onClick={handleCreate}
              type="button"
            >
              Create &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
