import type { RoleCode } from '@/db/schema'

export type Permission =
  | 'booking:create'
  | 'booking:read_own'
  | 'booking:read_all'
  | 'booking:approve'
  | 'booking:reject'
  | 'booking:cancel'
  | 'lab:manage'
  | 'user:manage'
  | 'audit:read'

const ROLE_PERMISSIONS: Record<RoleCode, readonly Permission[]> = {
  mahasiswa: ['booking:create', 'booking:read_own', 'booking:cancel'],
  dosen: ['booking:create', 'booking:read_own', 'booking:cancel'],
  aslab: ['booking:read_all', 'booking:approve', 'booking:reject', 'audit:read'],
  kaprodi: ['booking:read_all', 'audit:read'],
  pembina_lab: ['booking:read_all', 'booking:approve', 'booking:reject', 'lab:manage', 'audit:read'],
  admin: [
    'booking:read_all', 'booking:approve', 'booking:reject', 'booking:cancel',
    'lab:manage', 'user:manage', 'audit:read',
  ],
}

export function hasPermission(role: string | null | undefined, permission: Permission) {
  return Boolean(role && ROLE_PERMISSIONS[role as RoleCode]?.includes(permission))
}

export function isStaffRole(role: string | null | undefined) {
  return ['aslab', 'kaprodi', 'pembina_lab', 'admin'].includes(role ?? '')
}

export function isBookingApprover(role: string | null | undefined) {
  return hasPermission(role, 'booking:approve')
}
