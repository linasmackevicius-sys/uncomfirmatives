"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";

const groups: EntryGroup[] = ["incoming_control", "production", "client"];

const SIDEBAR_MIN = 140;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 220;
const STORAGE_KEY = "sidebar-width";

export default function Sidebar() {
  const [entriesOpen, setEntriesOpen] = useState(true);
  const [width, setWidth] = useState(SIDEBAR_DEFAULT);
  const isDragging = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = Number(saved);
      if (parsed >= SIDEBAR_MIN && parsed <= SIDEBAR_MAX) {
        setWidth(parsed);
      }
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.classList.add("resizing");

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.classList.remove("resizing");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setWidth((w) => {
        localStorage.setItem(STORAGE_KEY, String(w));
        return w;
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sidebar" style={{ width }}>
      <Link
        href="/"
        className={`sidebar-item${isActive("/") ? " active" : ""}`}
      >
        <span className="sidebar-icon">&#9632;</span>
        Dashboard
      </Link>

      <button
        className={`sidebar-item sidebar-section${entriesOpen ? " open" : ""}`}
        onClick={() => setEntriesOpen(!entriesOpen)}
      >
        <span className="sidebar-chevron">{entriesOpen ? "▾" : "▸"}</span>
        Entries
      </button>

      {entriesOpen && (
        <div className="sidebar-children">
          <Link
            href="/entries"
            className={`sidebar-item child${isActive("/entries") ? " active" : ""}`}
          >
            All Entries
          </Link>
          {groups.map((g) => (
            <Link
              key={g}
              href={`/entries/${g}`}
              className={`sidebar-item child${isActive(`/entries/${g}`) ? " active" : ""}`}
            >
              {GROUP_LABELS[g]}
            </Link>
          ))}
        </div>
      )}

      <div
        className="sidebar-resize-handle"
        onMouseDown={handleMouseDown}
      />
    </nav>
  );
}
