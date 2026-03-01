import { EventEmitter } from "events";

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export type EntryEventType =
  | "entry.created"
  | "entry.updated"
  | "entry.deleted"
  | "entry.status_changed";

export interface EntryEvent {
  type: EntryEventType;
  id: number;
}

export function emitEntryEvent(event: EntryEvent): void {
  emitter.emit("entry", event);
}

export function subscribeToEvents(
  callback: (event: EntryEvent) => void
): () => void {
  emitter.on("entry", callback);
  return () => {
    emitter.off("entry", callback);
  };
}
