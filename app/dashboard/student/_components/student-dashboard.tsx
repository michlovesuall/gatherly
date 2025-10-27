"use client";

import { DashboardHeader } from "./dashboard-header";
import { QuickActions } from "./quick-actions";
import { RecommendedEvents } from "./recommended-events";
import { EventFeed } from "./event-feed";
import { MyEvents } from "./my-events";
import { CertificatesWidget } from "./certificates-widget";
import { NotificationsWidget } from "./notifications-widget";
import { MyClubs } from "./my-clubs";
import { ClubHighlights } from "./club-highlights";
import { ClubAnnouncements } from "./club-announcements";
import type {
  StudentContext,
  EventItem,
  Certificate,
  Club,
  ClubAnnouncement,
} from "@/lib/repos/student";

export interface StudentDashboardProps {
  context: StudentContext;
  feed: EventItem[];
  myEvents: { going: EventItem[]; interested: EventItem[] };
  certificates: Certificate[];
  clubs: Club[];
  clubAnnouncements: ClubAnnouncement[];
  recommendations: EventItem[];
  notifications: Array<{
    id: string;
    title: string;
    time: string;
    unread?: boolean;
  }>;
  stats: { going: number; interested: number; certificates: number };
  isClubMember: boolean;
}

export function StudentDashboard({
  context,
  feed,
  myEvents,
  certificates,
  clubs,
  clubAnnouncements,
  recommendations,
  notifications,
  stats,
  isClubMember,
}: StudentDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        studentName={context.studentName}
        institutionName={context.institutionName}
        avatarUrl={context.avatarUrl}
        stats={stats}
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Club Member Only: My Clubs Section */}
          {isClubMember && <MyClubs clubs={clubs} />}

          {/* Recommended Events (for all students) */}
          <RecommendedEvents recommendations={recommendations} />

          {/* Event Feed (for all students) */}
          <EventFeed events={feed} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <MyEvents going={myEvents.going} interested={myEvents.interested} />

          {/* Club Announcements (for club members only) */}
          {isClubMember && <ClubAnnouncements items={clubAnnouncements} />}

          <CertificatesWidget certificates={certificates} />
          <NotificationsWidget items={notifications} />
        </div>
      </div>
    </div>
  );
}
