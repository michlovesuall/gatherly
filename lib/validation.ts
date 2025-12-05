/**
 * Validation utility functions for phone numbers and emails
 */

/**
 * Validates that a phone number is exactly 11 digits (numeric only)
 * @param phone - The phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false;
  // Remove any whitespace and check if it's exactly 11 digits
  const cleaned = phone.trim().replace(/\s+/g, "");
  return /^\d{11}$/.test(cleaned);
}

/**
 * Normalizes a phone number by removing non-numeric characters
 * @param phone - The phone number to normalize
 * @returns The normalized phone number (digits only)
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

/**
 * Validates email format (basic validation)
 * @param email - The email to validate
 * @returns true if valid format, false otherwise
 */
export function isValidEmailFormat(email: string | null | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

