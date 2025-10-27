import { ReactNode } from "react";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full p-4 md:p-6">{children}</div>
    </div>
  );
}
