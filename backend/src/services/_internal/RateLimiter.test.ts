import { describe, it, expect, vi, afterEach } from 'vitest';
import { RateLimiter } from './RateLimiter';

describe('RateLimiter', () => {
  const limiters: RateLimiter[] = [];

  afterEach(() => {
    vi.useRealTimers();
    for (const l of limiters) l.dispose();
    limiters.length = 0;
  });

  it('should allow requests within limit', async () => {
    const limiter = new RateLimiter({ maxTokens: 10, refillRate: 10, refillIntervalMs: 1000 });
    limiters.push(limiter);
    await limiter.acquire();
    expect(limiter.tokens).toBe(9);
  });

  it('should block when tokens exhausted', async () => {
    const limiter = new RateLimiter({ maxTokens: 2, refillRate: 1, refillIntervalMs: 50 });
    limiters.push(limiter);
    await limiter.acquire();
    await limiter.acquire();
    let resolved = false;
    limiter.acquire().then(() => { resolved = true; });
    expect(resolved).toBe(false);
  });

  it('should refill tokens over time', async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter({ maxTokens: 1, refillRate: 1, refillIntervalMs: 100 });
    limiters.push(limiter);
    await limiter.acquire();
    expect(limiter.tokens).toBe(0);
    vi.advanceTimersByTime(150);
    expect(limiter.tokens).toBe(1);
  });

  it('should not exceed max tokens', async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter({ maxTokens: 5, refillRate: 10, refillIntervalMs: 100 });
    limiters.push(limiter);
    vi.advanceTimersByTime(1000);
    expect(limiter.tokens).toBe(5);
  });
});
