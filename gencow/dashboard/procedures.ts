import { count, eq } from "drizzle-orm";
import { procedure } from "../runtime";
import { ingestJobs, rightsReviews, sourceRegistry, sources } from "../schema";
import { requireDashboardAdmin } from "../authz";

/** Authenticated dashboard query; mutations remain intentionally absent. */
export const getDashboardSummary = procedure.query
  .name("dashboard.summary")
  .handler(async ({ context: ctx }) => {
    requireDashboardAdmin(ctx);
    const [[sourceTotal], [published], [rightsPending], [ingestPending], [registryEnabled]] = await Promise.all([
      ctx.db.select({ value: count() }).from(sources),
      ctx.db.select({ value: count() }).from(sources).where(eq(sources.verificationStatus, "published")),
      ctx.db.select({ value: count() }).from(rightsReviews).where(eq(rightsReviews.status, "pending")),
      ctx.db.select({ value: count() }).from(ingestJobs).where(eq(ingestJobs.status, "discovered")),
      ctx.db.select({ value: count() }).from(sourceRegistry).where(eq(sourceRegistry.enabled, true)),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      sources: { total: Number(sourceTotal?.value ?? 0), published: Number(published?.value ?? 0) },
      rights: { pending: Number(rightsPending?.value ?? 0) },
      ingest: { pending: Number(ingestPending?.value ?? 0) },
      registry: { enabled: Number(registryEnabled?.value ?? 0) },
    };
  });
