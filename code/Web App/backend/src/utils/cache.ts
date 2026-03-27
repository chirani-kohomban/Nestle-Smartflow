class MemoryCache {
  private readonly store = new Map<string, { value: unknown; expiresAt: number }>();

  async getOrSet<T>(key: string, ttlMs: number, loader: () => Promise<T>) {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.expiresAt > now) {
      return existing.value as T;
    }

    const value = await loader();
    this.store.set(key, { value, expiresAt: now + ttlMs });
    return value;
  }

  invalidate(keyOrPrefix?: string) {
    if (!keyOrPrefix) {
      this.store.clear();
      return;
    }

    for (const key of this.store.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.store.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();