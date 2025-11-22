import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function EmployeeLandingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "employee" && session.role !== "staff") {
    redirect(`/dashboard/${session.role}/newsfeed`);
  }

  // Redirect to newsfeed
  redirect("/dashboard/employee/newsfeed");
}
