import { count, eq } from "drizzle-orm";
import { httpRoute } from "../runtime";
import { claimEvidence, claimLocalizations, claims, ingestJobs, rightsReviews, sourceRegistry, sources } from "../schema";
import { requireDashboardAdmin } from "../authz";

const DASHBOARD_HTML = String.raw`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dokdo MCP Review Dashboard</title>
<style>
:root{font-family:Inter,system-ui,sans-serif;color:#172033;background:#f5f7fb}body{margin:0}.shell{max-width:1180px;margin:auto;padding:32px 20px}header{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:28px}h1{margin:0;font-size:clamp(1.8rem,4vw,2.8rem)}p{color:#5c667a}.badge{padding:8px 12px;border-radius:999px;background:#e7f7ee;color:#167447;font-size:.85rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.card,.panel{background:white;border:1px solid #e0e5ef;border-radius:16px;box-shadow:0 4px 18px #20335c0b}.card{padding:20px}.card strong{display:block;font-size:2rem}.label{color:#68738a;font-size:.85rem}.panel{margin-top:20px;padding:20px;overflow:auto}.panel h2{margin-top:0;font-size:1.1rem}table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;padding:11px 8px;border-bottom:1px solid #edf0f5;vertical-align:top}th{color:#68738a;font-weight:600}.status{font-size:.78rem;padding:4px 8px;border-radius:999px;background:#eef1f6}.status.warn{background:#fff2d7;color:#895d00}.status.ok{background:#e7f7ee;color:#167447}.notice{border-left:4px solid #e4a11b;padding:12px 14px;background:#fff9eb;margin-top:18px}a{color:#315ee7;text-decoration:none}code{font-size:.85em}
</style></head>
<body><main class="shell"><header><div><div class="label">DOKDO MCP · REVIEW CONSOLE</div><h1>Historical source review</h1><p>Review provenance, rights, ingestion status, and claim context before publication.</p></div><span class="badge">Authenticated admin</span></header><section id="cards" class="grid"><div class="card"><span class="label">Loading</span><strong>…</strong></div></section><div class="notice"><strong>Publication guard:</strong> institutional sovereignty claims requiring counter-evidence remain unpublished until reviewed contradictory fragments and item-level rights checks are complete.</div><section class="panel"><h2>Claim review queue</h2><table><thead><tr><th>Claim</th><th>Institution</th><th>Assessment</th><th>Rebuttal</th></tr></thead><tbody id="claims"><tr><td colspan="4">Loading…</td></tr></tbody></table></section><section class="panel"><h2>Ingestion and rights queue</h2><table><thead><tr><th>Area</th><th>Status</th><th>Count</th><th>Action</th></tr></thead><tbody id="queue"><tr><td colspan="4">Loading…</td></tr></tbody></table></section></main>
<script>
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
fetch('/api/dashboard/summary',{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error('Authentication required');return r.json()}).then(d=>{
 document.querySelector('#cards').innerHTML=[['Candidates',d.sources.total],['Published',d.sources.published],['Claims pending',d.claims.pending],['Rights pending',d.rights.pending],['Jobs active',d.ingest.active]].map(x=>\`<div class="card"><span class="label">\${esc(x[0])}</span><strong>\${esc(x[1])}</strong></div>\`).join('');
 document.querySelector('#claims').innerHTML=d.claims.queue.map(x=>\`<tr><td>\${esc(x.statement)}</td><td>\${esc(x.institution)}</td><td><span class="status warn">\${esc(x.assessment)}</span></td><td>\${x.rebuttalCount?\`<span class="status ok">\${esc(x.rebuttalCount)} linked</span>\`:'<span class="status warn">Required</span>'}</td></tr>\`).join('')||'<tr><td colspan="4">No pending claims.</td></tr>';
 document.querySelector('#queue').innerHTML=[['Source registry','enabled',d.registry.enabled,'Review domains and terms'],['Ingest jobs','pending',d.ingest.pending,'Review retry/error state'],['Rights reviews','pending',d.rights.pending,'Confirm item-level reuse'],['Published sources','published',d.sources.published,'Available to MCP']].map(x=>\`<tr><td>\${esc(x[0])}</td><td><span class="status">\${esc(x[1])}</span></td><td>\${esc(x[2])}</td><td>\${esc(x[3])}</td></tr>\`).join('');
}).catch(e=>{document.querySelector('#cards').innerHTML=\`<div class="card"><span class="label">Dashboard unavailable</span><strong>🔒</strong><p>\${esc(e.message)}</p></div>\`});
</script></body></html>`;

export const dashboardPageRoute = httpRoute.get
  .path("/dashboard")
  .handler(async ({ context: ctx }) => {
    requireDashboardAdmin(ctx);
    return {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    body: DASHBOARD_HTML,
    };
  });

export const dashboardSummaryRoute = httpRoute.get
  .path("/api/dashboard/summary")
  .handler(async ({ context: ctx }) => {
    requireDashboardAdmin(ctx);
    const [[sourceTotal], [published], [claimPending], [rightsPending], [ingestPending], [ingestActive], [registryEnabled]] = await Promise.all([
      ctx.db.select({ value: count() }).from(sources),
      ctx.db.select({ value: count() }).from(sources).where(eq(sources.verificationStatus, "published")),
      ctx.db.select({ value: count() }).from(claims).where(eq(claims.reviewStatus, "pending")),
      ctx.db.select({ value: count() }).from(rightsReviews).where(eq(rightsReviews.status, "pending")),
      ctx.db.select({ value: count() }).from(ingestJobs).where(eq(ingestJobs.status, "discovered")),
      ctx.db.select({ value: count() }).from(ingestJobs).where(eq(ingestJobs.status, "processing")),
      ctx.db.select({ value: count() }).from(sourceRegistry).where(eq(sourceRegistry.enabled, true)),
    ]);

    const queueRows = await ctx.db
      .select({ claimId: claims.id, statement: claimLocalizations.statement, institution: claims.claimantInstitution, assessment: claims.assessmentStatus })
      .from(claims)
      .leftJoin(claimLocalizations, eq(claims.id, claimLocalizations.claimId))
      .where(eq(claims.reviewStatus, "pending"))
      .limit(20);
    const evidenceRows = await ctx.db
      .select({ claimId: claimEvidence.claimId, relationship: claimEvidence.relationship })
      .from(claimEvidence)
      .where(eq(claimEvidence.reviewStatus, "published"));
    const rebuttalCounts = new Map<string, number>();
    for (const row of evidenceRows) if (row.relationship === "contradicts") rebuttalCounts.set(row.claimId, (rebuttalCounts.get(row.claimId) ?? 0) + 1);
    const queue = queueRows.map((item) => ({ ...item, rebuttalCount: rebuttalCounts.get(item.claimId) ?? 0 }));

    return {
      headers: { "cache-control": "no-store" },
      body: {
        generatedAt: new Date().toISOString(),
        sources: { total: Number(sourceTotal?.value ?? 0), published: Number(published?.value ?? 0) },
        claims: { pending: Number(claimPending?.value ?? 0), queue },
        rights: { pending: Number(rightsPending?.value ?? 0) },
        ingest: { pending: Number(ingestPending?.value ?? 0), active: Number(ingestActive?.value ?? 0) },
        registry: { enabled: Number(registryEnabled?.value ?? 0) },
      },
    };
  });
