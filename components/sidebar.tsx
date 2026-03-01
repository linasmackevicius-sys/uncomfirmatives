"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";

const groups: EntryGroup[] = ["incoming_control", "production", "client"];

const STORAGE_KEY = "sidebar-collapsed";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [entriesOpen, setEntriesOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "true") setCollapsed(true);

    const mq = window.matchMedia("(max-width: 768px)");
    if (mq.matches) setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev));
      return !prev;
    });
  };

  const isActive = (path: string) => pathname === path;
  const width = collapsed ? 48 : 240;

  return (
    <nav className={`sidebar${collapsed ? " collapsed" : ""}`} style={{ width }}>
      <div className="sidebar-header">
        <button
          className="sidebar-toggle"
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "☰" : "◁"}
        </button>
      </div>

      <button
        className="sidebar-create-btn"
        onClick={() => router.push("/entries?new=1")}
        title="New Entry"
      >
        <span className="icon">+</span>
        <span className="label">New Entry</span>
      </button>

      <div className="sidebar-nav">
        <SidebarItem
          href="/"
          icon="▦"
          label="Dashboard"
          active={isActive("/")}
          collapsed={collapsed}
        />
        <SidebarItem
          href="/entries"
          icon="☰"
          label="Entries"
          active={isActive("/entries")}
          collapsed={collapsed}
        />
        <SidebarItem
          href="/board"
          icon="▥"
          label="Board"
          active={isActive("/board")}
          collapsed={collapsed}
        />

        {!collapsed && (
          <>
            <button
              className="sidebar-section-btn"
              onClick={() => setEntriesOpen(!entriesOpen)}
            >
              <span className={`sidebar-chevron${entriesOpen ? " open" : ""}`}>▸</span>
              <span>Groups</span>
            </button>

            {entriesOpen && (
              <div className="sidebar-children">
                {groups.map((g) => (
                  <Link
                    key={g}
                    href={`/entries/${g}`}
                    className={`sidebar-item child${isActive(`/entries/${g}`) ? " active" : ""}`}
                  >
                    <span className="sidebar-label">{GROUP_LABELS[g]}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <div className="sidebar-item-wrapper">
      <Link
        href={href}
        className={`sidebar-item${active ? " active" : ""}`}
      >
        <span className="sidebar-icon">{icon}</span>
        <span className="sidebar-label">{label}</span>
      </Link>
      {collapsed && <span className="sidebar-tooltip">{label}</span>}
    </div>
  );
}
