"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";

const groups: EntryGroup[] = ["incoming_control", "production", "client"];

export default function Sidebar() {
  const [entriesOpen, setEntriesOpen] = useState(true);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sidebar">
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
    </nav>
  );
}
