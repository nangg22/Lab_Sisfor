import { NextResponse } from 'next/server'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '@/db'
import { emailVerificationTokens, users } from '@/db/schema'
import { hashEmailVerificationToken } from '@/lib/email-verification'

export async function POST(request: Request) {
  const { token } = await request.json()
  if (typeof token !== 'string' || token.length < 32) {
    return NextResponse.json({ error: 'Token verifikasi tidak valid.' }, { status: 400 })
  }

  const tokenHash = hashEmailVerificationToken(token)
  const now = new Date()

  try {
    await db.transaction(async (tx) => {
      const [verification] = await tx
        .select({ id: emailVerificationTokens.id, userId: emailVerificationTokens.userId })
        .from(emailVerificationTokens)
        .where(and(eq(emailVerificationTokens.tokenHash, tokenHash), gt(emailVerificationTokens.expiresAt, now)))
        .limit(1)

      if (!verification) throw new Error('INVALID_VERIFICATION_TOKEN')

      await tx.update(users)
        .set({ verificationStatus: 'ACTIVE', isActive: true, updatedAt: now })
        .where(eq(users.id, verification.userId))

      await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, verification.id))
    })
  } catch (error) {
    if ((error as Error).message === 'INVALID_VERIFICATION_TOKEN') {
      return NextResponse.json({ error: 'Token verifikasi tidak valid atau sudah kedaluwarsa.' }, { status: 400 })
    }
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Verifikasi email gagal diproses.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
