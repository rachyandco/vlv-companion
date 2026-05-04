import * as Crypto from "expo-crypto";

const HEX = "0123456789abcdef";

export function randomHex(bytes: number): string {
  const buffer = Crypto.getRandomBytes(bytes);
  let out = "";
  for (let i = 0; i < buffer.length; i++) {
    const b = buffer[i] ?? 0;
    out += HEX[(b >> 4) & 0xf];
    out += HEX[b & 0xf];
  }
  return out;
}

/**
 * W3C Trace Context "traceparent": 00-<32hex>-<16hex>-<flags>.
 * Useful when reporting issues to Volvo support — they can grep their logs by trace-id.
 */
export function newTraceparent(): string {
  return `00-${randomHex(16)}-${randomHex(8)}-01`;
}
