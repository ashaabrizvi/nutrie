import { createHash } from "crypto";

export function normalizeInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashInput(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex");
}
