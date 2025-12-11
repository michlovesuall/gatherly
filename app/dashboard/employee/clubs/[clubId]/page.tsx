import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getAdvisorClubDetails,
  getClubMembers,
  getClubPosts,
} from "@/lib/repos/employee";
import { AdvisorClubDashboard } from "./_components/advisor-club-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gatherly | Club Dashboard",
  description: "Advisor's Club Dashboard",
};
export default async function AdvisorClubPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "employee" && session.role !== "staff") {
    redirect(`/dashboard/${session.role}`);
  }

  const { clubId } = await params;

  // Fetch club details, members, and posts in parallel
  const [clubDetails, members, posts] = await Promise.all([
    getAdvisorClubDetails(session.userId, clubId),
    getClubMembers(clubId),
    getClubPosts(clubId),
  ]);

  if (!clubDetails) {
    redirect("/dashboard/employee");
  }

  return (
    <AdvisorClubDashboard
      clubDetails={clubDetails}
      initialMembers={members}
      initialPosts={posts}
      currentUserId={session.userId}
    />
  );
}
