export interface Saver<T> {
  // Save `data` after `delayMs`. A newer call replaces one that has not run yet.
  schedule: (data: T, delayMs: number) => void;
  // Save any waiting data now.
  flush: () => Promise<void>;
  // Try the latest data again, after a failed save.
  retry: () => Promise<void>;
}

// Saves one value at a time, in order, and reports whether each save worked.
// A change can be asked to wait a moment, so a burst of quick changes becomes one save.
export function createSaver<T>(
  write: (data: T) => Promise<void>,
  onResult: (ok: boolean) => void
): Saver<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { data: T } | null = null;
  let last: { data: T } | null = null;
  let chain: Promise<void> = Promise.resolve();

  const run = (data: T): Promise<void> => {
    chain = chain.then(async () => {
      try {
        await write(data);
        onResult(true);
      } catch {
        onResult(false);
      }
    });
    return chain;
  };

  const clear = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const flush = (): Promise<void> => {
    clear();
    if (pending === null) return chain;
    const { data } = pending;
    pending = null;
    return run(data);
  };

  return {
    schedule(data, delayMs) {
      pending = { data };
      last = { data };
      clear();
      if (delayMs <= 0) {
        void flush();
        return;
      }
      timer = setTimeout(() => {
        timer = null;
        void flush();
      }, delayMs);
    },
    flush,
    retry() {
      clear();
      if (pending !== null) return flush();
      if (last === null) return chain;
      return run(last.data);
    },
  };
}
