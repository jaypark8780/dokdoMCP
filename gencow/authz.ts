import type { GencowAppCtx } from "@gencow/core";

export const DASHBOARD_ADMIN_EMAILS = ["jaypark8780@gmail.com"] as const;

export function requireDashboardAdmin(ctx: Pick<GencowAppCtx, "auth">) {
  const identity = ctx.auth.requireAuth();
  const email = identity.email.trim().toLowerCase();
  if (!(DASHBOARD_ADMIN_EMAILS as readonly string[]).includes(email)) {
    throw new Error("Dashboard administrator access is restricted to an approved email address");
  }
  return identity;
}
