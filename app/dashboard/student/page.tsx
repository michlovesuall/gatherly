import { redirect } from "next/navigation";
import { getStudentContext } from "@/lib/repos/student";
import { getEventFeed } from "@/lib/repos/student";
import { getMyEvents } from "@/lib/repos/student";
import { getCertificates } from "@/lib/repos/student";
import { getMyClubs } from "@/lib/repos/student";
import { getClubAnnouncements } from "@/lib/repos/student";
import { getRecommendedEvents } from "@/lib/repos/student";
import { getNotifications } from "@/lib/repos/student";
import { getSession } from "@/lib/auth/session";
import { StudentDashboard } from "./_components/student-dashboard";

export const revalidate = 60; // ISR for shared feed parts

export default async function StudentDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "student") {
    redirect(`/dashboard/${session.role}`);
  }

  // Fetch all data in parallel
  const [
    context,
    feed,
    myEvents,
    certificates,
    clubs,
    clubAnnouncements,
    recommendations,
    notifications,
  ] = await Promise.all([
    getStudentContext(session.userId),
    getEventFeed(session.userId, session.institutionId),
    getMyEvents(session.userId),
    getCertificates(session.userId),
    getMyClubs(session.userId),
    getClubAnnouncements(session.userId),
    getRecommendedEvents(session.userId, session.institutionId),
    getNotifications(session.userId),
  ]);

  const isClubMember = context.clubsCount > 0;

  // Calculate stats
  const stats = {
    going: myEvents.going.length,
    interested: myEvents.interested.length,
    certificates: certificates.length,
  };

  return (
    <StudentDashboard
      context={context}
      feed={feed}
      myEvents={myEvents}
      certificates={certificates}
      clubs={clubs}
      clubAnnouncements={clubAnnouncements}
      recommendations={recommendations}
      notifications={notifications}
      stats={stats}
      isClubMember={isClubMember}
    />
  );
}
