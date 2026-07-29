interface RateLimiterOptions {
  maxTokens: number;
  refillRate: number;
  refillIntervalMs: number;
}

export class RateLimiter {
  tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private refillIntervalMs: number;
  private waiting: Array<() => void> = [];
  private intervalId: ReturnType<typeof setInterval>;

  constructor(opts: RateLimiterOptions) {
    this.maxTokens = opts.maxTokens;
    this.tokens = opts.maxTokens;
    this.refillRate = opts.refillRate;
    this.refillIntervalMs = opts.refillIntervalMs;
    this.intervalId = setInterval(() => this.refill(), this.refillIntervalMs);
  }

  dispose(): void {
    clearInterval(this.intervalId);
  }

  acquire(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  private refill(): void {
    const before = this.tokens;
    this.tokens = Math.min(this.maxTokens, this.tokens + this.refillRate);
    const gained = this.tokens - before;
    for (let i = 0; i < gained && this.waiting.length > 0; i++) {
      const resolve = this.waiting.shift()!;
      this.tokens--;
      resolve();
    }
  }
}
