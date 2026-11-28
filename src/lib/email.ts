import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom    = process.env.EMAIL_FROM ?? 'SIP-Lab Sisfor <noreply@resend.dev>'

export function isEmailConfigured(): boolean {
  return Boolean(resendApiKey)
}

function passwordResetHtml(resetUrl: string, userName: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Kata Sandi — SIP-Lab Sisfor</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #0f172a;border-radius:14px;overflow:hidden;box-shadow:4px 4px 0 #0f172a;">
          <!-- Amber stripe header -->
          <tr>
            <td height="6" style="background:repeating-linear-gradient(90deg,#fbbf24 0,#fbbf24 12px,#0f172a 12px,#0f172a 14px);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Brand -->
          <tr>
            <td style="background:#fbbf24;padding:20px 32px;border-bottom:2px solid #0f172a;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0f172a;border-radius:10px;padding:8px 12px;">
                    <span style="color:#fbbf24;font-size:14px;font-weight:900;letter-spacing:-0.02em;">SIP-Lab</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#0f172a;font-size:13px;font-weight:800;">Sistem Informasi Peminjaman Laboratorium</span><br/>
                    <span style="color:#1e293b;font-size:11px;font-weight:600;">Prodi Sistem Informasi · UISI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">Reset Kata Sandi</h1>
              <p style="margin:0 0 20px;font-size:14px;font-weight:600;color:#475569;line-height:1.6;">
                Halo, <strong style="color:#0f172a;">${userName}</strong>.<br/>
                Kami menerima permintaan reset kata sandi untuk akun kamu di SIP-Lab Sisfor.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#2563eb;border:2px solid #0f172a;border-radius:10px;box-shadow:3px 3px 0 #0f172a;">
                    <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:900;color:#ffffff;text-decoration:none;letter-spacing:0.01em;text-transform:uppercase;">
                      Atur Ulang Kata Sandi
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table cellpadding="0" cellspacing="0" style="background:#fffbeb;border:2px solid #0f172a;border-radius:10px;margin-bottom:20px;width:100%;">
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;font-size:12px;font-weight:700;color:#92400e;">
                      ⏰ Link ini <strong>berlaku 1 jam</strong> dan hanya dapat digunakan <strong>satu kali</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;font-weight:600;color:#94a3b8;line-height:1.6;">
                Jika kamu tidak meminta reset kata sandi, abaikan email ini. Akun kamu tetap aman.<br/>
                Jika tombol di atas tidak bekerja, salin dan tempel URL berikut ke browser:
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#2563eb;word-break:break-all;">
                <a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:2px solid #0f172a;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;">
                SIP-Lab Sisfor · Sistem Informasi UISI · Kampus B UISI Gresik
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetUrl: string,
): Promise<void> {
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY belum dikonfigurasi di .env.local')
  }

  const resend = new Resend(resendApiKey)

  const { error } = await resend.emails.send({
    from: emailFrom,
    to,
    subject: 'Reset Kata Sandi — SIP-Lab Sisfor',
    html: passwordResetHtml(resetUrl, userName),
  })

  if (error) {
    throw new Error(`Gagal mengirim email: ${error.message}`)
  }
}

export async function sendVerificationEmail(
  to: string,
  userName: string,
  verifyUrl: string,
): Promise<void> {
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY belum dikonfigurasi')
  }

  const resend = new Resend(resendApiKey)
  const { error } = await resend.emails.send({
    from: emailFrom,
    to,
    subject: 'Verifikasi Akun UISI — SIP-Lab Sisfor',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:2px solid #0f172a;border-radius:12px;">
        <h2 style="margin:0 0 12px;color:#0f172a;">Verifikasi Email UISI Anda</h2>
        <p style="color:#334155;font-size:14px;line-height:1.6;">
          Halo <strong>${userName}</strong>,<br/>
          Terima kasih telah mendaftar di <strong>SIP-Lab Sisfor UISI</strong>. Klik tombol di bawah untuk mengaktifkan akun Anda:
        </p>
        <p style="margin:24px 0;">
          <a href="${verifyUrl}" style="background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
            Verifikasi &amp; Aktifkan Akun
          </a>
        </p>
        <p style="color:#64748b;font-size:12px;">Atau salin link ini: <a href="${verifyUrl}">${verifyUrl}</a></p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`Gagal mengirim email verifikasi: ${error.message}`)
  }
}
