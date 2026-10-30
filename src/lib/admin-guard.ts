/**
 * The admin check for every admin server function. An admin needs the admin role AND a session
 * that passed the authenticator-app step (Supabase assurance level `aal2`). The database's
 * has_role() requires the same (migration 20261030120000_admin_role_requires_mfa.sql), so RLS
 * agrees; checking the claim here too keeps MFA required against a database without it.
 */
type HasRoleClient = {
  rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => unknown;
};

export type AdminGuardContext = { supabase: HasRoleClient; userId: string; claims?: unknown };

/** True when the session's JWT says the second factor was verified (`aal2`). */
export function sessionPassedMfa(claims: unknown): boolean {
  return typeof claims === "object" && claims !== null && Reflect.get(claims, "aal") === "aal2";
}

export async function isAdminSession(context: AdminGuardContext): Promise<boolean> {
  if (!sessionPassedMfa(context.claims)) return false;
  const { data, error } = (await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  })) as { data: boolean | null; error: unknown };
  if (error) throw new Error("Could not verify admin access.");
  return Boolean(data);
}

export async function requireAdminSession(context: AdminGuardContext): Promise<void> {
  if (!(await isAdminSession(context))) throw new Error("Admin role required.");
}
