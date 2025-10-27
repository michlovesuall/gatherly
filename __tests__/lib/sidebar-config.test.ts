import { describe, it, expect } from "vitest";
import {
  studentSidebar,
  employeeSidebar,
  institutionSidebar,
  getSidebarFor,
} from "@/lib/sidebar-config";
import type { SessionUser } from "@/lib/rbac";

const baseStudent: SessionUser = {
  userId: "u1",
  name: "Alice",
  platformRole: "student",
  institution: { institutionId: "i1", status: "approved" },
  clubs: [],
};

describe("sidebar-config", () => {
  it("student ordinary has base items without settings", () => {
    const cfg = studentSidebar(baseStudent);
    const labels = cfg.flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toContain("Feed");
    expect(labels).not.toContain("Settings");
    expect(labels).not.toContain("Club Tools");
  });

  it("student officer adds officer section", () => {
    const cfg = studentSidebar({
      ...baseStudent,
      clubs: [{ clubId: "c1", clubName: "C", role: "officer" }],
    });
    const all = cfg.flatMap((s) => s.items.map((i) => i.key));
    expect(all).toContain("club-tools");
  });

  it("employee advisor adds advisor section", () => {
    const u: SessionUser = {
      userId: "e1",
      name: "Bob",
      platformRole: "employee",
      institution: { institutionId: "i1", status: "approved" },
      employeeScope: { isStaff: false, isAdvisor: true, advisorClubIds: [] },
    };
    const cfg = employeeSidebar(u);
    const keys = cfg.flatMap((s) => s.items.map((i) => i.key));
    expect(keys).toContain("approvals");
  });

  it("institution has admin set", () => {
    const cfg = institutionSidebar();
    const keys = cfg.flatMap((s) => s.items.map((i) => i.key));
    expect(keys).toContain("users");
    expect(keys).toContain("approvals");
  });

  it("getSidebarFor routes by role", () => {
    expect(getSidebarFor(baseStudent)).toBeTruthy();
    expect(
      getSidebarFor({ ...baseStudent, platformRole: "employee" } as SessionUser)
    ).toBeTruthy();
  });
});
