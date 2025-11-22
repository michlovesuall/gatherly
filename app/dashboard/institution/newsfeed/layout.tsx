import { ReactNode } from "react";

export default function NewsfeedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-screen bg-background overflow-hidden">
      {children}
    </div>
  );
}

