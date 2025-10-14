export type RegisterTabKey = "student" | "employee" | "institution";
export type TabKey = "login" | "register";

export interface InstitutionRegistrationData {
  institutionName: string;
  institutionEmail: string;
  webDomain?: string;
  contactPersonEmail: string;
  institutionPassword: string;
  institutionConfirmPassword: string;
}

export interface EmployeeRegistrationData {
  fullName: string;
  idNumber: string;
  userEmail: string;
  userPhone: string;
  userPassword: string;
  userConfirmPassword: string;
  institution?: string;
}

export interface StudentRegistrationData {
  fullName: string;
  idNumber: string;
  userEmail: string;
  userPhone: string;
  userPassword: string;
  userConfirmPassword: string;
  institution?: string;
}
