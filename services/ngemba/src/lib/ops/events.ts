type OpsListener = (event: string, data: unknown) => void;

const g = globalThis as unknown as {
  __ngembaOpsListeners?: Set<OpsListener>;
};

function listeners(): Set<OpsListener> {
  if (!g.__ngembaOpsListeners) g.__ngembaOpsListeners = new Set();
  return g.__ngembaOpsListeners;
}

export function emitOpsEvent(event: string, data: unknown) {
  for (const fn of listeners()) {
    try {
      fn(event, data);
    } catch {
      // ignore broken listener
    }
  }
}

export function subscribeOpsEvents(fn: OpsListener): () => void {
  const set = listeners();
  set.add(fn);
  return () => set.delete(fn);
}
