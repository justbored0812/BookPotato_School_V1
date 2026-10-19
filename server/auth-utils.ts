import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Hashes a plaintext password using scrypt with a random salt.
 * The returned string is in the format: "salt.hash" (both hex-encoded).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}.${buf.toString("hex")}`;
}

/**
 * Checks if a stored password string looks like a hashed value (salt.hash format).
 * Used to detect plaintext passwords during the migration period.
 */
function isHashed(stored: string): boolean {
  const parts = stored.split(".");
  // A valid hash is "16-byte salt in hex (32 chars) . 64-byte hash in hex (128 chars)"
  return parts.length === 2 && parts[0].length === 32 && parts[1].length === 128;
}

/**
 * Compares a supplied plaintext password against a stored value.
 * Supports graceful migration: if the stored password is still plaintext,
 * it falls back to a direct comparison and returns { match: true, needsRehash: true }
 * so the caller can update the database.
 */
export async function comparePasswords(
  supplied: string,
  stored: string
): Promise<{ match: boolean; needsRehash: boolean }> {
  if (isHashed(stored)) {
    // Stored value is a proper scrypt hash — verify securely
    const [salt, hash] = stored.split(".");
    const hashBuf = Buffer.from(hash, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

    const match = timingSafeEqual(hashBuf, suppliedBuf);
    return { match, needsRehash: false };
  } else {
    // Stored value is plaintext — fallback for migration
    const match = stored === supplied;
    return { match, needsRehash: match }; // Only rehash if the plaintext matched
  }
}
