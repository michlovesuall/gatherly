"use client";

import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RegisterTabKey } from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface RegistrationFormProps {
  registerTab: RegisterTabKey;
  setRegisterTab: (tab: RegisterTabKey) => void;
  institutions: { value: string; label: string }[];
  value: string;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function RegistrationForm({
  registerTab,
  setRegisterTab,
  institutions,
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
                onValueChange={(v) => setRegisterTab(v as RegisterTabKey)}
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

            {/* Registration Type Description */}
            <div>
              <div className="space-y-3">
                {registerTab === "student" ? (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Register as Student
                    </h4>
                    <p className="text-sm text-blue-700">
                      Create a student account to join events, connect with
                      other students, and participate in campus activities.
                    </p>
                  </div>
                ) : registerTab === "institution" ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">
                      Register as Institution
                    </h4>
                    <p className="text-sm text-green-700">
                      Create an institutional account to manage events, organize
                      activities, and connect with your campus community.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Register as Employee
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Create an employee account to join events, manage clubs
                      and organizations, and participate in campus activities.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <div className="space-y-4">
            <h3 className="text-lg text-center md:text-left font-semibold">
              {registerTab === "student"
                ? "Student Registration"
                : registerTab === "employee"
                ? "Employee Registration"
                : "Institution Registration"}
            </h3>

            <form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registerTab === "student" || registerTab === "employee" ? (
                  // Student Registration Form
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">
                        Full Name
                        <span className="text-red-600 m-0 p-0">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    {registerTab === "student" ? (
                      <div className="grid gap-2">
                        <Label htmlFor="idNumber">
                          ID Number
                          <span className="italic text-gray-400 m-0 p-0">
                            (Student ID)
                          </span>
                          <span className="text-red-600 m-0 p-0">*</span>
                        </Label>
                        <Input id="idNumber" type="text" />
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label htmlFor="idNumber">
                          ID Number
                          <span className="italic text-gray-400 m-0 p-0">
                            (Employee ID)
                          </span>
                          <span className="text-red-600 m-0 p-0">*</span>
                        </Label>
                        <Input id="idNumber" type="text" />
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="userEmail">
                        Email
                        <span className="text-red-600 m-0 p-0">*</span>
                      </Label>
                      <Input
                        id="userEmail"
                        type="email"
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="userPhone">
                        Phone Number
                        <span className="text-red-600 m-0 p-0">*</span>
                      </Label>
                      <Input
                        id="userPhone"
                        type="number"
                        placeholder="09xx-xxx-xxxx"
                        required
                      />
                    </div>
                    <div className="grid md:col-span-2 gap-2">
                      <Label htmlFor="institutionSelect">Institution</Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                          >
                            {value
                              ? institutions.find(
                                  (institution) => institution.value === value
                                )?.label
                              : "Select Institution..."}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search institution..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No Institution found.</CommandEmpty>
                              <CommandGroup>
                                {institutions.map((institution) => (
                                  <CommandItem
                                    key={institution.value}
                                    value={institution.value}
                                    onSelect={(currentValue) => {
                                      setValue(
                                        currentValue === value
                                          ? ""
                                          : currentValue
                                      );
                                      setOpen(false);
                                    }}
                                  >
                                    {institution.label}
                                    <Check
                                      className={
                                        value === institution.value
                                          ? "ml-auto opacity-100"
                                          : "ml-auto opacity-0"
                                      }
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="userPassword">Password</Label>
                      <Input id="userPassword" type="password" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="userConfirmPassword">
                        Confirm Password
                      </Label>
                      <Input
                        id="userConfirmPassword"
                        type="password"
                        required
                      />
                    </div>
                  </>
                ) : (
                  // Institution Registration Form
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="institutionName">
                        Institution Name
                        <span className="text-red-600 m-0 p-0">*</span>
                      </Label>
                      <Input
                        id="institutionName"
                        type="text"
                        placeholder="Partido State University"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="institutionEmail">
                        Email
                        <span className="text-red-600 m-0 p-0">*</span>
                      </Label>
                      <Input
                        id="institutionEmail"
                        type="email"
                        placeholder="parsu@example.com"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="webDomain">Website</Label>
                      <Input
                        id="webDomain"
                        type="text"
                        placeholder="parsu.edu.ph"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactPerson">
                        Contact Person&apos;s Email
                        <span className="text-red-600 m-0 p-0">*</span>
                      </Label>
                      <Input
                        id="contactPersonEmail"
                        type="email"
                        placeholder="janesmith@example.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="institutionPassword">
                        Password
                        <span className="text-red-600 m-0 p-0">*</span>
                      </Label>
                      <Input
                        id="institutionPassword"
                        type="password"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="institutionConfirmPassword">
                        Confirm Password
                        <span className="text-red-600 m-0 p-0">*</span>
                      </Label>
                      <Input
                        id="institutionConfirmPassword"
                        type="password"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-6">
                <Button type="submit" className="w-full cursor-pointer">
                  {registerTab === "student"
                    ? "Register as Student"
                    : registerTab === "employee"
                    ? "Register as Employee"
                    : "Register as Institution"}
                </Button>
                <Button
                  disabled
                  variant="outline"
                  className="w-full cursor-pointer"
                >
                  Sign up with Google
                </Button>
              </div>
            </form>
          </div>
        </div>
      </CardContent>
    </TabsContent>
  );
}
