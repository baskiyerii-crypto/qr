import { createHmac } from 'crypto';
import { QR_ROTATION_WINDOW_SECONDS, QR_ALLOWED_WINDOWS } from '@qr/shared';

export function currentQrWindow(now = Date.now()): number {
  return Math.floor(now / 1000 / QR_ROTATION_WINDOW_SECONDS);
}

export function generateBranchQrToken(secret: string, windowIndex: number): string {
  return createHmac('sha256', secret)
    .update(String(windowIndex))
    .digest('hex')
    .slice(0, 16);
}

/** Accepts tokens from the current window and the previous N windows (clock skew tolerance). */
export function verifyBranchQrToken(secret: string, token: string, now = Date.now()): boolean {
  const current = currentQrWindow(now);
  for (let i = 0; i < QR_ALLOWED_WINDOWS; i++) {
    if (generateBranchQrToken(secret, current - i) === token) return true;
  }
  return false;
}
