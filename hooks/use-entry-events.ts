"use client";

import { useEffect, useRef, useCallback } from "react";

interface Options {
  entryId?: number;
  suppressMs?: number;
}

export function useEntryEvents(
  refresh: () => void,
  options: Options = {}
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const suppressUntilRef = useRef<number>(0);
  const entryIdRef = useRef(options.entryId);
  entryIdRef.current = options.entryId;

  useEffect(() => {
    const es = new EventSource("/api/events");
    let isFirstOpen = true;

    es.onopen = () => {
      if (isFirstOpen) {
        isFirstOpen = false;
        return;
      }
      // Reconnect after gap: re-fetch to catch missed events
      refreshRef.current();
    };

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as { type: string; id: number };

      if (entryIdRef.current !== undefined && data.id !== entryIdRef.current) {
        return;
      }

      if (Date.now() < suppressUntilRef.current) {
        return;
      }

      refreshRef.current();
    };

    return () => {
      es.close();
    };
  }, []);

  const suppressBriefly = useCallback(
    (ms?: number) => {
      suppressUntilRef.current = Date.now() + (ms ?? options.suppressMs ?? 500);
    },
    [options.suppressMs]
  );

  return { suppressBriefly };
}
