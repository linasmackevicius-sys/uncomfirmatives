"use client";

import { use, Suspense } from "react";
import EntriesView from "@/components/entries-view";
import type { EntryGroup } from "@/lib/types";
import { GROUP_LABELS } from "@/lib/types";

function GroupEntriesInner({ group }: { group: string }) {
  const title = GROUP_LABELS[group as EntryGroup] || "Entries";
  return <EntriesView group={group} title={title} />;
}

export default function GroupEntries({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = use(params);
  return (
    <Suspense>
      <GroupEntriesInner group={group} />
    </Suspense>
  );
}
