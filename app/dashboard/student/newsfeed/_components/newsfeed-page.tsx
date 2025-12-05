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
  myEvents: initialMyEvents,
  stats: initialStats,
  role,
}: NewsfeedPageProps) {
  // For super_admin, always use "global" filter (no filter dropdown available)
  const [feedFilter, setFeedFilter] = useState<"for-you" | "global">(
    role === "super_admin" ? "global" : "global"
  );
  const [feedItems, setFeedItems] = useState<NewsfeedItem[]>(initialFeedItems);
  const [loading, setLoading] = useState(false);
  const [myEvents, setMyEvents] = useState<{ going: EventItem[]; interested: EventItem[] }>(
    initialMyEvents || { going: [], interested: [] }
  );
  const [stats, setStats] = useState(initialStats || { going: 0, interested: 0, certificates: 0 });

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
          console.log(
            `[Newsfeed] Filter: ${feedFilter}, Items loaded: ${
              data.items?.length || 0
            }`
          );
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

  // Refresh My Events after RSVP change
  // Also updates feed items state when canceling from My Events
  const handleRsvpChange = async (
    eventId?: string,
    previousState?: "going" | "interested"
  ) => {
    // Update feed items state if eventId is provided (canceling from My Events)
    if (eventId) {
      setFeedItems((prevItems) =>
        prevItems.map((item) =>
          item.id === eventId && item.type === "event"
            ? {
                ...item,
                rsvpState: null,
                counts: {
                  ...item.counts,
                  going:
                    previousState === "going"
                      ? Math.max(0, item.counts.going - 1)
                      : item.counts.going,
                  interested:
                    previousState === "interested"
                      ? Math.max(0, item.counts.interested - 1)
                      : item.counts.interested,
                },
              }
            : item
        )
      );
    }

    // Refresh My Events list
    try {
      const response = await fetch("/api/student/my-events");
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.events) {
          setMyEvents(data.events);
          setStats({
            going: data.events.going.length,
            interested: data.events.interested.length,
            certificates: stats.certificates, // Keep existing certificates count
          });
        }
      }
    } catch (error) {
      console.error("Failed to refresh My Events:", error);
    }
  };

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
          <div
            className={`grid grid-cols-1 gap-6 h-full ${
              role === "student" || role === "employee"
                ? "lg:grid-cols-3"
                : "lg:grid-cols-1"
            }`}
          >
            {/* First Column - Feed (2/3 width for Student/Employee, full width for Institution/Super-Admin, scrollable) */}
            <div
              className={`h-full overflow-y-auto flex justify-center items-center ${
                role === "student" || role === "employee"
                  ? "lg:col-span-2"
                  : "lg:col-span-1"
              }`}
            >
              <NewsfeedFeed 
                items={feedItems} 
                loading={loading} 
                role={role}
                onRsvpChange={handleRsvpChange}
              />
            </div>

            {/* Second Column - Stats and My Events Card (1/3 width, sticky) */}
            {/* Only show for Student and Employee roles */}
            {(role === "student" || role === "employee") &&
              stats &&
              myEvents && (
                <div className="lg:col-span-1 h-full">
                  <div className="sticky top-6 space-y-4">
                    <StatsCard stats={stats} />
                    <MyEventsCard
                      going={myEvents.going}
                      interested={myEvents.interested}
                      onRsvpChange={handleRsvpChange}
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
