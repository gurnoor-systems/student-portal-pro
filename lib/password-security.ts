import crypto from "crypto";

/**
 * Secure Password Hashing & Constant-Time Verification
 * Uses PBKDF2 (Password-Based Key Derivation Function 2) with SHA-512 and 100,000 iterations.
 */

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = "sha512";

/**
 * Generates a cryptographically secure salted hash for user passwords.
 * Format: pbkdf2$iterations$salt$hash
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `pbkdf2$${ITERATIONS}$${salt}$${derivedKey}`;
}

/**
 * Verifies a candidate password against stored hash.
 * Gracefully handles legacy plaintext credentials and flags them for auto-upgrade.
 */
export function verifyPassword(password: string, storedHash: string): { isValid: boolean; needsUpgrade: boolean } {
  if (!password || !storedHash) return { isValid: false, needsUpgrade: false };

  // Check if hash matches PBKDF2 format
  if (storedHash.startsWith("pbkdf2$")) {
    const parts = storedHash.split("$");
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const originalHash = parts[3];

      const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST).toString("hex");
      
      try {
        const isMatch = crypto.timingSafeEqual(
          Buffer.from(derivedKey, "hex"),
          Buffer.from(originalHash, "hex")
        );
        return { isValid: isMatch, needsUpgrade: false };
      } catch {
        return { isValid: false, needsUpgrade: false };
      }
    }
  }

  // Legacy plaintext fallback for existing accounts (Flags for automatic upgrade on login)
  if (password === storedHash) {
    return { isValid: true, needsUpgrade: true };
  }

  return { isValid: false, needsUpgrade: false };
}
