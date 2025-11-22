import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getNewsfeedContext, getNewsfeedItems, getMyEvents, getCertificates } from "@/lib/repos/student";
import { NewsfeedPage } from "../../student/newsfeed/_components/newsfeed-page";

export const revalidate = 60; // ISR for feed data

export default async function InstitutionNewsfeedPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "institution") {
    redirect(`/dashboard/${session.role}/newsfeed`);
  }

  // Fetch all data in parallel
  const [context, feedItems, myEvents, certificates] = await Promise.all([
    getNewsfeedContext(session.userId),
    getNewsfeedItems(session.userId, session.institutionId, "for-you"),
    getMyEvents(session.userId),
    getCertificates(session.userId),
  ]);

  // Calculate stats
  const stats = {
    going: myEvents.going.length,
    interested: myEvents.interested.length,
    certificates: certificates.length,
  };

  return (
    <NewsfeedPage
      context={context}
      feedItems={feedItems}
      myEvents={myEvents}
      stats={stats}
      role="institution"
    />
  );
}

