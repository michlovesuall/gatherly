"use client";

import { useState, useEffect } from "react";
import type {
  NewsfeedContext,
  NewsfeedItem,
  EventItem,
} from "@/lib/repos/student";
import { NewsfeedHeader } from "./newsfeed-header";
import { NewsfeedFeed } from "./newsfeed-feed";
import { MyEventsCard } from "./my-events-card";
import { StatsCard } from "./stats-card";

export interface NewsfeedPageProps {
  context: NewsfeedContext;
  feedItems: NewsfeedItem[];
  myEvents?: { going: EventItem[]; interested: EventItem[] };
  stats?: { going: number; interested: number; certificates: number };
  role: "student" | "employee" | "institution" | "super_admin";
}

export function NewsfeedPage({
  context,
  feedItems: initialFeedItems,
  myEvents,
  stats,
  role,
}: NewsfeedPageProps) {
  // For super_admin, always use "global" filter (no filter dropdown available)
  const [feedFilter, setFeedFilter] = useState<"for-you" | "global">(
    role === "super_admin" ? "global" : "global"
  );
  const [feedItems, setFeedItems] = useState<NewsfeedItem[]>(initialFeedItems);
  const [loading, setLoading] = useState(false);

  // Fetch feed items when filter changes - refresh feed panel only
  // Skip for super_admin since they don't have filter options
  useEffect(() => {
    // For super_admin, filter is always "global" and doesn't change
    if (role === "super_admin") {
      return;
    }

    const fetchFeed = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/newsfeed?filter=${feedFilter}`);
        const data = await response.json();
        if (data.ok) {
          setFeedItems(data.items || []);
          console.log(`[Newsfeed] Filter: ${feedFilter}, Items loaded: ${data.items?.length || 0}`);
        } else {
          console.error("Failed to fetch feed:", data.error);
          setFeedItems([]);
        }
      } catch (error) {
        console.error("Failed to fetch feed:", error);
        setFeedItems([]);
      } finally {
        setLoading(false);
      }
    };

    // Always fetch when filter changes to refresh the feed panel
    fetchFeed();
  }, [feedFilter, role]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Sticky Header */}
      <NewsfeedHeader
        context={context}
        role={role}
        feedFilter={feedFilter}
        onFilterChange={(filter) => {
          // Super-admin doesn't have filter options, so don't allow changes
          if (role !== "super_admin") {
            setFeedFilter(filter);
          }
        }}
      />

      {/* Main Content - Two Columns */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 py-6">
          <div className={`grid grid-cols-1 gap-6 h-full ${role === "student" || role === "employee" ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}>
            {/* First Column - Feed (2/3 width for Student/Employee, full width for Institution/Super-Admin, scrollable) */}
            <div className={`h-full overflow-y-auto ${role === "student" || role === "employee" ? "lg:col-span-2" : "lg:col-span-1"}`}>
              <NewsfeedFeed
                items={feedItems}
                loading={loading}
                role={role}
              />
            </div>

            {/* Second Column - Stats and My Events Card (1/3 width, sticky) */}
            {/* Only show for Student and Employee roles */}
            {(role === "student" || role === "employee") && stats && myEvents && (
              <div className="lg:col-span-1 h-full">
                <div className="sticky top-6 space-y-4">
                  <StatsCard stats={stats} />
                  <MyEventsCard
                    going={myEvents.going}
                    interested={myEvents.interested}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
