"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserPlus,
  Eye,
  Calendar,
  Megaphone,
  Loader2,
  Search,
  ClipboardCheck,
  Plus,
  X,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type {
  ClubDetails,
  ClubMember,
  ClubPost,
} from "@/lib/repos/employee";

interface AdvisorClubDashboardProps {
  clubDetails: ClubDetails;
  initialMembers: ClubMember[];
  initialPosts: ClubPost[];
}

export function AdvisorClubDashboard({
  clubDetails,
  initialMembers,
  initialPosts,
}: AdvisorClubDashboardProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [posts, setPosts] = useState(initialPosts);
  const [memberSearch, setMemberSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [isViewMemberModalOpen, setIsViewMemberModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  // Filter members by search
  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Get pending posts count
  const pendingCount = posts.filter((post) => post.status === "pending").length;

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle view member
  const handleViewMember = (member: ClubMember) => {
    setSelectedMember(member);
    setIsViewMemberModalOpen(true);
  };

  // Handle remove member
  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setActionLoading(selectedMember.userId);
    try {
      const res = await fetch(
        `/api/employee/clubs/${clubDetails.clubId}/members/${selectedMember.userId}/remove`,
        {
          method: "PATCH",
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to remove member");
        return;
      }

      // Update members list
      setMembers(members.filter((m) => m.userId !== selectedMember.userId));
      setIsViewMemberModalOpen(false);
      setSelectedMember(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reassign member (change role)
  const handleReassignMember = async (newRole: "member" | "officer") => {
    if (!selectedMember) return;

    setActionLoading(selectedMember.userId);
    try {
      const res = await fetch(
        `/api/employee/clubs/${clubDetails.clubId}/members/${selectedMember.userId}/reassign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to reassign member");
        return;
      }

      // Update members list
      setMembers(
        members.map((m) =>
          m.userId === selectedMember.userId ? { ...m, role: newRole } : m
        )
      );
      setIsViewMemberModalOpen(false);
      setSelectedMember(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to reassign member");
    } finally {
      setActionLoading(null);
    }
  };

  // Check if user can add members (advisor or club president)
  // For now, advisor can always add members
  const canAddMembers = true;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Compact Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <Card className="rounded-none border-x-0 border-t-0">
          <CardContent>
            <div className="flex items-center gap-2 lg:gap-3">
              <SidebarTrigger className="cursor-pointer" />
              <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                <AvatarImage src={clubDetails.logo} alt={clubDetails.clubName} />
                <AvatarFallback>
                  {clubDetails.acronym
                    ? clubDetails.acronym.toUpperCase().slice(0, 2)
                    : getInitials(clubDetails.clubName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-base font-semibold">{clubDetails.clubName}</h1>
                <div className="text-xs text-muted-foreground">
                  {clubDetails.acronym && <span>{clubDetails.acronym}</span>}
                  {clubDetails.acronym && clubDetails.memberCount !== undefined && " • "}
                  {clubDetails.memberCount !== undefined && (
                    <span>{clubDetails.memberCount} Members</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 py-6">
          {/* Main Content - 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Left Column - Feed (2/3) */}
              <div className="lg:col-span-2 h-full overflow-y-auto">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Feed</CardTitle>
                      <Button onClick={() => setIsPostModalOpen(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Post
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {posts.filter(
                      (post) => post.status === "published" || post.status === "approved"
                    ).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No approved posts yet
                      </div>
                    ) : (
                      posts
                        .filter(
                          (post) => post.status === "published" || post.status === "approved"
                        )
                        .map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {post.type === "event" ? (
                            <Calendar className="h-5 w-5 text-primary" />
                          ) : (
                            <Megaphone className="h-5 w-5 text-primary" />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold">
                              {post.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              by {post.authorName} ({post.authorType}) •{" "}
                              {formatDate(post.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            post.status === "published"
                              ? "default"
                              : post.status === "pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {post.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    {post.content && (
                      <CardContent>
                        <p className="text-sm">{post.content}</p>
                        {post.type === "event" && (
                          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                            {post.startAt && (
                              <div>
                                <strong>Start:</strong>{" "}
                                {formatDate(post.startAt)}
                              </div>
                            )}
                            {post.endAt && (
                              <div>
                                <strong>End:</strong> {formatDate(post.endAt)}
                              </div>
                            )}
                            {post.venue && (
                              <div>
                                <strong>Venue:</strong> {post.venue}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

              {/* Right Column - Members (1/3) */}
              <div className="h-full">
                <div className="sticky top-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle>Members</CardTitle>
                        {canAddMembers && (
                          <Button size="sm" variant="outline">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Member
                          </Button>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {/* Adviser Section */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {getInitials(clubDetails.advisorName || "Adviser")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">Adviser</p>
                              <p className="text-xs text-muted-foreground">
                                {clubDetails.advisorName}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // You can add view adviser functionality here
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                        {filteredMembers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No members found
                          </div>
                        ) : (
                          filteredMembers.map((member) => (
                            <div
                              key={member.userId}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={member.avatarUrl}
                                    alt={member.name}
                                  />
                                  <AvatarFallback>
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.role === "officer" ? "President" : "Member"}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewMember(member)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* View Member Modal */}
      <Dialog
        open={isViewMemberModalOpen}
        onOpenChange={setIsViewMemberModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>
              View and manage member information
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={selectedMember.avatarUrl}
                    alt={selectedMember.name}
                  />
                  <AvatarFallback>
                    {getInitials(selectedMember.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedMember.name}
                  </h3>
                  <Badge
                    variant={
                      selectedMember.role === "officer" ? "default" : "secondary"
                    }
                  >
                    {selectedMember.role === "officer" ? "President" : "Member"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.email}
                  </p>
                </div>
                {selectedMember.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.phone}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.role === "officer" ? "President" : "Member"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsViewMemberModalOpen(false);
                setSelectedMember(null);
              }}
            >
              Close
            </Button>
            {selectedMember && (
              <>
                {selectedMember.role === "member" ? (
                  <Button
                    variant="default"
                    onClick={() => handleReassignMember("officer")}
                    disabled={actionLoading === selectedMember.userId}
                  >
                    {actionLoading === selectedMember.userId ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Assign as President
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => handleReassignMember("member")}
                    disabled={actionLoading === selectedMember.userId}
                  >
                    {actionLoading === selectedMember.userId ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Remove as President
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={handleRemoveMember}
                  disabled={actionLoading === selectedMember.userId}
                >
                  {actionLoading === selectedMember.userId ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Remove Member
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Modal - Placeholder */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
            <DialogDescription>
              Create an announcement or event for the club
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Post creation form will be implemented here
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPostModalOpen(false)}
            >
              Cancel
            </Button>
            <Button>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Modal - Placeholder */}
      <Dialog
        open={isApprovalModalOpen}
        onOpenChange={setIsApprovalModalOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post & Event Approvals</DialogTitle>
            <DialogDescription>
              Review and approve posts and events created by club members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {posts.filter((p) => p.status === "pending").length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pending approvals
              </p>
            ) : (
              posts
                .filter((p) => p.status === "pending")
                .map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{post.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {post.authorName} • {formatDate(post.createdAt)}
                          </p>
                        </div>
                        <Badge variant="secondary">{post.type}</Badge>
                      </div>
                    </CardHeader>
                    {post.content && (
                      <CardContent>
                        <p className="text-sm">{post.content}</p>
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={async () => {
                              setActionLoading(post.id);
                              try {
                                const res = await fetch(
                                  `/api/employee/clubs/${clubDetails.clubId}/posts/${post.id}/approve`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      type: post.type,
                                      action: "approve",
                                    }),
                                  }
                                );

                                const data = await res.json();

                                if (!res.ok || !data?.ok) {
                                  alert(data?.error || "Failed to approve post");
                                  return;
                                }

                                // Update posts list
                                setPosts(
                                  posts.map((p) =>
                                    p.id === post.id
                                      ? { ...p, status: "published" }
                                      : p
                                  )
                                );
                                router.refresh();
                              } catch (e) {
                                alert(
                                  e instanceof Error
                                    ? e.message
                                    : "Failed to approve post"
                                );
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                            disabled={actionLoading === post.id}
                          >
                            {actionLoading === post.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Are you sure you want to reject this post?"
                                )
                              ) {
                                return;
                              }

                              setActionLoading(post.id);
                              try {
                                const res = await fetch(
                                  `/api/employee/clubs/${clubDetails.clubId}/posts/${post.id}/approve`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      type: post.type,
                                      action: "reject",
                                    }),
                                  }
                                );

                                const data = await res.json();

                                if (!res.ok || !data?.ok) {
                                  alert(data?.error || "Failed to reject post");
                                  return;
                                }

                                // Remove post from list
                                setPosts(posts.filter((p) => p.id !== post.id));
                                router.refresh();
                              } catch (e) {
                                alert(
                                  e instanceof Error
                                    ? e.message
                                    : "Failed to reject post"
                                );
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                            disabled={actionLoading === post.id}
                          >
                            {actionLoading === post.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

