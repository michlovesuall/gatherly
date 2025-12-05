import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gatherly | Newsfeed",
  description: "Student's Dashboard",
};
export default function NewsfeedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen bg-background overflow-hidden -m-4 md:-m-6">
      {children}
    </div>
  );
}
