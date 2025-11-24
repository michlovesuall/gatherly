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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [postToDelete, setPostToDelete] = useState<ClubPost | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);

  // Post Modal states
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postType, setPostType] = useState<"announcement" | "event" | null>(null);
  const [postFormData, setPostFormData] = useState({
    title: "",
    description: "",
    visibility: "institution" as "institution" | "public" | "restricted",
    date: "",
    endDate: "",
    venue: "",
    link: "",
    maxSlots: "",
    tags: [] as string[],
    image: null as File | null,
  });
  const [tagInput, setTagInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Check if user is president or advisor
  const isPresident = clubDetails.isPresident || clubDetails.isOfficer;
  const isAdvisor = currentUserId === clubDetails.advisorId;
  const canHidePosts = isPresident || isAdvisor;

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

  // Handle delete post confirmation
  const handleDeletePostClick = (post: ClubPost) => {
    setPostToDelete(post);
    setIsDeleteConfirmModalOpen(true);
  };

  // Handle delete post
  const handleDeletePost = async () => {
    if (!postToDelete) return;

    setIsDeletingPost(postToDelete.id);
    try {
      const res = await fetch(
        `/api/student/clubs/${clubId}/posts/${postToDelete.id}`,
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
      setPosts(posts.filter((p) => p.id !== postToDelete.id));
      setIsDeleteConfirmModalOpen(false);
      setPostToDelete(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete post");
    } finally {
      setIsDeletingPost(null);
    }
  };

  // Handle post type selection
  const handlePostTypeSelect = (type: "announcement" | "event") => {
    setPostType(type);
    setIsPostModalOpen(true);
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostFormData({ ...postFormData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/student/clubs/${clubId}/posts`);
      const data = await res.json();
      if (data?.ok && data?.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  // Handle create post
  const handleCreatePost = async () => {
    if (!postType) return;

    if (!postFormData.title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!postFormData.description.trim()) {
      alert("Please enter a description");
      return;
    }

    if (postType === "event") {
      if (!postFormData.date) {
        alert("Please select a start date");
        return;
      }
      if (!postFormData.endDate) {
        alert("Please select an end date");
        return;
      }
      if (!postFormData.venue.trim()) {
        alert("Please enter a venue for the event");
        return;
      }
      if (postFormData.tags.length === 0) {
        alert("Please add at least one tag");
        return;
      }
    }

    setIsSubmittingPost(true);
    try {
      const formData = new FormData();
      formData.append("type", postType);
      formData.append("title", postFormData.title);
      formData.append("description", postFormData.description);
      formData.append("visibility", postFormData.visibility);
      if (postType === "event") {
        formData.append("date", postFormData.date);
        if (postFormData.endDate) {
          formData.append("endDate", postFormData.endDate);
        }
        formData.append("venue", postFormData.venue);
        if (postFormData.link) {
          formData.append("link", postFormData.link);
        }
        if (postFormData.maxSlots) {
          formData.append("maxSlots", postFormData.maxSlots);
        }
        if (postFormData.tags.length > 0) {
          formData.append("tags", postFormData.tags.join(", "));
        }
      }
      if (postFormData.image) {
        formData.append("image", postFormData.image);
      }

      const res = await fetch(`/api/student/clubs/${clubId}/posts`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to create post");
        return;
      }

      // Reset form and close modal
      setPostFormData({
        title: "",
        description: "",
        visibility: "institution",
        date: "",
        endDate: "",
        venue: "",
        link: "",
        maxSlots: "",
        tags: [],
        image: null,
      });
      setTagInput("");
      setImagePreview(null);
      setPostType(null);
      setIsPostModalOpen(false);

      // Fetch updated posts
      await fetchPosts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create post");
    } finally {
      setIsSubmittingPost(false);
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
    <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/20 overflow-hidden">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-sm">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4 py-3">
            {/* Left Side - Club Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SidebarTrigger className="cursor-pointer shrink-0" />
              <Avatar className="h-10 w-10 lg:h-12 lg:w-12 ring-2 ring-primary/20 shrink-0">
                <AvatarImage
                  src={clubDetails.logo}
                  alt={clubDetails.clubName}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {clubDetails.acronym
                    ? clubDetails.acronym.toUpperCase().slice(0, 2)
                    : getInitials(clubDetails.clubName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg lg:text-xl font-bold truncate">
                  {clubDetails.clubName}
                </h1>
                <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                  {clubDetails.acronym && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {clubDetails.acronym}
                    </Badge>
                  )}
                  {clubDetails.memberCount !== undefined && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" />
                        {clubDetails.memberCount} Members
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <Button
                variant={showFeed && !showPostHistory ? "default" : "outline"}
                size="sm"
                className="h-9 px-3 lg:px-4 text-xs lg:text-sm font-medium"
                onClick={() => {
                  setShowFeed(true);
                  setShowPostHistory(false);
                }}
              >
                <Rss className="h-3.5 w-3.5 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Feed</span>
              </Button>
              {isPresident && (
                <>
                  <Button
                    variant={showPostHistory ? "default" : "outline"}
                    size="sm"
                    className="h-9 px-3 lg:px-4 text-xs lg:text-sm font-medium"
                    onClick={() => {
                      setShowPostHistory(true);
                      setShowFeed(false);
                    }}
                  >
                    <ClipboardCheck className="h-3.5 w-3.5 lg:h-4 lg:w-4 lg:mr-2" />
                    <span className="hidden lg:inline">History</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 lg:px-4 text-xs lg:text-sm font-medium"
                    onClick={() => setIsClubSettingsModalOpen(true)}
                  >
                    <Settings className="h-3.5 w-3.5 lg:h-4 lg:w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Settings</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
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
                                      onClick={() => handleDeletePostClick(post)}
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
              <div className="lg:col-span-2 h-full flex flex-col">
              <Card className="shadow-sm flex flex-col h-full overflow-hidden">
                <CardHeader className="pb-4 sticky top-0 z-10 bg-background border-b shrink-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg lg:text-xl">Feed</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Latest updates and announcements
                      </p>
                    </div>

                    {/* Filters and Post Button */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Select
                        value={dateFilter}
                        onValueChange={setDateFilter}
                      >
                        <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs">
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
                        <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs">
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

                      {/* Post Button - Right (for President only) */}
                      {isPresident && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="h-9 px-3 font-medium">
                              <Plus className="h-4 w-4 mr-2" />
                              Post
                              <ChevronDown className="h-3 w-3 ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handlePostTypeSelect("announcement")}
                            >
                              <Megaphone className="h-4 w-4 mr-2" />
                              Announcement
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePostTypeSelect("event")}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <div className="flex-1 overflow-y-auto min-h-0">
                <CardContent className="space-y-3 pt-0">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No posts found
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <Card
                        key={post.id}
                        className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary/50"
                      >
                        {post.imageUrl && (
                          <div className="relative h-40 w-full overflow-hidden bg-muted">
                            <Image
                              src={post.imageUrl}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
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
                            {canHidePosts && (
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-muted"
                                  onClick={() => handleTogglePostStatus(post)}
                                  disabled={isUpdatingStatus === post.id}
                                  title={
                                    post.status === "hidden"
                                      ? "Show post"
                                      : "Hide post"
                                  }
                                >
                                  {isUpdatingStatus === post.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  ) : post.status === "hidden" ? (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            )}
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
                </div>
              </Card>
            </div>

            {/* Right Column - Members (1/3) */}
            <div className="h-full">
              <div className="sticky top-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <CardTitle className="text-lg">Members</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                      {isPresident && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-3 font-medium"
                          onClick={() => setIsAddMemberModalOpen(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Adviser Section */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(
                                clubDetails.advisorName || "Adviser"
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">
                              {clubDetails.advisorName}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <UsersIcon className="h-3 w-3" />
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
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-11 w-11">
                                <AvatarImage
                                  src={member.avatarUrl}
                                  alt={member.name}
                                />
                                <AvatarFallback className="bg-muted">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm">
                                  {member.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {member.role === "officer" ? (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                      President
                                    </Badge>
                                  ) : (
                                    "Member"
                                  )}
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteConfirmModalOpen}
        onOpenChange={(open) => {
          setIsDeleteConfirmModalOpen(open);
          if (!open) {
            setPostToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmModalOpen(false);
                setPostToDelete(null);
              }}
              disabled={isDeletingPost !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={isDeletingPost !== null}
            >
              {isDeletingPost ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Post Modal */}
      <Dialog
        open={isPostModalOpen}
        onOpenChange={(open) => {
          setIsPostModalOpen(open);
          if (!open) {
            setPostType(null);
            setPostFormData({
              title: "",
              description: "",
              visibility: "institution",
              date: "",
              endDate: "",
              venue: "",
              link: "",
              maxSlots: "",
              tags: [],
              image: null,
            });
            setTagInput("");
            setImagePreview(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create {postType === "event" ? "Event" : "Announcement"}
            </DialogTitle>
            <DialogDescription>
              {postType === "event"
                ? "Create an event for the club. It will be pending until approved."
                : "Create an announcement for the club. It will be pending until approved."}
            </DialogDescription>
          </DialogHeader>
          {postType && (
            <div className="space-y-4">
              {/* Privacy/Visibility */}
              <div className="grid gap-2">
                <Label>
                  Privacy <span className="text-red-600">*</span>
                </Label>
                <RadioGroup
                  value={postFormData.visibility}
                  onValueChange={(
                    value: "institution" | "public" | "restricted"
                  ) => setPostFormData({ ...postFormData, visibility: value })}
                  className="flex flex-row gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="institution"
                      id="privacy-institution"
                    />
                    <Label
                      htmlFor="privacy-institution"
                      className="font-normal cursor-pointer"
                    >
                      Institution Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="privacy-public" />
                    <Label
                      htmlFor="privacy-public"
                      className="font-normal cursor-pointer"
                    >
                      Public
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="restricted"
                      id="privacy-restricted"
                    />
                    <Label
                      htmlFor="privacy-restricted"
                      className="font-normal cursor-pointer"
                    >
                      Selected People Only
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Title */}
              <div className="grid gap-2">
                <Label htmlFor="title">
                  {postType === "event" ? "Event Name" : "Announcement Name"}{" "}
                  <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder={
                    postType === "event"
                      ? "Enter event name"
                      : "Enter announcement name"
                  }
                  value={postFormData.title}
                  onChange={(e) =>
                    setPostFormData({ ...postFormData, title: e.target.value })
                  }
                />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">
                  Description <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter description"
                  rows={4}
                  value={postFormData.description}
                  onChange={(e) =>
                    setPostFormData({
                      ...postFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              {/* Date (Event only) */}
              {postType === "event" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">
                      Start Date <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={postFormData.date}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        const endDate = postFormData.endDate
                          ? postFormData.endDate < newDate
                            ? ""
                            : postFormData.endDate
                          : "";
                        setPostFormData({
                          ...postFormData,
                          date: newDate,
                          endDate,
                        });
                      }}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">
                      End Date <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={postFormData.endDate}
                      min={
                        postFormData.date ||
                        new Date().toISOString().slice(0, 16)
                      }
                      onChange={(e) =>
                        setPostFormData({
                          ...postFormData,
                          endDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
              )}

              {/* Venue (Event only) */}
              {postType === "event" && (
                <div className="grid gap-2">
                  <Label htmlFor="venue">
                    Venue <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="venue"
                    placeholder="Enter venue"
                    value={postFormData.venue}
                    onChange={(e) =>
                      setPostFormData({
                        ...postFormData,
                        venue: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {/* Link and Max Slots (Event only) */}
              {postType === "event" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="link">Registration Link (Optional)</Label>
                    <Input
                      id="link"
                      type="url"
                      placeholder="https://forms.google.com/..."
                      value={postFormData.link}
                      onChange={(e) =>
                        setPostFormData({
                          ...postFormData,
                          link: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxSlots">Max Slots (Optional)</Label>
                    <Input
                      id="maxSlots"
                      type="number"
                      placeholder="Enter maximum number of participants"
                      value={postFormData.maxSlots}
                      onChange={(e) =>
                        setPostFormData({
                          ...postFormData,
                          maxSlots: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Tags (Event only) */}
              {postType === "event" && (
                <div className="grid gap-2">
                  <Label htmlFor="tags">
                    Tags <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
                    {postFormData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            setPostFormData({
                              ...postFormData,
                              tags: postFormData.tags.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      id="tags"
                      placeholder={
                        postFormData.tags.length === 0
                          ? "Enter tags and press Enter or comma"
                          : ""
                      }
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          (e.key === "Enter" || e.key === ",") &&
                          tagInput.trim()
                        ) {
                          e.preventDefault();
                          const newTag = tagInput.trim().replace(/,/g, "");
                          if (newTag && !postFormData.tags.includes(newTag)) {
                            setPostFormData({
                              ...postFormData,
                              tags: [...postFormData.tags, newTag],
                            });
                            setTagInput("");
                          }
                        }
                      }}
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[200px]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Press Enter or comma to add a tag. At least one tag is
                    required. Tags help with event recommendations.
                  </p>
                </div>
              )}

              {/* Image Upload */}
              <div className="grid gap-2">
                <Label htmlFor="image">Image (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 z-10"
                        onClick={() => {
                          setImagePreview(null);
                          setPostFormData({ ...postFormData, image: null });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPostModalOpen(false);
                setPostType(null);
                setPostFormData({
                  title: "",
                  description: "",
                  visibility: "institution",
                  date: "",
                  endDate: "",
                  venue: "",
                  link: "",
                  maxSlots: "",
                  tags: [],
                  image: null,
                });
                setTagInput("");
                setImagePreview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={isSubmittingPost || !postType}
            >
              {isSubmittingPost ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Post"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

