import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom = process.env.EMAIL_FROM

export function isEmailConfigured() {
  return Boolean(resendApiKey && emailFrom)
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!resendApiKey || !emailFrom) throw new Error('EMAIL_NOT_CONFIGURED')

  const resend = new Resend(resendApiKey)
  const { error } = await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: 'Reset kata sandi SIP-Lab',
    html: `<p>Anda meminta reset kata sandi SIP-Lab.</p><p><a href="${resetUrl}">Atur ulang kata sandi</a></p><p>Link ini berlaku selama 1 jam dan hanya dapat digunakan sekali.</p>`,
  })
  if (error) throw error
}
