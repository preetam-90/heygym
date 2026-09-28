/**
 * Granular RBAC permission map for the admin panel (Layer 1).
 *
 * Roles use SCREAMING_SNAKE_CASE, consistent with the existing
 * `requireRole('ADMIN')` usage. The Prisma `Role` enum currently only
 * contains USER / GYM_OWNER / ADMIN; the extra admin sub-roles
 * (SUPER_ADMIN, MODERATOR, FINANCE_ADMIN, SUPPORT_ADMIN) are forward-looking
 * and already enforced here so no code change is needed when the enum grows.
 */

export const PERMISSIONS = [
  'users.view',
  'users.manage',
  'gyms.view',
  'gyms.approve',
  'reviews.view',
  'reviews.moderate',
  'reports.view',
  'payments.view',
  'payments.manage',
  'enquiries.view',
  'enquiries.manage',
  'bookings.view',
  'bookings.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'USER'
  | 'GYM_OWNER';

const ALL_PERMISSIONS: string[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  // SuperAdmin bypasses checks in code anyway; listed fully for completeness.
  SUPER_ADMIN: ALL_PERMISSIONS,
  // Admin gets most permissions (full operational access).
  ADMIN: ALL_PERMISSIONS,
  // Moderator: users / gyms / reviews / reports scopes (no gym approval, no payments).
  MODERATOR: ['users.view', 'gyms.view', 'reviews.view', 'reviews.moderate', 'reports.view'],
  // FinanceAdmin: payments scope.
  FINANCE_ADMIN: ['payments.view', 'payments.manage', 'reports.view'],
  // SupportAdmin: users / enquiries / bookings scopes.
  SUPPORT_ADMIN: [
    'users.view',
    'enquiries.view',
    'enquiries.manage',
    'bookings.view',
    'bookings.manage',
  ],
  // Regular platform roles have no admin permissions.
  USER: [],
  GYM_OWNER: [],
};

/** Roles that bypass all permission checks (no such users exist yet). */
const SUPER_ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SuperAdmin']);

export function isSuperAdmin(role: unknown): boolean {
  return typeof role === 'string' && SUPER_ADMIN_ROLES.has(role);
}

export function hasPermission(role: unknown, permission: string): boolean {
  if (isSuperAdmin(role)) return true;
  if (typeof role !== 'string') return false;
  const granted = (ROLE_PERMISSIONS as Record<string, string[]>)[role];
  if (!granted) return false;
  if (granted.includes('*')) return true;
  return granted.includes(permission);
}

/**
 * Build a Fastify preHandler enforcing a granular permission.
 * Must be chained as: [authenticate, requireRole(...), requirePermission(...)].
 * Denies with 403 `{ success:false, error:{ code:'FORBIDDEN' } }`.
 */
export function buildRequirePermission() {
  return function requirePermission(permission: string) {
    return async function (request: any, reply: any) {
      if (!request.user) {
        try {
          await request.jwtVerify();
        } catch (_err) {
          return reply.status(401).send({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          });
        }
      }
      const role = request.user?.role;
      if (!hasPermission(role, permission)) {
        return reply.status(403).send({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        });
      }
    };
  };
}
