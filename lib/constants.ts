/**
 * Status constants for relationships and nodes
 * These values are used throughout the application for consistency
 */

// Relationship status values (for STUDENT, EMPLOYEE, MEMBER_OF relationships)
export const RELATIONSHIP_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
} as const;

export type RelationshipStatus =
  (typeof RELATIONSHIP_STATUS)[keyof typeof RELATIONSHIP_STATUS];

// User node status values
export const USER_STATUS = {
  ACTIVE: "active",
  DISABLED: "disabled",
  PENDING: "pending",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// Institution status values
export const INSTITUTION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  ACTIVE: "active",
  REJECTED: "rejected",
} as const;

export type InstitutionStatus =
  (typeof INSTITUTION_STATUS)[keyof typeof INSTITUTION_STATUS];

// Event status values
export const EVENT_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  PUBLISHED: "published",
  REJECTED: "rejected",
  HIDDEN: "hidden",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

// Club status values
export const CLUB_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ClubStatus = (typeof CLUB_STATUS)[keyof typeof CLUB_STATUS];

// Platform roles
export const PLATFORM_ROLE = {
  STUDENT: "student",
  EMPLOYEE: "employee",
  INSTITUTION: "institution",
  SUPER_ADMIN: "super_admin",
} as const;

export type PlatformRole = (typeof PLATFORM_ROLE)[keyof typeof PLATFORM_ROLE];

// Relationship types
export const RELATIONSHIP_TYPE = {
  STUDENT: "STUDENT",
  EMPLOYEE: "EMPLOYEE",
  MEMBER_OF: "MEMBER_OF", // Legacy, should be migrated to STUDENT or EMPLOYEE
} as const;

// Default status values for queries
export const DEFAULT_RELATIONSHIP_STATUS = RELATIONSHIP_STATUS.PENDING;
export const DEFAULT_USER_STATUS = USER_STATUS.ACTIVE;

