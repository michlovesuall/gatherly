# Student Dashboard - Production Implementation

This dashboard now connects to real Neo4j database and displays live data.

## Architecture

### Data Flow

```
Page (Server) → Lib/Repos → Neo4j → Components (Client)
```

### Files Structure

```
app/(dashboard)/student/
├── _components/              # Presentational components
│   ├── student-dashboard.tsx (Main orchestrator)
│   ├── dashboard-header.tsx
│   ├── quick-actions.tsx
│   ├── event-feed.tsx
│   ├── my-events.tsx
│   ├── recommended-events.tsx
│   ├── certificates-widget.tsx
│   ├── notifications-widget.tsx
│   ├── my-clubs.tsx
│   ├── club-highlights.tsx
│   └── club-announcements.tsx
├── layout.tsx               # Student layout (no sidebar)
└── page.tsx                  # Server component with data fetching

lib/
├── repos/student.ts          # Data access layer (Cypher queries)
├── auth/session.ts           # Session management
└── neo4j.ts                  # Neo4j driver
```

## Data Access

All queries in `lib/repos/student.ts`:

- `getStudentContext(userId)` - Get student name, institution, clubs count
- `getEventFeed(userId, institutionId)` - Events from user's institution
- `getMyEvents(userId)` - Student's RSVP'd events (going/interested)
- `getCertificates(userId)` - Latest 3 certificates
- `getMyClubs(userId)` - Clubs where user is a member
- `getClubAnnouncements(userId)` - Announcements from joined clubs
- `getRecommendedEvents(userId, institutionId)` - Tag-based recommendations
- `getNotifications(userId)` - Latest 5 notifications

## Authentication

Uses cookie-based session:

1. `getSession()` reads session cookie
2. Validates against Neo4j Session nodes
3. Returns user with role, userId, institutionId
4. Redirects to login if no session
5. Redirects to correct role dashboard if role mismatch

## Features

### View Modes (Automatic Detection)

Based on `context.clubsCount`:

- **Ordinary Student** (`clubsCount === 0`)

  - Shows: Recommended events, event feed, my events, certificates, notifications
  - Hides: My Clubs, Club Events, Club Announcements

- **Club Member** (`clubsCount > 0`)
  - Shows everything in Ordinary view
  - Plus: My Clubs, Club Events, Club Announcements

### Performance

- **ISR**: `revalidate = 60` on page.tsx for feed data
- **Parallel Fetching**: All data fetched in `Promise.all()`
- **Client Components**: Only presentation layer is client-side
- **Server Components**: Data fetching in server layer

### Types

All types exported from `lib/repos/student.ts`:

- `StudentContext`
- `EventItem`
- `Certificate`
- `Club`
- `ClubAnnouncement`

## Access

Visit: `/dashboard/student` (requires authentication)

## Data Requirements

### Neo4j Schema

```
(User)-[:MEMBER_OF]->(Institution)
(User)-[:MEMBER_OF_CLUB]->(Club)
(User)-[:RSVP {state}]->(RSVP)-[:FOR]->(Event)
(User)-[:INTERESTED_IN]->(Tag)
(Event)-[:HAS_TAG]->(Tag)
(Certificate)-[:FOR_EVENT]->(Event)
(Announcement)-[:BELONGS_TO]->(Institution)
```

## Notes

- No mock data - all queries use real database
- No dev overrides - production-ready
- Server-side rendering with React Server Components
- Type-safe with strict TypeScript
- Empty states show for real empty data
- Club sections dynamically show/hide based on membership
