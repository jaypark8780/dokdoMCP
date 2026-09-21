/**
 * Typed procedure builders + CRUD factory — bind once with `GencowSchema` from `./generated/db-schema.gen`.
 * Import `procedure`, `httpRoute`, and `createCrud` from here, not from `@gencow/core`.
 *
 * Regenerate `generated/db-schema.gen.ts` with `gencow codegen` when `gencow.config` schema paths change.
 *
 * Optional: pass a second type argument for session/user identity aligned with `gencow/auth.ts`:
 *   createGencowProcedureBuilders<GencowSchema, AppUser>()
 *   createGencowHttpRouteBuilders<GencowSchema, AppUser>()
 */
import type { GencowSchema } from "./generated/db-schema.gen";
import {
  createCrudFactory,
  createGencowHttpRouteBuilders,
  createGencowProcedureBuilders,
} from "@gencow/core";

export const procedure = createGencowProcedureBuilders<GencowSchema>();

export const httpRoute = createGencowHttpRouteBuilders<GencowSchema>();

export const createCrud = createCrudFactory(procedure);
