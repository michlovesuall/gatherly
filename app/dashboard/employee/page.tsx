import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function EmployeeLandingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "employee" && session.role !== "staff") {
    redirect(`/dashboard/${session.role}`);
  }

  const isStaff = session.role === "staff";
  if (isStaff) {
    redirect("/dashboard/employee/manage");
  } else {
    redirect("/dashboard/employee/feed");
  }
}
