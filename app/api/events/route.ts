import { subscribeToEvents, type EntryEvent } from "@/lib/event-emitter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function cleanup() {
    unsubscribe?.();
    unsubscribe = null;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      unsubscribe = subscribeToEvents((event: EntryEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // stream already closed
        }
      });

      intervalId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          // stream already closed
        }
      }, 30_000);

      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
