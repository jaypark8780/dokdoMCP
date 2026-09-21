/**
 * gencow/index.ts — Entry point
 *
 * Gencow runtime loads this file and registers procedures and createCrud via defineApi.
 *
 * @example createCrud
 * ```ts
 * import { createCrud } from "./runtime";
 * import { tasks } from "./schema";
 *
 * export const tasksCrud = createCrud(tasks);
 * export const { list, get, create, update, remove } = tasksCrud;
 * ```
 *
 * @example custom procedure
 * ```ts
 * import { procedure } from "./runtime";
 * import { v } from "@gencow/core";
 *
 * export const search = procedure.query
 *   .name("tasks.search")
 *   .input(v.object({ keyword: v.string() }))
 *   .handler(async ({ context: ctx, input }) => { ... });
 * ```
 */
import "./runtime";

import { defineApi } from "@gencow/core";
import { healthRoute, mcpDeleteRoute, mcpGetRoute, mcpPostRoute } from "./mcp/routes";
import { dashboardPageRoute, dashboardSummaryRoute, loginPageRoute } from "./dashboard/routes";
import { getDashboardSummary } from "./dashboard/procedures";

export default defineApi({
  procedures: {
    getDashboardSummary,
  },
  httpRoutes: {
    health: healthRoute,
    mcpPost: mcpPostRoute,
    mcpGet: mcpGetRoute,
    mcpDelete: mcpDeleteRoute,
    dashboard: dashboardPageRoute,
    dashboardSummary: dashboardSummaryRoute,
    login: loginPageRoute,
  },
});
