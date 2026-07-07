import { API_BASE_URL } from "../config";
import { LatLon } from "../types";

/**
 * The only network calls the app makes — all Emergency Share, all opt-in.
 * Trip recording and ghost comparison are fully on-device.
 */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body);
  }

  return (await response.json()) as T;
}

export class ApiError extends Error {
  constructor(public status: number, body: string) {
    super(`Request failed (${status}): ${body}`);
  }
}

export interface CreateShareResult {
  token: string;
  url: string;
  expiresAt: string;
}

export function createShare(params: {
  durationMinutes?: number;
  destinationLabel?: string;
  emergencyContact?: string;
}): Promise<CreateShareResult> {
  return request<CreateShareResult>("/share", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function postSharePosition(
  token: string,
  position: LatLon & { headingDegrees?: number; speedKph?: number; etaSeconds?: number }
): Promise<{ ok: boolean; expiresAt: string }> {
  return request(`/share/${token}/position`, {
    method: "PUT",
    body: JSON.stringify(position),
  });
}
