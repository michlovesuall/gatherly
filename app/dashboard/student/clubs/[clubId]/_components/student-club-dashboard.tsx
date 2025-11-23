"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calendar,
  Megaphone,
  Search,
  MapPin,
  Link as LinkIcon,
  Users as UsersIcon,
  Tag,
  Rss,
  Eye,
  EyeOff,
  Settings,
  Plus,
  ChevronDown,
  UserPlus,
  ClipboardCheck,
  Loader2,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClubMember, ClubPost } from "@/lib/repos/employee";

interface StudentClubDetails {
  clubId: string;
  clubName: string;
  acronym?: string;
  logo?: string;
  email?: string;
  phone?: string;
  advisorName: string;
  advisorId: string;
  memberCount: number;
  isOfficer: boolean;
  isPresident: boolean;
}

interface StudentClubDashboardProps {
  clubDetails: StudentClubDetails;
  initialMembers: ClubMember[];
  initialPosts: ClubPost[];
  currentUserId: string;
}

export function StudentClubDashboard({
  clubDetails,
  initialMembers,
  initialPosts,
  currentUserId,
}: StudentClubDashboardProps) {
  const router = useRouter();
  const clubId = clubDetails.clubId;
  const [members, setMembers] = useState(initialMembers);
  const [posts, setPosts] = useState(initialPosts);
  const [memberSearch, setMemberSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [postTypeFilter, setPostTypeFilter] = useState<string>("all");
  const [showFeed, setShowFeed] = useState(true);
  const [showPostHistory, setShowPostHistory] = useState(false);

  // Post History filter states
  const [historyTitleFilter, setHistoryTitleFilter] = useState<string>("");
  const [historyDateFilter, setHistoryDateFilter] = useState<string>("all");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all");

  // Add Member Modal states
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [students, setStudents] = useState<
    Array<{
      userId: string;
      name: string;
      email: string;
      idNumber?: string;
      avatarUrl?: string;
      collegeName?: string;
      collegeAcronym?: string;
      departmentName?: string;
      departmentAcronym?: string;
      programAcronym?: string;
    }>
  >([]);
  const [filterOptions, setFilterOptions] = useState<{
    colleges: Array<{ collegeId: string; name: string; acronym?: string }>;
    departments: Array<{
      departmentId: string;
      name: string;
      acronym?: string;
    }>;
    programs: Array<{ programId: string; name: string; acronym?: string }>;
  }>({ colleges: [], departments: [], programs: [] });
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState<string | null>(null);

  // Club Settings Modal states
  const [isClubSettingsModalOpen, setIsClubSettingsModalOpen] = useState(false);
  const [clubName, setClubName] = useState(clubDetails.clubName);
  const [clubAcronym, setClubAcronym] = useState(clubDetails.acronym || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    clubDetails.logo || null
  );
  const [isUpdatingClub, setIsUpdatingClub] = useState(false);

  // Post action states
  const [isDeletingPost, setIsDeletingPost] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ClubPost | null>(null);
  const [isViewPostModalOpen, setIsViewPostModalOpen] = useState(false);

  // Check if user is president
  const isPresident = clubDetails.isPresident || clubDetails.isOfficer;

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date - compact version
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Format full date for events
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter members by search
  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Filter Post History posts
  const filteredHistoryPosts = posts.filter((post) => {
    // Exclude pending posts from history
    if (post.status === "pending") {
      return false;
    }

    // Title filter
    if (
      historyTitleFilter &&
      !post.title.toLowerCase().includes(historyTitleFilter.toLowerCase())
    ) {
      return false;
    }

    // Type filter
    if (historyTypeFilter !== "all" && post.type !== historyTypeFilter) {
      return false;
    }

    // Status filter
    if (historyStatusFilter !== "all") {
      if (
        historyStatusFilter === "published" &&
        post.status !== "published" &&
        post.status !== "approved"
      ) {
        return false;
      }
      if (historyStatusFilter === "hidden" && post.status !== "hidden") {
        return false;
      }
      if (historyStatusFilter === "approved" && post.status !== "approved") {
        return false;
      }
    }

    // Date filter
    if (historyDateFilter !== "all") {
      const postDate = new Date(post.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      switch (historyDateFilter) {
        case "today":
          return postDate >= today;
        case "week":
          return postDate >= weekAgo;
        case "month":
          return postDate >= monthAgo;
        default:
          return true;
      }
    }

    return true;
  });

  // Filter posts - show published/approved posts for all, pending for president
  const filteredPosts = posts.filter((post) => {
    // Show published/approved posts to all, pending posts to president
    if (!isPresident) {
      if (post.status !== "published" && post.status !== "approved") {
        return false;
      }
    } else {
      // President can see pending, published, and approved posts
      if (post.status === "hidden") {
        return false;
      }
    }

    // Post type filter
    if (postTypeFilter !== "all" && post.type !== postTypeFilter) {
      return false;
    }

    // Date filter
    if (dateFilter !== "all") {
      const postDate = new Date(
        post.type === "event"
          ? post.startAt || post.createdAt
          : post.date || post.createdAt
      );
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      switch (dateFilter) {
        case "today":
          return postDate >= today;
        case "week":
          return postDate >= weekAgo;
        case "month":
          return postDate >= monthAgo;
        default:
          return true;
      }
    }

    return true;
  });

  // Fetch students for add member modal
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const params = new URLSearchParams();
      if (studentSearch) params.append("search", studentSearch);
      if (selectedCollege && selectedCollege !== "all")
        params.append("collegeId", selectedCollege);
      if (selectedDepartment && selectedDepartment !== "all")
        params.append("departmentId", selectedDepartment);
      if (selectedProgram && selectedProgram !== "all")
        params.append("programId", selectedProgram);

      const res = await fetch(
        `/api/student/clubs/${clubId}/students?${params.toString()}`
      );
      const data = await res.json();
      if (data?.ok) {
        setStudents(data.students || []);
        if (data.filters) {
          setFilterOptions(data.filters);
        }
      } else {
        console.error("Failed to fetch students:", data?.error);
        alert(data?.error || "Failed to fetch students");
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      alert("Failed to fetch students. Please try again.");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Handle add member
  const handleAddMember = async (userId: string) => {
    setIsAddingMember(userId);
    try {
      const res = await fetch(`/api/student/clubs/${clubId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to add member");
        return;
      }

      // Find the student in the current students list to get their full details
      const student = students.find((s) => s.userId === userId);

      if (student) {
        // Add the new member to the members list
        const newMember: ClubMember = {
          userId: student.userId,
          name: student.name,
          email: student.email,
          avatarUrl: student.avatarUrl,
          role: "member",
        };
        setMembers([...members, newMember]);

        // Remove the student from the students list
        setStudents(students.filter((s) => s.userId !== userId));
      }

      // Refresh students list to update filter options
      await fetchStudents();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add member");
    } finally {
      setIsAddingMember(null);
    }
  };

  // Reset dependent filters when parent filter changes
  useEffect(() => {
    if (selectedCollege === "all") {
      setSelectedDepartment("all");
      setSelectedProgram("all");
    }
  }, [selectedCollege]);

  useEffect(() => {
    if (selectedDepartment === "all") {
      setSelectedProgram("all");
    }
  }, [selectedDepartment]);

  // Fetch students when modal opens or filters change
  useEffect(() => {
    if (isAddMemberModalOpen && clubId && isPresident) {
      fetchStudents();
    }
  }, [
    isAddMemberModalOpen,
    studentSearch,
    selectedCollege,
    selectedDepartment,
    selectedProgram,
    clubId,
    isPresident,
  ]);

  // Handle update club settings
  const handleUpdateClubSettings = async () => {
    if (!clubName.trim()) {
      alert("Please enter a club name");
      return;
    }

    setIsUpdatingClub(true);
    try {
      const formData = new FormData();
      formData.append("clubName", clubName.trim());
      if (clubAcronym.trim()) {
        formData.append("clubAcronym", clubAcronym.trim());
      }
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await fetch(`/api/student/clubs/${clubId}`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to update club settings");
        return;
      }

      // Update local state
      if (data.club) {
        setLogoPreview(data.club.logo || null);
      }

      // Refresh the page to get updated club details
      router.refresh();
      setIsClubSettingsModalOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update club settings");
    } finally {
      setIsUpdatingClub(false);
    }
  };

  // Handle logo file change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle delete post
  const handleDeletePost = async (post: ClubPost) => {
    if (
      !confirm(
        `Are you sure you want to delete "${post.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeletingPost(post.id);
    try {
      const res = await fetch(
        `/api/student/clubs/${clubId}/posts/${post.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to delete post");
        return;
      }

      // Remove post from list
      setPosts(posts.filter((p) => p.id !== post.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete post");
    } finally {
      setIsDeletingPost(null);
    }
  };

  // Handle toggle hide/show post
  const handleTogglePostStatus = async (post: ClubPost) => {
    setIsUpdatingStatus(post.id);
    try {
      const newStatus = post.status === "hidden" ? "published" : "hidden";
      const res = await fetch(
        `/api/student/clubs/${clubId}/posts/${post.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: post.type,
            status: newStatus,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to update post status");
        return;
      }

      // Update posts list
      setPosts(
        posts.map((p) =>
          p.id === post.id
            ? { ...p, status: newStatus as "published" | "hidden" }
            : p
        )
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update post status");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Handle view post
  const handleViewPost = (post: ClubPost) => {
    setSelectedPost(post);
    setIsViewPostModalOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Compact Header */}
      <div className="sticky top-0 z-50 w-full bg-background border-b">
        <Card className="rounded-none border-x-0 border-t-0 w-full">
          <CardContent className="px-0">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-3 px-4 lg:px-6">
              {/* Left Side */}
              <div className="flex items-center gap-2 lg:gap-3 flex-1">
                <SidebarTrigger className="cursor-pointer" />
                <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                  <AvatarImage
                    src={clubDetails.logo}
                    alt={clubDetails.clubName}
                  />
                  <AvatarFallback>
                    {clubDetails.acronym
                      ? clubDetails.acronym.toUpperCase().slice(0, 2)
                      : getInitials(clubDetails.clubName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-base font-semibold">
                    {clubDetails.clubName}
                  </h1>
                  <div className="text-xs text-muted-foreground">
                    {clubDetails.acronym && <span>{clubDetails.acronym}</span>}
                    {clubDetails.acronym &&
                      clubDetails.memberCount !== undefined &&
                      " • "}
                    {clubDetails.memberCount !== undefined && (
                      <span>{clubDetails.memberCount} Members</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle - Empty space for layout consistency */}
              <div className="flex items-center justify-center flex-1"></div>

              {/* Right Side - Action Buttons */}
              <div className="flex items-center gap-1 flex-1 justify-end">
                <Button
                  variant={showFeed && !showPostHistory ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-2 lg:px-3 text-xs"
                  onClick={() => {
                    setShowFeed(true);
                    setShowPostHistory(false);
                  }}
                >
                  <Rss className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Feed</span>
                </Button>
                {isPresident && (
                  <>
                    <Button
                      variant={showPostHistory ? "default" : "outline"}
                      size="sm"
                      className="h-8 px-2 lg:px-3 text-xs"
                      onClick={() => {
                        setShowPostHistory(true);
                        setShowFeed(false);
                      }}
                    >
                      <ClipboardCheck className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                      <span className="hidden lg:inline">Post History</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 lg:px-3 text-xs"
                    onClick={() => setIsClubSettingsModalOpen(true)}
                    >
                      <Settings className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                      <span className="hidden lg:inline">Club Settings</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 py-6">
          {showPostHistory ? (
            /* Post History View */
            <div className="h-full overflow-y-auto">
              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <CardTitle>Post History</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      {/* Title Filter */}
                      <Input
                        placeholder="Search by title..."
                        value={historyTitleFilter}
                        onChange={(e) => setHistoryTitleFilter(e.target.value)}
                        className="w-full lg:w-[200px] h-8 text-xs"
                      />
                      {/* Date Filter */}
                      <Select
                        value={historyDateFilter}
                        onValueChange={setHistoryDateFilter}
                      >
                        <SelectTrigger className="w-full lg:w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dates</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Type Filter */}
                      <Select
                        value={historyTypeFilter}
                        onValueChange={setHistoryTypeFilter}
                      >
                        <SelectTrigger className="w-full lg:w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="announcement">
                            Announcement
                          </SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Status Filter */}
                      <Select
                        value={historyStatusFilter}
                        onValueChange={setHistoryStatusFilter}
                      >
                        <SelectTrigger className="w-full lg:w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredHistoryPosts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No post history found
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Post Title</TableHead>
                          <TableHead>Post Type</TableHead>
                          <TableHead>When Posted</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistoryPosts
                          .sort((a, b) => {
                            // Sort by created date, newest first
                            return (
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime()
                            );
                          })
                          .map((post) => (
                            <TableRow key={post.id}>
                              <TableCell className="font-medium">
                                {post.title}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {post.type === "event" ? (
                                    <Calendar className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Megaphone className="h-3 w-3 mr-1" />
                                  )}
                                  {post.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(post.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    post.status === "published" ||
                                    post.status === "approved"
                                      ? "default"
                                      : post.status === "hidden"
                                      ? "outline"
                                      : "secondary"
                                  }
                                >
                                  {post.status === "published" ||
                                  post.status === "approved"
                                    ? "Published"
                                    : post.status === "hidden"
                                    ? "Hidden"
                                    : post.status}
                                </Badge>
                              </TableCell>
                              {isPresident && (
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewPost(post)}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleTogglePostStatus(post)}
                                      disabled={isUpdatingStatus === post.id}
                                    >
                                      {isUpdatingStatus === post.id ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : post.status === "hidden" ? (
                                        <Eye className="h-3 w-3 mr-1" />
                                      ) : (
                                        <EyeOff className="h-3 w-3 mr-1" />
                                      )}
                                      {post.status === "hidden" ? "Show" : "Hide"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeletePost(post)}
                                      disabled={isDeletingPost === post.id}
                                    >
                                      {isDeletingPost === post.id ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3 w-3 mr-1" />
                                      )}
                                      Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Left Column - Feed (2/3) */}
              <div className="lg:col-span-2 h-full overflow-y-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>Feed</CardTitle>

                    {/* Filters - Middle */}
                    <div className="flex items-center gap-2 flex-1 justify-center">
                      <Select
                        value={dateFilter}
                        onValueChange={setDateFilter}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dates</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={postTypeFilter}
                        onValueChange={setPostTypeFilter}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Posts</SelectItem>
                          <SelectItem value="announcement">
                            Announcement
                          </SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Post Button - Right (for President only) */}
                    {isPresident && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="h-8">
                            <Plus className="h-3 w-3 mr-2" />
                            Post
                            <ChevronDown className="h-3 w-3 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              // TODO: Open post modal for announcement
                            }}
                          >
                            <Megaphone className="h-4 w-4 mr-2" />
                            Announcement
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // TODO: Open post modal for event
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No posts found
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <Card
                        key={post.id}
                        className="overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {post.imageUrl && (
                          <div className="relative h-32 w-full overflow-hidden">
                            <Image
                              src={post.imageUrl}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-2 pt-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <div
                                className={`p-1.5 rounded ${
                                  post.type === "event"
                                    ? "bg-blue-100 dark:bg-blue-900"
                                    : "bg-purple-100 dark:bg-purple-900"
                                } flex-shrink-0`}
                              >
                                {post.type === "event" ? (
                                  <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <Megaphone className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold mb-0.5 line-clamp-1">
                                  {post.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                  <span className="truncate">
                                    by {post.authorName}
                                  </span>
                                  <span>•</span>
                                  <span className="whitespace-nowrap">
                                    {formatDate(post.createdAt)}
                                  </span>
                                  {post.visibility && (
                                    <>
                                      <span>•</span>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1 py-0 h-4"
                                      >
                                        {post.visibility === "public"
                                          ? "Public"
                                          : post.visibility === "restricted"
                                          ? "Selected"
                                          : "Institution"}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        {post.content && (
                          <CardContent className="pt-0 pb-3 space-y-2">
                            <p className="text-xs leading-relaxed line-clamp-3">
                              {post.content}
                            </p>
                            {post.type === "event" && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t">
                                {post.startAt && (
                                  <div className="flex items-start gap-1.5">
                                    <Calendar className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-medium text-muted-foreground">
                                        Start
                                      </p>
                                      <p className="text-xs truncate">
                                        {formatFullDate(post.startAt)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {post.endAt && (
                                  <div className="flex items-start gap-1.5">
                                    <Calendar className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-medium text-muted-foreground">
                                        End
                                      </p>
                                      <p className="text-xs truncate">
                                        {formatFullDate(post.endAt)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {post.venue && (
                                  <div className="flex items-start gap-1.5">
                                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-medium text-muted-foreground">
                                        Venue
                                      </p>
                                      <p className="text-xs truncate">
                                        {post.venue}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {post.link && (
                                  <div className="flex items-start gap-1.5">
                                    <LinkIcon className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-medium text-muted-foreground">
                                        Registration
                                      </p>
                                      <a
                                        href={post.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline truncate block"
                                      >
                                        Open Link
                                      </a>
                                    </div>
                                  </div>
                                )}
                                {post.maxSlots && (
                                  <div className="flex items-start gap-1.5">
                                    <UsersIcon className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-medium text-muted-foreground">
                                        Max Slots
                                      </p>
                                      <p className="text-xs">
                                        {post.maxSlots}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {post.tags && post.tags.length > 0 && (
                                  <div className="flex items-start gap-1.5 md:col-span-2">
                                    <Tag className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                                        Tags
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {post.tags.map((tag, idx) => (
                                          <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="text-[10px] px-1 py-0 h-4"
                                          >
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
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
                      {isPresident && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                    onClick={() => setIsAddMemberModalOpen(true)}
                        >
                          <UserPlus className="h-3 w-3 mr-2" />
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
                              {getInitials(
                                clubDetails.advisorName || "Adviser"
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {clubDetails.advisorName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Adviser
                            </p>
                          </div>
                        </div>
                      </div>
                      {filteredMembers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
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
                                <p className="font-medium text-sm">
                                  {member.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {member.role === "officer"
                                    ? "President"
                                    : "Member"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {isPresident && (
        <Dialog
          open={isAddMemberModalOpen}
          onOpenChange={(open) => {
            setIsAddMemberModalOpen(open);
            if (!open) {
              setStudentSearch("");
              setSelectedCollege("all");
              setSelectedDepartment("all");
              setSelectedProgram("all");
              setStudents([]);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Member</DialogTitle>
              <DialogDescription>
                Search for students in your institution to add as club members
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or ID number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="min-w-0">
                    <Select
                      value={selectedCollege}
                      onValueChange={setSelectedCollege}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder="All Colleges"
                          className="truncate"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Colleges</SelectItem>
                        {filterOptions.colleges.map((college) => (
                          <SelectItem
                            key={college.collegeId}
                            value={college.collegeId}
                          >
                            {college.acronym
                              ? `${college.acronym} - ${college.name}`
                              : college.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-0">
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                      disabled={selectedCollege === "all"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            selectedCollege === "all"
                              ? "Select college first"
                              : "All Departments"
                          }
                          className="truncate"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {filterOptions.departments.map((dept) => (
                          <SelectItem
                            key={dept.departmentId}
                            value={dept.departmentId}
                          >
                            {dept.acronym
                              ? `${dept.acronym} - ${dept.name}`
                              : dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-0">
                    <Select
                      value={selectedProgram}
                      onValueChange={setSelectedProgram}
                      disabled={selectedDepartment === "all"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            selectedDepartment === "all"
                              ? "Select department first"
                              : "All Programs"
                          }
                          className="truncate"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {filterOptions.programs.map((program) => (
                          <SelectItem
                            key={program.programId}
                            value={program.programId}
                          >
                            {program.acronym
                              ? `${program.acronym} - ${program.name}`
                              : program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Students List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {isLoadingStudents ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading students...
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No students found. Try adjusting your search or filters.
                  </div>
                ) : (
                  students.map((student) => {
                    const isAlreadyMember = members.some(
                      (m) => m.userId === student.userId
                    );
                    return (
                      <div
                        key={student.userId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage
                              src={student.avatarUrl}
                              alt={student.name}
                            />
                            <AvatarFallback>
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {student.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.email}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {student.collegeAcronym && (
                                <Badge variant="outline" className="text-[10px]">
                                  {student.collegeAcronym}
                                </Badge>
                              )}
                              {student.departmentAcronym && (
                                <Badge variant="outline" className="text-[10px]">
                                  {student.departmentAcronym}
                                </Badge>
                              )}
                              {student.programAcronym && (
                                <Badge variant="outline" className="text-[10px]">
                                  {student.programAcronym}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(student.userId)}
                          disabled={
                            isAlreadyMember || isAddingMember === student.userId
                          }
                        >
                          {isAddingMember === student.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isAlreadyMember ? (
                            "Already Member"
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Club Settings Modal */}
      {isPresident && (
        <Dialog
          open={isClubSettingsModalOpen}
          onOpenChange={(open) => {
            setIsClubSettingsModalOpen(open);
            if (!open) {
              // Reset form when closing
              setClubName(clubDetails.clubName);
              setClubAcronym(clubDetails.acronym || "");
              setLogoFile(null);
              setLogoPreview(clubDetails.logo || null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Club Settings</DialogTitle>
              <DialogDescription>
                Update club information. Only presidents can modify these
                settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* First Column */}
              <div className="space-y-4">
                {/* Club Information Display */}
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-sm">Club Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Members:</span>{" "}
                      <span className="text-muted-foreground">
                        {clubDetails.memberCount || 0}
                      </span>
                    </div>
                    {clubDetails.advisorName && (
                      <div>
                        <span className="font-medium">Adviser:</span>{" "}
                        <span className="text-muted-foreground">
                          {clubDetails.advisorName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="grid gap-2">
                  <Label htmlFor="logo">Club Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a new logo to replace the current one. Recommended
                    size: 512x512px
                  </p>
                </div>
              </div>

              {/* Second Column - Logo Preview */}
              <div className="flex flex-col">
                <Label className="mb-2">Logo Preview</Label>
                {logoPreview ? (
                  <div className="relative w-full aspect-square max-w-[192px] rounded-lg overflow-hidden border">
                    <Image
                      src={logoPreview}
                      alt="Club logo"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0 z-10"
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full aspect-square max-w-[192px] rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center px-4">
                      No logo uploaded
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Club Name and Acronym - Full Width */}
            <div className="space-y-4">
              {/* Club Name */}
              <div className="grid gap-2">
                <Label htmlFor="clubName">
                  Club Name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="clubName"
                  placeholder="Enter club name"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                />
              </div>

              {/* Club Acronym */}
              <div className="grid gap-2">
                <Label htmlFor="clubAcronym">Club Acronym</Label>
                <Input
                  id="clubAcronym"
                  placeholder="Enter club acronym"
                  value={clubAcronym}
                  onChange={(e) =>
                    setClubAcronym(e.target.value.toUpperCase())
                  }
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Short abbreviation for the club name (e.g., CS, IT, ENG)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsClubSettingsModalOpen(false);
                  setClubName(clubDetails.clubName);
                  setClubAcronym(clubDetails.acronym || "");
                  setLogoFile(null);
                  setLogoPreview(clubDetails.logo || null);
                }}
                disabled={isUpdatingClub}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateClubSettings}
                disabled={isUpdatingClub || !clubName.trim()}
              >
                {isUpdatingClub ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Settings"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Post Modal */}
      <Dialog
        open={isViewPostModalOpen}
        onOpenChange={(open) => {
          setIsViewPostModalOpen(open);
          if (!open) {
            setSelectedPost(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>View post information</DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              {/* Post Preview */}
              <Card>
                {selectedPost.imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={selectedPost.imageUrl}
                      alt={selectedPost.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedPost.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {selectedPost.authorName} •{" "}
                        {formatDate(selectedPost.createdAt)}
                      </p>
                    </div>
                    <Badge variant="secondary">{selectedPost.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                  {selectedPost.type === "event" && (
                    <div className="mt-4 space-y-2 pt-4 border-t">
                      {selectedPost.startAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Start:</span>
                          <span>
                            {new Date(selectedPost.startAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedPost.endAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">End:</span>
                          <span>
                            {new Date(selectedPost.endAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedPost.venue && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Venue:</span>
                          <span>{selectedPost.venue}</span>
                        </div>
                      )}
                      {selectedPost.link && (
                        <div className="flex items-center gap-2 text-sm">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={selectedPost.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Registration Link
                          </a>
                        </div>
                      )}
                      {selectedPost.maxSlots && (
                        <div className="flex items-center gap-2 text-sm">
                          <UsersIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Max Slots:</span>
                          <span>{selectedPost.maxSlots}</span>
                        </div>
                      )}
                      {selectedPost.tags && selectedPost.tags.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-wrap gap-1">
                            {selectedPost.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewPostModalOpen(false);
                setSelectedPost(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

