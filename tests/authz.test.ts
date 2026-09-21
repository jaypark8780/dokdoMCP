import { describe, expect, test } from "bun:test";
import { requireDashboardAdmin } from "../gencow/authz";

describe("dashboard authorization", () => {
  test("allows the configured administrator email case-insensitively", () => {
    const identity = requireDashboardAdmin({ auth: { requireAuth: () => ({ id: "1", email: "JAYPARK8780@GMAIL.COM" }) } } as any);
    expect(identity.email).toBe("JAYPARK8780@GMAIL.COM");
  });

  test("rejects a different authenticated email", () => {
    expect(() => requireDashboardAdmin({ auth: { requireAuth: () => ({ id: "2", email: "other@example.com" }) } } as any)).toThrow(/restricted/);
  });
});
