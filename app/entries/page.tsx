"use client";

import { Suspense } from "react";
import EntriesView from "@/components/entries-view";

export default function Entries() {
  return (
    <Suspense>
      <EntriesView title="All Entries" />
    </Suspense>
  );
}
