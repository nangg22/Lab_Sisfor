import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { RoleBadge } from '@/components/ui/badge'
import { ProfileForm } from './profile-form'
import { ChangePasswordForm } from './change-password-form'
import { LogoutButton } from './logout-button'
import { User, KeyRound } from 'lucide-react'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [profile] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!profile) redirect('/auth/login')

  const infoRows = [
    { label: 'NIM / NIP',   value: profile.institutionalId ?? '—' },
    { label: 'Email',       value: profile.email },
    { label: 'Bergabung',   value: profile.createdAt.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) },
  ]

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Profil Saya</h1>
        <p className="text-sm font-bold text-slate-500 mt-0.5">Kelola informasi akun Anda.</p>
      </div>

      {/* Profile card */}
      <div className="neo-card overflow-hidden">
        <div
          aria-hidden="true"
          style={{ height: '5px', background: 'repeating-linear-gradient(90deg,#fbbf24 0px,#fbbf24 12px,#0f172a 12px,#0f172a 14px)' }}
        />
        <div className="p-4 sm:p-5 flex flex-wrap items-center gap-4 border-b-2 border-slate-100">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-300 border border-slate-200 shadow-sm text-slate-950 text-2xl font-black">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 truncate">{profile.fullName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <RoleBadge role={profile.role} />
              <span className="text-xs font-bold text-slate-400 truncate">{profile.email}</span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {infoRows.map((row, i) => (
            <div key={row.label} className={`px-4 py-3 flex flex-col gap-0.5 sm:grid sm:grid-cols-2 sm:gap-3 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}>
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">{row.label}</span>
              <span className="text-sm font-bold text-slate-900 break-all">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="neo-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Keamanan akun</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Keluar setelah selesai menggunakan perangkat ini untuk menjaga keamanan akun.
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Edit profile */}
      <div className="neo-card overflow-hidden">
        <div className="bg-amber-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
          <User className="h-4 w-4 text-slate-700" strokeWidth={2} />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Edit Profil</h3>
        </div>
        <div className="p-4 sm:p-5">
          <ProfileForm
            userId={profile.id}
            initialFullName={profile.fullName}
            initialInstitutionalId={profile.institutionalId ?? ''}
            role={profile.role}
          />
        </div>
      </div>

      {/* Change password */}
      <div className="neo-card overflow-hidden">
        <div className="bg-amber-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-slate-700" strokeWidth={2} />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Ganti Kata Sandi</h3>
        </div>
        <div className="p-4 sm:p-5">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
