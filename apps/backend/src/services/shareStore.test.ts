import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Redis from "ioredis";
import { config } from "../config";
import { ShareStore } from "./shareStore";

/**
 * Minimal in-memory stand-in for the ioredis commands ShareStore uses
 * (set with EX/PX, get, pttl, del), driven by vitest fake timers so TTL
 * behavior is tested against simulated wall-clock time.
 */
class FakeRedis {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async set(key: string, value: string, mode: "EX" | "PX", ttl: number): Promise<"OK"> {
    const ttlMs = mode === "EX" ? ttl * 1000 : ttl;
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return "OK";
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async pttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : -2;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

function makeStore(): { store: ShareStore; redis: FakeRedis } {
  const redis = new FakeRedis();
  return { store: new ShareStore(redis as unknown as Redis), redis };
}

describe("ShareStore TTL behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clamps requested duration to the configured hard cap", async () => {
    const { store } = makeStore();
    const session = await store.create({ durationMinutes: 10_000 }); // way past 12h

    const lifetimeSeconds = (session.expiresAt - session.createdAt) / 1000;
    expect(lifetimeSeconds).toBe(config.shareTtlMaxSeconds);
  });

  it("honors shorter requested durations", async () => {
    const { store } = makeStore();
    const session = await store.create({ durationMinutes: 30 });
    expect((session.expiresAt - session.createdAt) / 1000).toBe(30 * 60);
  });

  it("position updates do not extend the session past its original expiry", async () => {
    const { store } = makeStore();
    const session = await store.create({ durationMinutes: 60 });

    // 50 minutes in, post a position update...
    vi.advanceTimersByTime(50 * 60 * 1000);
    const updated = await store.updatePosition(session.token, { lat: 1, lon: 2 });
    expect(updated).not.toBeNull();
    expect(updated!.expiresAt).toBe(session.expiresAt);

    // ...and 11 more minutes later (past the original expiry) the session is gone,
    // even though an update landed 10 minutes before the end.
    vi.advanceTimersByTime(11 * 60 * 1000);
    expect(await store.get(session.token)).toBeNull();
    expect(await store.updatePosition(session.token, { lat: 1, lon: 2 })).toBeNull();
  });

  it("returns null for expired or unknown sessions", async () => {
    const { store } = makeStore();
    const session = await store.create({ durationMinutes: 15 });

    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(await store.get(session.token)).toBeNull();
    expect(await store.get("not-a-real-token")).toBeNull();
  });

  it("stores the last position on update without altering expiry", async () => {
    const { store } = makeStore();
    const session = await store.create({ durationMinutes: 60, destinationLabel: "Home" });

    vi.advanceTimersByTime(5 * 60 * 1000);
    await store.updatePosition(session.token, { lat: 40.7, lon: -74.0, speedKph: 32 });

    const fetched = await store.get(session.token);
    expect(fetched!.lastPosition).toMatchObject({ lat: 40.7, lon: -74.0, speedKph: 32 });
    expect(fetched!.expiresAt).toBe(session.expiresAt);
    expect(fetched!.destinationLabel).toBe("Home");
  });
});
