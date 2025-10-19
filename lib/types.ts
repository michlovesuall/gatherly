export type RegisterTabKey = "student" | "employee" | "institution";
export type TabKey = "login" | "register";

export type InstitutionRegistrationData = {
  institutionName: string;
  emailDomain: string;
  webDomain?: string;
  contactPersonEmail: string;
  institutionPassword: string;
  institutionConfirmPassword: string;
};

export interface EmployeeRegistrationData {
  fullName: string;
  idNumber: string;
  userEmail: string;
  userPhone: string;
  userPassword: string;
  userConfirmPassword: string;
  institution?: string;
}

export interface EmployeeRegistrationFormProps {
  value: string;
  setValue: (val: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
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

export type InstitutionOption = {
  id: string;
  value: string;
  label: string;
  status: string;
};
