import { cn, getStatusLabel } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

// Enterprise Subtle Tone Badges (Linear / Stripe style with subtle ring)
function getStatusStyle(status: string): { bg: string; text: string; ring: string; dot: string } {
  const map: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
    PENDING: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      ring: 'ring-1 ring-amber-600/20',
      dot: 'bg-amber-500',
    },
    APPROVED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      ring: 'ring-1 ring-emerald-600/20',
      dot: 'bg-emerald-500',
    },
    REJECTED: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      ring: 'ring-1 ring-rose-600/20',
      dot: 'bg-rose-500',
    },
    CANCELLED: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      ring: 'ring-1 ring-slate-400/20',
      dot: 'bg-slate-400',
    },
    BLOCKED: {
      bg: 'bg-slate-800',
      text: 'text-white',
      ring: 'ring-1 ring-slate-900',
      dot: 'bg-slate-400',
    },
  }
  return (
    map[status] ?? {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      ring: 'ring-1 ring-slate-200',
      dot: 'bg-slate-400',
    }
  )
}

export function StatusBadge({ status, className }: BadgeProps) {
  const style = getStatusStyle(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium leading-none whitespace-nowrap',
        style.bg,
        style.text,
        style.ring,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
      {getStatusLabel(status)}
    </span>
  )
}

interface RoleBadgeProps {
  role: string
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const map: Record<string, { bg: string; text: string; ring: string; label: string }> = {
    mahasiswa: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-1 ring-blue-600/20', label: 'Mahasiswa' },
    dosen: { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-1 ring-purple-600/20', label: 'Dosen' },
    admin: { bg: 'bg-slate-100', text: 'text-slate-800', ring: 'ring-1 ring-slate-400/20', label: 'Admin' },
  }
  const style = map[role] ?? { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-1 ring-slate-200', label: role }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-none',
        style.bg,
        style.text,
        style.ring,
        className
      )}
    >
      {style.label}
    </span>
  )
}
