import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getStudentClubDetails,
} from "@/lib/repos/student";
import {
  getClubMembers,
  getClubPosts,
} from "@/lib/repos/employee";
import { StudentClubDashboard } from "./_components/student-club-dashboard";

export default async function StudentClubPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "student") {
    redirect(`/dashboard/${session.role}`);
  }

  const { clubId } = await params;

  // Fetch club details, members, and posts in parallel
  const [clubDetails, members, posts] = await Promise.all([
    getStudentClubDetails(session.userId, clubId),
    getClubMembers(clubId),
    getClubPosts(clubId),
  ]);

  if (!clubDetails) {
    redirect("/dashboard/student/newsfeed");
  }

  return (
    <StudentClubDashboard
      clubDetails={clubDetails}
      initialMembers={members}
      initialPosts={posts}
      currentUserId={session.userId}
    />
  );
}

