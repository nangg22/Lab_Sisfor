import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { RoleBadge } from '@/components/ui/badge'
import { ProfileForm } from './profile-form'
import { ChangePasswordForm } from './change-password-form'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const [profile] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!profile) redirect('/auth/login')

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="mt-1 text-gray-500">Kelola informasi akun Anda.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-2xl font-bold">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{profile.fullName}</h2>
            <div className="mt-1 flex items-center gap-2">
              <RoleBadge role={profile.role} />
              <span className="text-sm text-gray-400">{profile.email}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">NIM / NIP</span>
            <span className="text-gray-900 font-medium">{profile.institutionalId ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">{profile.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Bergabung</span>
            <span className="text-gray-900">
              {profile.createdAt.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Edit Profil</h3>
        <ProfileForm
          userId={profile.id}
          initialFullName={profile.fullName}
          initialInstitutionalId={profile.institutionalId ?? ''}
          role={profile.role}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Ganti Kata Sandi</h3>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
