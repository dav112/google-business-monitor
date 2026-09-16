import crypto from "crypto";

// ENCRYPTION_KEY must be 32 bytes hex (64 chars) or 32 chars utf8
// Derive 32-byte key via SHA256 if not exactly 32 bytes

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || "";
  if (!raw) {
    // dev fallback: derive from JWT_SECRET so not plaintext null
    const fallback = process.env.JWT_SECRET || "dev-fallback-32-chars-minimum!!!!";
    return crypto.createHash("sha256").update(fallback).digest();
  }
  // if hex 64 chars
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  // if 32 chars raw
  if (raw.length === 32) return Buffer.from(raw, "utf8");
  // otherwise hash
  return crypto.createHash("sha256").update(raw).digest();
}

// AES-256-GCM: iv 12 bytes, tag 16 bytes, stored as base64 "iv:tag:ciphertext"
export function encrypt(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let enc = cipher.update(plain, "utf8", "base64");
  enc += cipher.final("base64");
  const tag = cipher.getAuthTag().toString("base64");
  return `${iv.toString("base64")}:${tag}:${enc}`;
}

export function decrypt(encStr: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = encStr.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted format");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  let dec = decipher.update(dataB64, "base64", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

export function isEncrypted(val: string): boolean {
  return val.includes(":") && val.split(":").length === 3 && val.length > 40;
}

export function encryptIfNeeded(val: string): string {
  if (!val) return val;
  if (isEncrypted(val)) return val; // already
  // heuristic: access tokens are short-lived, still encrypt refresh + botToken
  return encrypt(val);
}

export function decryptIfNeeded(val: string): string {
  if (!val) return val;
  if (!isEncrypted(val)) return val;
  try {
    return decrypt(val);
  } catch {
    return val; // fallback plaintext
  }
}
