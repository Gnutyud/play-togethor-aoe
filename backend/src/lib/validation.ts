import { z } from "zod";

/**
 * User Registration Schema
 */
export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * User Login Schema
 */
export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Create Room Schema
 */
export const CreateRoomSchema = z.object({
  name: z
    .string()
    .min(3, "Room name must be at least 3 characters")
    .max(50, "Room name must be less than 50 characters")
    .trim(),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(50, "Password is too long")
    .optional()
    .or(z.literal("")),
  maxPlayers: z
    .number()
    .min(2, "Room must allow at least 2 players")
    .max(8, "Room cannot exceed 8 players")
    .default(8),
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

/**
 * Join Room Schema
 */
export const JoinRoomSchema = z.object({
  password: z.string().optional(),
});

export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;

/**
 * Heartbeat Schema
 */
export const HeartbeatSchema = z.object({
  timestamp: z.number().optional(),
});

export type HeartbeatInput = z.infer<typeof HeartbeatSchema>;

/**
 * Helper function to validate request body
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: z.ZodError;
    } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}
