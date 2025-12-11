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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  Eye,
  EyeOff,
  Calendar,
  Megaphone,
  Loader2,
  Search,
  ClipboardCheck,
  Plus,
  X,
  MapPin,
  Link as LinkIcon,
  Users as UsersIcon,
  Tag,
  ChevronDown,
  Pencil,
  Rss,
  Trash2,
  Settings,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClubDetails, ClubMember, ClubPost } from "@/lib/repos/employee";

interface AdvisorClubDashboardProps {
  clubDetails: ClubDetails;
  initialMembers: ClubMember[];
  initialPosts: ClubPost[];
  currentUserId: string;
}

export function AdvisorClubDashboard({
  clubDetails,
  initialMembers,
  initialPosts,
  currentUserId,
}: AdvisorClubDashboardProps) {
  const router = useRouter();
  const clubId = clubDetails.clubId;
  const [members, setMembers] = useState(initialMembers);
  const [posts, setPosts] = useState(initialPosts);
  const [memberSearch, setMemberSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<ClubMember | null>(null);
  const [isViewMemberModalOpen, setIsViewMemberModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postType, setPostType] = useState<"announcement" | "event" | null>(
    null
  );
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
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [fetchStudentsError, setFetchStudentsError] = useState<string | null>(null);

  // Filter states
  const [dateFilter, setDateFilter] = useState<string>("all"); // "all", "today", "week", "month"
  const [postTypeFilter, setPostTypeFilter] = useState<string>("all"); // "all", "announcement", "event"

  // Post History filter states
  const [historyTitleFilter, setHistoryTitleFilter] = useState<string>("");
  const [historyDateFilter, setHistoryDateFilter] = useState<string>("all"); // "all", "today", "week", "month"
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>("all"); // "all", "announcement", "event"
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all"); // "all", "published", "hidden", "approved"

  // Post form states
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ClubPost | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [selectedPendingPost, setSelectedPendingPost] =
    useState<ClubPost | null>(null);
  const [isViewPendingPostModalOpen, setIsViewPendingPostModalOpen] =
    useState(false);
  const [showFeed, setShowFeed] = useState(true);
  const [isDeletingPost, setIsDeletingPost] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<ClubPost | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [isClubSettingsModalOpen, setIsClubSettingsModalOpen] = useState(false);
  const [clubName, setClubName] = useState(clubDetails.clubName);
  const [clubAcronym, setClubAcronym] = useState(clubDetails.acronym || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    clubDetails.logo || null
  );
  const [isUpdatingClub, setIsUpdatingClub] = useState(false);

  // Filter members by search
  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Get pending posts count
  const pendingCount = posts.filter((post) => post.status === "pending").length;

  // Check if user is advisor or president
  const isAdvisor = currentUserId === clubDetails.advisorId;
  const isPresident = members.some(
    (m) => m.userId === currentUserId && m.role === "officer"
  );
  const isAdvisorOrPresident = isAdvisor || isPresident;

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/employee/clubs/${clubId}/posts`);
      const data = await res.json();
      if (data?.ok && data?.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  // Fetch students for add member modal
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const params = new URLSearchParams();
      if (studentSearch) params.append("search", studentSearch);
      if (selectedCollege) params.append("collegeId", selectedCollege);
      if (selectedDepartment) params.append("departmentId", selectedDepartment);
      if (selectedProgram) params.append("programId", selectedProgram);

      const res = await fetch(
        `/api/employee/clubs/${clubId}/students?${params.toString()}`
      );
      const data = await res.json();
      if (data?.ok) {
        setStudents(data.students || []);
        if (data.filters) {
          setFilterOptions(data.filters);
        }
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Handle add member
  const handleAddMember = async (userId: string) => {
    setIsAddingMember(userId);
    setAddMemberError(null);
    try {
      const res = await fetch(`/api/employee/clubs/${clubId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setAddMemberError(data?.error || "Failed to add member");
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
      setAddMemberError(e instanceof Error ? e.message : "Failed to add member");
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
    if (isAddMemberModalOpen && clubId) {
      const loadStudents = async () => {
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
            `/api/employee/clubs/${clubId}/students?${params.toString()}`
          );
          const data = await res.json();
          if (data?.ok) {
            setStudents(data.students || []);
            if (data.filters) {
              setFilterOptions(data.filters);
            }
            setFetchStudentsError(null); // Clear error on success
          } else {
            console.error("Failed to fetch students:", data?.error);
            setFetchStudentsError(data?.error || "Failed to fetch students");
          }
        } catch (error) {
          console.error("Failed to fetch students:", error);
          setFetchStudentsError("Failed to fetch students. Please try again.");
        } finally {
          setIsLoadingStudents(false);
        }
      };
      loadStudents();
    }
  }, [
    isAddMemberModalOpen,
    studentSearch,
    selectedCollege,
    selectedDepartment,
    selectedProgram,
    clubId,
  ]);

  // Filter posts based on date and type
  const filteredPosts = posts.filter((post) => {
    // Show all posts to advisor/president, but hide "hidden" posts from others
    if (!isAdvisorOrPresident && post.status === "hidden") {
      return false;
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

  // Filter Post History posts
  const filteredHistoryPosts = posts.filter((post) => {
    // Exclude pending posts
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
        `/api/employee/clubs/${clubId}/members/${selectedMember.userId}/remove`,
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
        `/api/employee/clubs/${clubId}/members/${selectedMember.userId}/reassign`,
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

  // Handle edit post
  const handleEditPost = (post: ClubPost) => {
    setSelectedPost(post);
    setPostType(post.type);

    // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateForInput = (dateString?: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setPostFormData({
      title: post.title,
      description: post.content || "",
      visibility: post.visibility || "institution",
      date: post.type === "event" ? formatDateForInput(post.startAt) : "",
      endDate: post.type === "event" ? formatDateForInput(post.endAt) : "",
      venue: post.type === "event" ? post.venue || "" : "",
      link: post.type === "event" ? post.link || "" : "",
      maxSlots: post.type === "event" ? String(post.maxSlots || "") : "",
      tags: post.type === "event" ? post.tags || [] : [],
      image: null,
    });
    setTagInput("");
    setImagePreview(post.imageUrl || null);
    setRemoveImage(false);
    setIsEditModalOpen(true);
  };

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

      const res = await fetch(`/api/employee/clubs/${clubId}`, {
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
        `/api/employee/clubs/${clubId}/posts/${postToDelete.id}`,
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

  // Handle toggle hide/show post
  const handleTogglePostStatus = async (post: ClubPost) => {
    setIsUpdatingStatus(post.id);
    try {
      const newStatus = post.status === "hidden" ? "published" : "hidden";
      const res = await fetch(
        `/api/employee/clubs/${clubId}/posts/${post.id}/status`,
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

  // Handle update post
  const handleUpdatePost = async () => {
    if (!selectedPost || !postType) return;

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
        alert("Please enter a start date");
        return;
      }
      if (!postFormData.venue) {
        alert("Please enter a venue");
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
      if (postFormData.image) {
        formData.append("image", postFormData.image);
      } else if (removeImage && selectedPost.imageUrl) {
        formData.append("removeImage", "true");
      }

      if (postType === "event") {
        formData.append("date", postFormData.date);
        formData.append("endDate", postFormData.endDate);
        formData.append("venue", postFormData.venue);
        formData.append("link", postFormData.link);
        formData.append("maxSlots", postFormData.maxSlots);
        formData.append("tags", postFormData.tags.join(","));
      }

      const res = await fetch(
        `/api/employee/clubs/${clubId}/posts/${selectedPost.id}`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to update post");
        return;
      }

      // Reset form
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
      setRemoveImage(false);
      setPostType(null);
      setSelectedPost(null);
      setIsEditModalOpen(false);

      // Fetch updated posts
      await fetchPosts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update post");
    } finally {
      setIsSubmittingPost(false);
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
      setRemoveImage(false); // Reset remove flag when new image is selected
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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

      const res = await fetch(`/api/employee/clubs/${clubId}/posts`, {
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
                variant={showFeed ? "default" : "outline"}
                size="sm"
                className="h-9 px-3 lg:px-4 text-xs lg:text-sm font-medium"
                onClick={() => setShowFeed(true)}
              >
                <Rss className="h-3.5 w-3.5 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Feed</span>
              </Button>
              <Button
                variant={!showFeed ? "default" : "outline"}
                size="sm"
                className="h-9 px-3 lg:px-4 text-xs lg:text-sm font-medium relative"
                onClick={() => setShowFeed(false)}
              >
                <ClipboardCheck className="h-3.5 w-3.5 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Approvals</span>
                {pendingCount > 0 && (
                  <Badge className="ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center" variant="destructive">
                    {pendingCount}
                  </Badge>
                )}
              </Button>
              {isAdvisorOrPresident && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 lg:px-4 text-xs lg:text-sm font-medium"
                  onClick={() => setIsClubSettingsModalOpen(true)}
                >
                  <Settings className="h-3.5 w-3.5 lg:h-4 lg:w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Settings</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 py-6 flex flex-col">
          {showFeed ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
              {/* Left Column - Feed (2/3) */}
              <div className="lg:col-span-2 flex flex-col min-h-0">
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

                        {/* Post Button */}
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
                      </div>
                    </div>
                  </CardHeader>
                  <div className="flex-1 overflow-y-auto min-h-0">
                  <CardContent className="space-y-3">
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
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant={
                                    post.status === "published" ||
                                    post.status === "approved"
                                      ? "default"
                                      : post.status === "pending"
                                      ? "secondary"
                                      : post.status === "hidden"
                                      ? "outline"
                                      : "outline"
                                  }
                                  className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0"
                                >
                                  {post.status}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {(isAdvisorOrPresident ||
                                    post.authorId === currentUserId) && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleEditPost(post)}
                                      title="Edit post"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {isAdvisorOrPresident && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() =>
                                        handleTogglePostStatus(post)
                                      }
                                      disabled={isUpdatingStatus === post.id}
                                      title={
                                        post.status === "hidden"
                                          ? "Show post"
                                          : "Hide post"
                                      }
                                    >
                                      {isUpdatingStatus === post.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : post.status === "hidden" ? (
                                        <Eye className="h-3 w-3" />
                                      ) : (
                                        <EyeOff className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
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
                                          {formatDate(post.startAt)}
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
                                          {formatDate(post.endAt)}
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
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <CardTitle className="text-lg">Members</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
                          </p>
                        </div>
                        {canAddMembers && (
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => {
                              // You can add view adviser functionality here
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
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
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={() => handleViewMember(member)}
                              >
                                <Eye className="h-3.5 w-3.5" />
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
          ) : (
            <div className="h-full overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  {posts.filter((p) => p.status === "pending").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending approvals
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts
                          .filter((p) => p.status === "pending")
                          .map((post) => (
                            <TableRow key={post.id}>
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
                              <TableCell className="font-medium">
                                {post.title}
                              </TableCell>
                              <TableCell>{post.authorName}</TableCell>
                              <TableCell>
                                {formatDate(post.createdAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPendingPost(post);
                                    setIsViewPendingPostModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-2" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Post History */}
              <Card className="mt-6">
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
                          <TableHead className="text-right">Actions</TableHead>
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
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedPendingPost(post);
                                      setIsViewPendingPostModalOpen(true);
                                    }}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditPost(post)}
                                  >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Update
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
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
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
                      selectedMember.role === "officer"
                        ? "default"
                        : "secondary"
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

      {/* Post Modal */}
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
                        // Clear end date if it's before the new start date
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
              disabled={isSubmittingPost}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={isSubmittingPost || !postType}
            >
              {isSubmittingPost ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setSelectedPost(null);
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
              Edit {postType === "event" ? "Event" : "Announcement"}
            </DialogTitle>
            <DialogDescription>
              {isAdvisor
                ? "Edit the post. Changes will be automatically approved."
                : "Edit the post. Changes will require approval from the advisor."}
            </DialogDescription>
          </DialogHeader>
          {postType && selectedPost && (
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
                      id="edit-privacy-institution"
                    />
                    <Label
                      htmlFor="edit-privacy-institution"
                      className="font-normal cursor-pointer"
                    >
                      Institution Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="edit-privacy-public" />
                    <Label
                      htmlFor="edit-privacy-public"
                      className="font-normal cursor-pointer"
                    >
                      Public
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="restricted"
                      id="edit-privacy-restricted"
                    />
                    <Label
                      htmlFor="edit-privacy-restricted"
                      className="font-normal cursor-pointer"
                    >
                      Selected People Only
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Title */}
              <div className="grid gap-2">
                <Label htmlFor="edit-title">
                  {postType === "event" ? "Event Name" : "Announcement Name"}{" "}
                  <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="edit-title"
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
                <Label htmlFor="edit-description">
                  Description <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="edit-description"
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
                    <Label htmlFor="edit-date">
                      Start Date <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="edit-date"
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
                    <Label htmlFor="edit-endDate">
                      End Date <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="edit-endDate"
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
                  <Label htmlFor="edit-venue">
                    Venue <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="edit-venue"
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
                    <Label htmlFor="edit-link">
                      Registration Link (Optional)
                    </Label>
                    <Input
                      id="edit-link"
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
                    <Label htmlFor="edit-maxSlots">Max Slots (Optional)</Label>
                    <Input
                      id="edit-maxSlots"
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
                  <Label htmlFor="edit-tags">
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
                      id="edit-tags"
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
                <Label htmlFor="edit-image">Image (Optional)</Label>
                <div className="flex items-center gap-4 flex-wrap">
                  <Input
                    id="edit-image"
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
                          if (selectedPost?.imageUrl) {
                            setRemoveImage(true);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {selectedPost.imageUrl &&
                    !imagePreview &&
                    !postFormData.image &&
                    !removeImage && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <Image
                          src={selectedPost.imageUrl}
                          alt="Current"
                          fill
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 z-10"
                          onClick={() => {
                            setRemoveImage(true);
                          }}
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                </div>
                {selectedPost.imageUrl &&
                  !imagePreview &&
                  !postFormData.image &&
                  !removeImage && (
                    <p className="text-xs text-muted-foreground">
                      Click the X button on the image to remove it, or upload a
                      new image to replace it.
                    </p>
                  )}
                {removeImage && (
                  <p className="text-xs text-amber-600">
                    Image will be removed when you update the post.
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedPost(null);
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
              disabled={isSubmittingPost}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePost}
              disabled={isSubmittingPost || !postType || !selectedPost}
            >
              {isSubmittingPost ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Pending Post Modal */}
      <Dialog
        open={isViewPendingPostModalOpen}
        onOpenChange={(open) => {
          setIsViewPendingPostModalOpen(open);
          if (!open) {
            setSelectedPendingPost(null);
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
            setRemoveImage(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Pending Post</DialogTitle>
            <DialogDescription>
              Review, edit, and approve or reject this post
            </DialogDescription>
          </DialogHeader>
          {selectedPendingPost && (
            <div className="space-y-4">
              {/* Post Preview */}
              <Card>
                {selectedPendingPost.imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={selectedPendingPost.imageUrl}
                      alt={selectedPendingPost.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedPendingPost.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {selectedPendingPost.authorName} •{" "}
                        {formatDate(selectedPendingPost.createdAt)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {selectedPendingPost.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedPendingPost.content}
                  </p>
                  {selectedPendingPost.type === "event" && (
                    <div className="mt-4 space-y-2 pt-4 border-t">
                      {selectedPendingPost.startAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Start:</span>
                          <span>
                            {new Date(
                              selectedPendingPost.startAt
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedPendingPost.endAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">End:</span>
                          <span>
                            {new Date(
                              selectedPendingPost.endAt
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedPendingPost.venue && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Venue:</span>
                          <span>{selectedPendingPost.venue}</span>
                        </div>
                      )}
                      {selectedPendingPost.link && (
                        <div className="flex items-center gap-2 text-sm">
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={selectedPendingPost.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Registration Link
                          </a>
                        </div>
                      )}
                      {selectedPendingPost.maxSlots && (
                        <div className="flex items-center gap-2 text-sm">
                          <UsersIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Max Slots:</span>
                          <span>{selectedPendingPost.maxSlots}</span>
                        </div>
                      )}
                      {selectedPendingPost.tags &&
                        selectedPendingPost.tags.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {selectedPendingPost.tags.map((tag, idx) => (
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

              {/* Edit Button */}
              <Button
                variant="outline"
                onClick={() => {
                  handleEditPost(selectedPendingPost);
                  setIsViewPendingPostModalOpen(false);
                }}
                className="w-full"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Post
              </Button>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsViewPendingPostModalOpen(false);
                setSelectedPendingPost(null);
              }}
            >
              Cancel
            </Button>
            {selectedPendingPost && (
              <>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (
                      !confirm("Are you sure you want to reject this post?")
                    ) {
                      return;
                    }

                    setActionLoading(selectedPendingPost.id);
                    try {
                      const res = await fetch(
                        `/api/employee/clubs/${clubId}/posts/${selectedPendingPost.id}/approve`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            type: selectedPendingPost.type,
                            action: "reject",
                          }),
                        }
                      );

                      const data = await res.json();

                      if (!res.ok || !data?.ok) {
                        alert(data?.error || "Failed to reject post");
                        return;
                      }

                      // Fetch updated posts
                      await fetchPosts();
                      setIsViewPendingPostModalOpen(false);
                      setSelectedPendingPost(null);
                      if (!showFeed) {
                        setShowFeed(true);
                      }
                    } catch (e) {
                      alert(
                        e instanceof Error ? e.message : "Failed to reject post"
                      );
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                  disabled={actionLoading === selectedPendingPost.id}
                >
                  {actionLoading === selectedPendingPost.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Reject
                </Button>
                <Button
                  onClick={async () => {
                    setActionLoading(selectedPendingPost.id);
                    try {
                      const res = await fetch(
                        `/api/employee/clubs/${clubId}/posts/${selectedPendingPost.id}/approve`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            type: selectedPendingPost.type,
                            action: "approve",
                          }),
                        }
                      );

                      const data = await res.json();

                      if (!res.ok || !data?.ok) {
                        alert(data?.error || "Failed to approve post");
                        return;
                      }

                      // Fetch updated posts
                      await fetchPosts();
                      setIsViewPendingPostModalOpen(false);
                      setSelectedPendingPost(null);
                      if (!showFeed) {
                        setShowFeed(true);
                      }
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
                  disabled={actionLoading === selectedPendingPost.id}
                >
                  {actionLoading === selectedPendingPost.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
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
            setAddMemberError(null);
            setFetchStudentsError(null);
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
            {/* Error Messages */}
            {addMemberError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {addMemberError}
              </div>
            )}
            {fetchStudentsError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {fetchStudentsError}
              </div>
            )}
            
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
                  No students found
                </div>
              ) : (
                students.map((student) => (
                  <Card key={student.userId} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={student.avatarUrl}
                            alt={student.name}
                          />
                          <AvatarFallback>
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {student.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {student.collegeAcronym && (
                              <Badge variant="outline" className="text-xs">
                                {student.collegeAcronym}
                              </Badge>
                            )}
                            {student.departmentAcronym && (
                              <Badge variant="outline" className="text-xs">
                                {student.departmentAcronym}
                              </Badge>
                            )}
                            {student.programAcronym && (
                              <Badge variant="outline" className="text-xs">
                                {student.programAcronym}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(student.userId)}
                        disabled={isAddingMember === student.userId}
                      >
                        {isAddingMember === student.userId ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Member
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddMemberModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Club Settings Modal */}
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
              Update club information. Only advisers and presidents can modify
              these settings.
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
                onChange={(e) => setClubAcronym(e.target.value.toUpperCase())}
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
                "Save Changes"
              )}
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
    </div>
  );
}
