import { cn, getStatusLabel } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

// Pop Neo-Academic Badge Styles (Crisp 1.5px black border + vibrant color fill)
function getStatusStyle(status: string): { bg: string; text: string; dot: string } {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    APPROVED: {
      bg: 'bg-emerald-400 text-slate-950',
      text: 'text-slate-950',
      dot: 'bg-slate-950',
    },
    PENDING: {
      bg: 'bg-amber-300 text-slate-950',
      text: 'text-slate-950',
      dot: 'bg-slate-950',
    },
    REJECTED: {
      bg: 'bg-rose-400 text-white',
      text: 'text-white',
      dot: 'bg-white',
    },
    CANCELLED: {
      bg: 'bg-slate-200 text-slate-800',
      text: 'text-slate-800',
      dot: 'bg-slate-600',
    },
    BLOCKED: {
      bg: 'bg-slate-900 text-white',
      text: 'text-white',
      dot: 'bg-rose-400',
    },
  }
  return (
    map[status] ?? {
      bg: 'bg-slate-100 text-slate-800',
      text: 'text-slate-800',
      dot: 'bg-slate-500',
    }
  )
}

export function StatusBadge({ status, className }: BadgeProps) {
  const style = getStatusStyle(status)
  return (
    <span
      className={cn(
        'neo-badge whitespace-nowrap',
        style.bg,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
      <span>{getStatusLabel(status)}</span>
    </span>
  )
}

interface RoleBadgeProps {
  role: string
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const map: Record<string, { bg: string; label: string }> = {
    mahasiswa: { bg: 'bg-blue-300 text-slate-950', label: 'Mahasiswa' },
    dosen: { bg: 'bg-purple-300 text-slate-950', label: 'Dosen' },
    admin: { bg: 'bg-amber-300 text-slate-950', label: 'Admin' },
  }
  const style = map[role] ?? { bg: 'bg-slate-200 text-slate-800', label: role }

  return (
    <span
      className={cn(
        'neo-badge text-[10px] uppercase tracking-wide',
        style.bg,
        className
      )}
    >
      {style.label}
    </span>
  )
}
