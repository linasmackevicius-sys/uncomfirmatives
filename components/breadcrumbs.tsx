"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GROUP_LABELS } from "@/lib/types";
import type { EntryGroup } from "@/lib/types";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  entries: "Entries",
  board: "Board",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href: string }[] = [
    { label: "Uncomfirmatives", href: "/" },
  ];

  if (segments.length === 0) {
    crumbs.push({ label: "Dashboard", href: "/" });
  } else {
    let path = "";
    for (const seg of segments) {
      path += `/${seg}`;

      if (seg === "detail") continue;

      if (routeLabels[seg]) {
        crumbs.push({ label: routeLabels[seg], href: path });
      } else if (GROUP_LABELS[seg as EntryGroup]) {
        crumbs.push({ label: GROUP_LABELS[seg as EntryGroup], href: path });
      } else if (/^\d+$/.test(seg)) {
        crumbs.push({ label: `NC-${seg}`, href: path });
      } else {
        crumbs.push({ label: seg, href: path });
      }
    }
  }

  return (
    <nav className="breadcrumbs">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href + i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span className="breadcrumb-separator">/</span>}
            {isLast ? (
              <span className="breadcrumb-current">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="breadcrumb-link">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
