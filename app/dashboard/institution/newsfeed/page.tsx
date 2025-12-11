import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getNewsfeedContext, getNewsfeedItems } from "@/lib/repos/student";
import { NewsfeedPage } from "../../student/newsfeed/_components/newsfeed-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gatherly | Newsfeed",
  description: "Institution Newsfeed",
};
export const revalidate = 60; // ISR for feed data

export default async function InstitutionNewsfeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "institution") {
    redirect(`/dashboard/${session.role}/newsfeed`);
  }

  const params = await searchParams;
  const filter = (params?.filter as "all" | "institution" | "public") || "all";

  const [context, feedItems] = await Promise.all([
    getNewsfeedContext(session.userId),
    getNewsfeedItems(session.userId, session.institutionId, filter),
  ]);

  return (
    <NewsfeedPage context={context} feedItems={feedItems} role="institution" />
  );
}
