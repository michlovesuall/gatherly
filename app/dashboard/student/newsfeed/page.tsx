import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getNewsfeedContext, getNewsfeedItems, getMyEvents, getCertificates } from "@/lib/repos/student";
import { NewsfeedPage } from "./_components/newsfeed-page";

export const revalidate = 60; // ISR for feed data

export default async function StudentNewsfeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "student") {
    redirect(`/dashboard/${session.role}/newsfeed`);
  }

  const params = await searchParams;
  const filter = (params?.filter as "for-you" | "global") || "global";

  // Fetch all data in parallel - use filter from URL
  const [context, feedItems, myEvents, certificates] = await Promise.all([
    getNewsfeedContext(session.userId),
    getNewsfeedItems(session.userId, session.institutionId, filter),
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
      role="student"
    />
  );
}

