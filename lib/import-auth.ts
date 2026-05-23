import { timingSafeEqual } from "crypto";

/**
 * Validate the Authorization header for the import endpoint against
 * MEAL_IMPORT_API_KEY. Fails closed: returns false if the env var is unset/empty,
 * the header is missing, or it lacks the "Bearer " prefix. Constant-time compare.
 */
export function isValidImportKey(
  authHeader: string | null | undefined
): boolean {
  const expected = process.env.MEAL_IMPORT_API_KEY;
  if (!expected) return false;
  if (!authHeader) return false;

  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) return false;

  const provided = authHeader.slice(prefix.length);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Length check is intentional: it prevents timingSafeEqual from throwing on
  // unequal-length buffers, and leaking only key byte-length is acceptable for API keys.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
