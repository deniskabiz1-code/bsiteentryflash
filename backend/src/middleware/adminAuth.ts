import { Request } from 'express';

export function isAdminAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_SECRET?.trim();
  if (!expected) return false;

  const header =
    (req.headers['x-admin-secret'] as string | undefined)
    || (req.headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, '');

  return Boolean(header && header === expected);
}