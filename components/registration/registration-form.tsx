"use client";

import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Import Types
import { RegisterTabKey } from "@/lib/types";

// Custome Components
import InstitutionRegistrationForm from "@/components/institution/institution-reg-form";
import StudentRegistrationForm from "../student/student-reg-form";
import EmployeeRegistrationForm from "../employee/employee-reg-form";

interface RegistrationFormProps {
  registerTab: RegisterTabKey;
  setRegisterTab: (tab: RegisterTabKey) => void;
  value: string;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TAB_KEYS = ["student", "employee", "institution"] as const;
type RegisterTabKeySafe = (typeof TAB_KEYS)[number];
const isRegisterTabKey = (v: string): v is RegisterTabKeySafe =>
  (TAB_KEYS as readonly string[]).includes(v);

export default function RegistrationForm({
  registerTab,
  setRegisterTab,
  value,
  setValue,
  open,
  setOpen,
}: RegistrationFormProps) {
  return (
    <TabsContent value="register">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 gap-6 px-6 py-1">
          {/* Left Column - User/Institution Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg text-center md:text-left font-semibold mb-4">
                Choose Registration Type
              </h3>
              <Tabs
                value={registerTab}
                onValueChange={(v) => {
                  if (isRegisterTabKey(v)) setRegisterTab(v);
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="student" className="cursor-pointer">
                    Student
                  </TabsTrigger>
                  <TabsTrigger value="employee" className="cursor-pointer">
                    Employee
                  </TabsTrigger>
                  <TabsTrigger value="institution" className="cursor-pointer">
                    Institution
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <div className="space-y-4">
            {registerTab === "student" ? (
              <StudentRegistrationForm
                value={value}
                setValue={setValue}
                open={open}
                setOpen={setOpen}
              />
            ) : registerTab === "employee" ? (
              <EmployeeRegistrationForm
                institutionValue={value}
                setInstitutionValue={setValue}
                open={open}
                setOpen={setOpen}
              />
            ) : (
              <InstitutionRegistrationForm />
            )}

            <div className="flex flex-col gap-2">
              <Button
                disabled
                variant="outline"
                className="w-full cursor-pointer"
              >
                Sign up with Google
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </TabsContent>
  );
}
