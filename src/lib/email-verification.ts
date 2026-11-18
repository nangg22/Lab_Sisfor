import { createHash, randomBytes } from 'node:crypto'

export const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24

export function createEmailVerificationToken() {
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
  return { rawToken, tokenHash, expiresAt }
}

export function hashEmailVerificationToken(rawToken: string) {
  return createHash('sha256').update(rawToken).digest('hex')
}
