import { z } from "zod";

const latitude = z.number().finite().min(-90).max(90);
const longitude = z.number().finite().min(-180).max(180);

const coordinatePair = {
  latitude: latitude.nullable().optional(),
  longitude: longitude.nullable().optional(),
};

const coordinatesTogether = (
  value: { latitude?: number | null; longitude?: number | null },
) => (value.latitude == null) === (value.longitude == null);

export const createSessionSchema = z
  .object({
    ownerName: z.string().trim().min(2).max(100),
    destination: z.string().trim().min(2).max(200),
    durationMinutes: z.number().int().min(5).max(720),
    travelMode: z.enum(["WALKING", "CYCLING", "PUBLIC_TRANSPORT", "CAR", "OTHER"]),
    trustedContactName: z.string().trim().min(2).max(100),
    trustedContactPhone: z
      .string()
      .trim()
      .min(7)
      .max(30)
      .regex(/^\+?[0-9][0-9\s()-]{6,29}$/, "Enter a valid phone number"),
    ...coordinatePair,
  })
  .strict()
  .refine(coordinatesTogether, {
    message: "Latitude and longitude must be provided together",
    path: ["latitude"],
  });

export const checkInSchema = z
  .object({
    ...coordinatePair,
  })
  .strict()
  .refine(coordinatesTogether, {
    message: "Latitude and longitude must be provided together",
    path: ["latitude"],
  });

export const locationSchema = z
  .object({
    latitude,
    longitude,
  })
  .strict();

export const sosSchema = z
  .object({
    message: z.string().trim().min(1).max(300).optional(),
    ...coordinatePair,
  })
  .strict()
  .refine(coordinatesTogether, {
    message: "Latitude and longitude must be provided together",
    path: ["latitude"],
  });

export const idSchema = z.string().uuid();
export const shareCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{20,32}$/);

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type SosInput = z.infer<typeof sosSchema>;
