// Tiny in-process stale-while-revalidate cache. Plain Map + TTL.
// Sets `x-cache: HIT|MISS|REVALIDATING` so we can verify cache
// behavior in DevTools during rehearsal.

import type { Request, Response, NextFunction } from "express";

interface Entry<T> {
  value: T;
  fetchedAt: number;
  staleAt: number;
  refreshing: boolean;
}

const store = new Map<string, Entry<unknown>>();

interface SwrOptions<T> {
  key: string;
  ttlMs: number;
  fetch: () => Promise<T>;
}

export async function swrCache<T>({
  key,
  ttlMs,
  fetch,
}: SwrOptions<T>): Promise<{ value: T; status: "HIT" | "MISS" | "REVALIDATING" }> {
  const now = Date.now();
  const cached = store.get(key) as Entry<T> | undefined;

  if (cached && now < cached.staleAt) {
    return { value: cached.value, status: "HIT" };
  }

  if (cached && !cached.refreshing) {
    cached.refreshing = true;
    void (async () => {
      try {
        const fresh = await fetch();
        store.set(key, {
          value: fresh,
          fetchedAt: Date.now(),
          staleAt: Date.now() + ttlMs,
          refreshing: false,
        });
      } catch {
        cached.refreshing = false;
      }
    })();
    return { value: cached.value, status: "REVALIDATING" };
  }

  const fresh = await fetch();
  store.set(key, {
    value: fresh,
    fetchedAt: Date.now(),
    staleAt: now + ttlMs,
    refreshing: false,
  });
  return { value: fresh, status: "MISS" };
}

export function withSwr<T>(
  ttlMs: number,
  keyFn: (req: Request) => string,
  fetcher: (req: Request) => Promise<T>,
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { value, status } = await swrCache<T>({
        key: keyFn(req),
        ttlMs,
        fetch: () => fetcher(req),
      });
      res.setHeader("x-cache", status);
      res.json(value);
    } catch (err) {
      next(err);
    }
  };
}
