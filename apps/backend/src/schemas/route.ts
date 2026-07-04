const latLonSchema = {
  type: "object",
  required: ["lat", "lon"],
  additionalProperties: false,
  properties: {
    lat: { type: "number", minimum: -90, maximum: 90 },
    lon: { type: "number", minimum: -180, maximum: 180 },
  },
} as const;

export const routeRequestSchema = {
  body: {
    type: "object",
    required: ["origin", "destination", "mode", "travelMode"],
    additionalProperties: false,
    properties: {
      origin: latLonSchema,
      destination: latLonSchema,
      mode: { type: "string", enum: ["fastest", "balanced", "safest"] },
      travelMode: { type: "string", enum: ["walk", "bike", "drive"] },
    },
  },
} as const;
