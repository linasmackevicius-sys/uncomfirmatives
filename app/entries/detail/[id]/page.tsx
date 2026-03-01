"use client";

import { use } from "react";
import EntryDetail from "@/components/entry-detail";

export default function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <EntryDetail id={Number(id)} />;
}
