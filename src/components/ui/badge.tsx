import { cn, getStatusColor, getStatusLabel } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getStatusColor(status),
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}

interface RoleBadgeProps {
  role: string
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const colors: Record<string, string> = {
    mahasiswa: 'bg-blue-100 text-blue-800',
    dosen: 'bg-purple-100 text-purple-800',
    admin: 'bg-orange-100 text-orange-800',
  }
  const labels: Record<string, string> = {
    mahasiswa: 'Mahasiswa',
    dosen: 'Dosen',
    admin: 'Admin',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colors[role] ?? 'bg-gray-100 text-gray-700',
        className
      )}
    >
      {labels[role] ?? role}
    </span>
  )
}
