import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getNewsfeedContext, getNewsfeedItems } from "@/lib/repos/student";
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

  // Fetch only necessary data for Institution role
  const [context, feedItems] = await Promise.all([
    getNewsfeedContext(session.userId),
    getNewsfeedItems(session.userId, session.institutionId, "for-you"),
  ]);

  return (
    <NewsfeedPage
      context={context}
      feedItems={feedItems}
      role="institution"
    />
  );
}

