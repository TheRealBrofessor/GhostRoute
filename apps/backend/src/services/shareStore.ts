import Redis from "ioredis";
import { config } from "../config";
import { CreateShareRequestBody, PositionUpdateBody, ShareSession } from "../types";
import { generateShareToken } from "../utils/token";

const KEY_PREFIX = "share:";

function keyFor(token: string): string {
  return `${KEY_PREFIX}${token}`;
}

export class ShareStore {
  constructor(private readonly redis: Redis) {}

  async create(body: CreateShareRequestBody): Promise<ShareSession> {
    const requestedSeconds = Math.max(1, Math.round((body.durationMinutes ?? 120) * 60));
    const ttlSeconds = Math.min(requestedSeconds, config.shareTtlMaxSeconds);
    const now = Date.now();

    const session: ShareSession = {
      token: generateShareToken(),
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
      destinationLabel: body.destinationLabel,
      emergencyContact: body.emergencyContact,
    };

    await this.redis.set(keyFor(session.token), JSON.stringify(session), "EX", ttlSeconds);
    return session;
  }

  async get(token: string): Promise<ShareSession | null> {
    const raw = await this.redis.get(keyFor(token));
    if (!raw) return null;
    return JSON.parse(raw) as ShareSession;
  }

  /**
   * Updates the traveler's live position without extending the session past
   * its original hard-capped expiry — we re-set with the *remaining* TTL,
   * never a fresh full TTL, so a stuck app can't keep a share alive forever.
   */
  async updatePosition(token: string, update: PositionUpdateBody): Promise<ShareSession | null> {
    const key = keyFor(token);
    const remainingMs = await this.redis.pttl(key);
    if (remainingMs === null || remainingMs <= 0) {
      return null;
    }

    const session = await this.get(token);
    if (!session) return null;

    session.lastPosition = {
      lat: update.lat,
      lon: update.lon,
      headingDegrees: update.headingDegrees,
      speedKph: update.speedKph,
      etaSeconds: update.etaSeconds,
      updatedAt: Date.now(),
    };

    await this.redis.set(key, JSON.stringify(session), "PX", remainingMs);
    return session;
  }

  async delete(token: string): Promise<void> {
    await this.redis.del(keyFor(token));
  }
}
