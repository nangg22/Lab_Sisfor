import { createHash, randomBytes } from 'node:crypto'

export const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60

export function createPasswordResetToken() {
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS)
  return { rawToken, tokenHash, expiresAt }
}

export function hashPasswordResetToken(rawToken: string) {
  return createHash('sha256').update(rawToken).digest('hex')
}
