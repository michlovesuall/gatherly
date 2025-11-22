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
  myEvents: { going: EventItem[]; interested: EventItem[] };
  stats: { going: number; interested: number; certificates: number };
  role: "student" | "employee" | "institution" | "super_admin";
}

export function NewsfeedPage({
  context,
  feedItems: initialFeedItems,
  myEvents,
  stats,
  role,
}: NewsfeedPageProps) {
  const [feedFilter, setFeedFilter] = useState<"for-you" | "global">("for-you");
  const [feedItems, setFeedItems] = useState<NewsfeedItem[]>(initialFeedItems);
  const [loading, setLoading] = useState(false);

  // Fetch feed items when filter changes
  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/newsfeed?filter=${feedFilter}`);
        const data = await response.json();
        if (data.ok) {
          setFeedItems(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [feedFilter]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Sticky Header */}
      <NewsfeedHeader
        context={context}
        role={role}
        feedFilter={feedFilter}
        onFilterChange={setFeedFilter}
      />

      {/* Main Content - Two Columns */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* First Column - Feed (2/3 width, scrollable) */}
            <div className="lg:col-span-2 h-full overflow-y-auto">
              <NewsfeedFeed
                items={feedItems}
                filter={feedFilter}
                onFilterChange={setFeedFilter}
                loading={loading}
              />
            </div>

            {/* Second Column - Stats and My Events Card (1/3 width, sticky) */}
            <div className="lg:col-span-1 h-full">
              <div className="sticky top-6 space-y-4">
                <StatsCard stats={stats} />
                <MyEventsCard
                  going={myEvents.going}
                  interested={myEvents.interested}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
