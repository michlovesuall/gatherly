import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getNewsfeedContext, getNewsfeedItems } from "@/lib/repos/student";
import { NewsfeedPage } from "../../student/newsfeed/_components/newsfeed-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gatherly | Newsfeed",
  description: "Super Admin's Dashboard",
};
export const revalidate = 60;

export default async function AdminNewsfeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "super_admin") {
    redirect(`/dashboard/${session.role}/newsfeed`);
  }

  const params = await searchParams;
  const filter = (params?.filter as "for-you" | "global") || "global";

  // Fetch only necessary data for Super-Admin role - use filter from URL
  const [context, feedItems] = await Promise.all([
    getNewsfeedContext(session.userId),
    getNewsfeedItems(session.userId, session.institutionId || "", filter),
  ]);

  return (
    <NewsfeedPage context={context} feedItems={feedItems} role="super_admin" />
  );
}
