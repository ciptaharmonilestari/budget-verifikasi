import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLE_FLAGS, ROLE_PANEL, navForRole, type Panel, type RoleFlags } from "@/lib/reference-data";
import type { Role } from "@/generated/prisma/client";

export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  departmentId: string | null;
  panel: Panel;
  flags: RoleFlags;
  nav: string[];
}

/** Server Components/Actions must call this (or requireRole) themselves —
 * proxy.ts only does an optimistic cookie check, per Next.js 16 guidance
 * that Server Functions are reachable directly and must self-verify. */
export async function currentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role;
  return {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name ?? session.user.username,
    role,
    departmentId: session.user.departmentId,
    panel: ROLE_PANEL[role],
    flags: ROLE_FLAGS[role],
    nav: navForRole(role),
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new Error(`Akses ditolak — peran ${user.role} tidak berwenang untuk aksi ini.`);
  }
  return user;
}
