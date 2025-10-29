"use client";

import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

// Import Types
import { InstitutionOption, RegisterTabKey } from "@/lib/types";
import type { TabKey } from "@/lib/types";

// Custome Components
import InstitutionRegistrationForm from "@/components/institution/institution-reg-form";
import StudentRegistrationForm from "../student/student-reg-form";
import EmployeeRegistrationForm from "../employee/employee-reg-form";

const TAB_KEYS = ["student", "employee", "institution"] as const;
type RegisterTabKeySafe = (typeof TAB_KEYS)[number];
const isRegisterTabKey = (v: string): v is RegisterTabKeySafe =>
  (TAB_KEYS as readonly string[]).includes(v);

export default function RegistrationForm({
  registerTab,
  setRegisterTab,
  setMainTab,
}: {
  registerTab: RegisterTabKey;
  setRegisterTab: (k: RegisterTabKey) => void;
  setMainTab: (k: TabKey) => void;
}) {
  const [studentInstitution, setStudentInstitution] = useState("");
  const [studentOpen, setStudentOpen] = useState(false);

  const [employeeInstitution, setEmployeeInstitution] = useState("");
  const [employeeOpen, setEmployeeOpen] = useState(false);

  // console.log({
  //   studentInstitution,
  //   employeeInstitution,
  //   setStudentInstitution: typeof setStudentInstitution,
  //   setEmployeeInstitution: typeof setEmployeeInstitution,
  // });

  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [loadingInstitution, setLoadingInstitution] = useState(true);
  const [instError, setInstError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingInstitution(true);
      setInstError(null);
      try {
        const res = await fetch("/api/institution?limit=200", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
        if (!cancelled) setInstitutions(data.items ?? []);
      } catch (e) {
        if (!cancelled)
          setInstError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoadingInstitution(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
            {registerTab === "student" && (
              <StudentRegistrationForm
                institutions={institutions}
                loadingInstitutions={loadingInstitution}
                institutionError={instError}
                institutionValue={studentInstitution}
                setInstitutionValue={setStudentInstitution}
                open={studentOpen}
                setOpen={setStudentOpen}
                onSuccessLogin={() => setMainTab("login")}
              />
            )}
            {registerTab === "employee" && (
              <EmployeeRegistrationForm
                institutions={institutions}
                loadingInstitutions={loadingInstitution}
                institutionError={instError}
                institutionValue={employeeInstitution}
                setInstitutionValue={setEmployeeInstitution}
                open={employeeOpen}
                setOpen={setEmployeeOpen}
                onSuccessLogin={() => setMainTab("login")}
              />
            )}
            {registerTab === "institution" && (
              <InstitutionRegistrationForm
                onSuccessLogin={() => setMainTab("login")}
              />
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
