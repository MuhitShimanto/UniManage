import Redis from 'ioredis';
import { env } from './env';

interface CacheEntry {
  value: string;
  expiresAt: number;
}

class CacheService {
  private redis: Redis | null = null;
  private memoryStore = new Map<string, CacheEntry>();

  constructor() {
    if (env.REDIS_URL) {
      try {
        this.redis = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 2,
          lazyConnect: true,
        });
        this.redis.on('error', () => {
          // Gracefully degrade to in-memory cache if Redis is unreachable
          this.redis = null;
        });
      } catch {
        this.redis = null;
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const raw = await this.redis.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        // Fallback to memory
      }
    }

    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 120): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.redis) {
      try {
        await this.redis.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback to memory
      }
    }

    this.memoryStore.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch {
        // Ignore Redis error
      }
    }

    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryStore.delete(key);
      }
    }
  }
}

export const cache = new CacheService();
