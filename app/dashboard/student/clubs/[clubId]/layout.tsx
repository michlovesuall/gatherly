import { ReactNode } from "react";

export default function StudentClubLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-screen bg-background overflow-hidden -m-4 md:-m-6">
      {children}
    </div>
  );
}

