import { cn, getStatusLabel } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

// Status → { bg, text, dot } classes
function getStatusStyle(status: string): { bg: string; text: string; dot: string } {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    PENDING:   { bg: 'bg-amber-50  border border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
    APPROVED:  { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    REJECTED:  { bg: 'bg-rose-50   border border-rose-200',   text: 'text-rose-700',   dot: 'bg-rose-500'   },
    CANCELLED: { bg: 'bg-slate-100 border border-slate-200',  text: 'text-slate-500',  dot: 'bg-slate-400'  },
    BLOCKED:   { bg: 'bg-slate-800',                           text: 'text-white',      dot: 'bg-slate-400'  },
  }
  return map[status] ?? { bg: 'bg-slate-100 border border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' }
}

export function StatusBadge({ status, className }: BadgeProps) {
  const style = getStatusStyle(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none whitespace-nowrap',
        style.bg,
        style.text,
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
  const map: Record<string, { bg: string; text: string; label: string }> = {
    mahasiswa: { bg: 'bg-blue-50 border border-blue-200',   text: 'text-blue-700',   label: 'Mahasiswa' },
    dosen:     { bg: 'bg-violet-50 border border-violet-200', text: 'text-violet-700', label: 'Dosen' },
    admin:     { bg: 'bg-orange-50 border border-orange-200', text: 'text-orange-700', label: 'Admin' },
  }
  const style = map[role] ?? { bg: 'bg-slate-100 border border-slate-200', text: 'text-slate-600', label: role }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none',
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  )
}
