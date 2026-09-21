import type { GencowAppCtx } from "@gencow/core";

/** Comma-separated administrator emails are supplied by the deployment environment. */
export function dashboardAdminEmails(): string[] {
  return (process.env.DOKDO_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isDashboardAdminEmail(email: string) {
  return dashboardAdminEmails().includes(email.trim().toLowerCase());
}

export function requireDashboardAdmin(ctx: Pick<GencowAppCtx, "auth">) {
  const identity = ctx.auth.requireAuth();
  const email = identity.email.trim().toLowerCase();
  if (!isDashboardAdminEmail(email)) {
    throw new Error("Dashboard administrator access is restricted to an approved email address");
  }
  return identity;
}
