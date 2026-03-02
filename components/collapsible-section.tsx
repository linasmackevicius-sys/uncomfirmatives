"use client";

import { useState } from "react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  count,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`collapsible ${open ? "collapsible--open" : ""}`}>
      <button
        className="collapsible-header"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="collapsible-chevron">{open ? "▾" : "▸"}</span>
        <span className="collapsible-title">{title}</span>
        {count !== undefined && (
          <span className="collapsible-count">{count}</span>
        )}
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}
