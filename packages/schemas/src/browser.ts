import { z } from "zod";

export const CreateSessionRequest = z.object({
  url: z.string().url().optional(),
  width: z.number().int().min(320).max(3840).default(1280),
  height: z.number().int().min(240).max(2160).default(720),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequest>;

export const SessionResponse = z.object({
  session_id: z.string().uuid(),
  status: z.enum(["created", "active", "closed", "expired"]),
  url: z.string().optional(),
  created_at: z.string(),
  expires_at: z.string(),
});

export type SessionResponse = z.infer<typeof SessionResponse>;

export const ScreenshotRequest = z.object({
  full_page: z.boolean().default(false),
});

export type ScreenshotRequest = z.infer<typeof ScreenshotRequest>;

export const ScreenshotResponse = z.object({
  session_id: z.string().uuid(),
  screenshot_url: z.string(),
  captured_at: z.string(),
});

export type ScreenshotResponse = z.infer<typeof ScreenshotResponse>;
