export type PlatformRole =
  | "student"
  | "employee"
  | "institution"
  | "super_admin";

export type ClubMembership = {
  clubId: string;
  clubName: string;
  clubAcronym?: string;
  role: "member" | "officer";
};

export type EmployeeScope = {
  isStaff: boolean;
  isAdvisor: boolean;
  advisorClubIds: string[];
};

export type InstitutionMembership = {
  institutionId: string;
  status: "pending" | "auto_verified" | "approved" | "rejected";
};

export interface SessionUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  platformRole: PlatformRole;
  institution: InstitutionMembership;
  clubs?: ClubMembership[];
  employeeScope?: EmployeeScope;
}

export const isOfficer = (u: SessionUser): boolean =>
  (u.clubs ?? []).some((c) => c.role === "officer");

export const isAdvisor = (u: SessionUser): boolean =>
  !!u.employeeScope?.isAdvisor;

export const isStaff = (u: SessionUser): boolean => !!u.employeeScope?.isStaff;

export const isInstitutionAdmin = (u: SessionUser): boolean =>
  u.platformRole === "institution";
