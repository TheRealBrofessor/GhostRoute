export const createShareSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      durationMinutes: { type: "number", minimum: 1, maximum: 720 },
      destinationLabel: { type: "string", maxLength: 200 },
      emergencyContact: { type: "string", maxLength: 200 },
    },
  },
} as const;

export const positionUpdateSchema = {
  params: {
    type: "object",
    required: ["token"],
    properties: {
      token: { type: "string", minLength: 16, maxLength: 64 },
    },
  },
  body: {
    type: "object",
    required: ["lat", "lon"],
    additionalProperties: false,
    properties: {
      lat: { type: "number", minimum: -90, maximum: 90 },
      lon: { type: "number", minimum: -180, maximum: 180 },
      headingDegrees: { type: "number", minimum: 0, maximum: 360 },
      speedKph: { type: "number", minimum: 0, maximum: 400 },
      etaSeconds: { type: "number", minimum: 0 },
    },
  },
} as const;

export const getShareSchema = {
  params: {
    type: "object",
    required: ["token"],
    properties: {
      token: { type: "string", minLength: 16, maxLength: 64 },
    },
  },
} as const;
