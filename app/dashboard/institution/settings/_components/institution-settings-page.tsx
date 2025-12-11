"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  GraduationCap,
  BookOpen,
  Search,
  Loader2,
  Eye,
  Trash2,
  Plus,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type {
  InstitutionSettingsStats,
  CollegeListItem,
  DepartmentListItem,
  ProgramListItem,
} from "@/lib/repos/institution";

export interface InstitutionSettingsPageProps {
  stats: InstitutionSettingsStats;
  institutionName: string;
  colleges: CollegeListItem[];
  collegesTotal: number;
  collegesPage: number;
  collegesPageSize: number;
  collegesSearch: string;
  collegesSortBy: "name";
  collegesSortOrder: "asc" | "desc";
  departments: DepartmentListItem[];
  departmentsTotal: number;
  departmentsPage: number;
  departmentsPageSize: number;
  departmentsSearch: string;
  departmentsSortBy: "name";
  departmentsSortOrder: "asc" | "desc";
  programs: ProgramListItem[];
  programsTotal: number;
  programsPage: number;
  programsPageSize: number;
  programsSearch: string;
  programsSortBy: "name";
  programsSortOrder: "asc" | "desc";
}

export function InstitutionSettingsPage({
  stats,
  institutionName,
  colleges: initialColleges,
  collegesTotal: initialCollegesTotal,
  collegesPage: initialCollegesPage,
  collegesPageSize: initialCollegesPageSize,
  collegesSearch: initialCollegesSearch,
  collegesSortBy: initialCollegesSortBy,
  collegesSortOrder: initialCollegesSortOrder,
  departments: initialDepartments,
  departmentsTotal: initialDepartmentsTotal,
  departmentsPage: initialDepartmentsPage,
  departmentsPageSize: initialDepartmentsPageSize,
  departmentsSearch: initialDepartmentsSearch,
  departmentsSortBy: initialDepartmentsSortBy,
  departmentsSortOrder: initialDepartmentsSortOrder,
  programs: initialPrograms,
  programsTotal: initialProgramsTotal,
  programsPage: initialProgramsPage,
  programsPageSize: initialProgramsPageSize,
  programsSearch: initialProgramsSearch,
  programsSortBy: initialProgramsSortBy,
  programsSortOrder: initialProgramsSortOrder,
}: InstitutionSettingsPageProps) {
  const router = useRouter();

  // Colleges state
  const [collegesSearch, setCollegesSearch] = useState(initialCollegesSearch);
  const [collegesPage, setCollegesPage] = useState(initialCollegesPage);
  const [collegesPageSize, setCollegesPageSize] = useState(
    initialCollegesPageSize
  );
  const [collegesSortBy, setCollegesSortBy] = useState(initialCollegesSortBy);
  const [collegesSortOrder, setCollegesSortOrder] = useState(
    initialCollegesSortOrder
  );

  // Departments state
  const [departmentsSearch, setDepartmentsSearch] = useState(
    initialDepartmentsSearch
  );
  const [departmentsPage, setDepartmentsPage] = useState(
    initialDepartmentsPage
  );
  const [departmentsPageSize, setDepartmentsPageSize] = useState(
    initialDepartmentsPageSize
  );
  const [departmentsSortBy, setDepartmentsSortBy] = useState(
    initialDepartmentsSortBy
  );
  const [departmentsSortOrder, setDepartmentsSortOrder] = useState(
    initialDepartmentsSortOrder
  );

  // Programs state
  const [programsSearch, setProgramsSearch] = useState(initialProgramsSearch);
  const [programsPage, setProgramsPage] = useState(initialProgramsPage);
  const [programsPageSize, setProgramsPageSize] = useState(
    initialProgramsPageSize
  );
  const [programsSortBy, setProgramsSortBy] = useState(initialProgramsSortBy);
  const [programsSortOrder, setProgramsSortOrder] = useState(
    initialProgramsSortOrder
  );

  // Modal state
  const [isAddCollegeModalOpen, setIsAddCollegeModalOpen] = useState(false);
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] =
    useState(false);
  const [isAddProgramModalOpen, setIsAddProgramModalOpen] = useState(false);
  const [isViewCollegeModalOpen, setIsViewCollegeModalOpen] = useState(false);
  const [isViewDepartmentModalOpen, setIsViewDepartmentModalOpen] =
    useState(false);
  const [isViewProgramModalOpen, setIsViewProgramModalOpen] = useState(false);
  const [viewCollege, setViewCollege] = useState<CollegeListItem | null>(null);
  const [viewDepartment, setViewDepartment] =
    useState<DepartmentListItem | null>(null);
  const [viewProgram, setViewProgram] = useState<ProgramListItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for Add College
  const [collegeForm, setCollegeForm] = useState({
    logo: null as File | null,
    name: "",
    acronym: "",
    email: "",
    phone: "",
  });
  const [collegeLogoPreview, setCollegeLogoPreview] = useState<string | null>(
    null
  );

  // Form state for Add Department
  const [departmentForm, setDepartmentForm] = useState({
    logo: null as File | null,
    name: "",
    acronym: "",
    email: "",
    phone: "",
    collegeId: "",
  });
  const [departmentLogoPreview, setDepartmentLogoPreview] = useState<
    string | null
  >(null);
  const [availableColleges, setAvailableColleges] = useState<
    Array<{ collegeId: string; name: string; acronym: string }>
  >([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState<
    Array<{
      departmentId: string;
      name: string;
      acronym: string;
      collegeId: string;
      collegeName: string;
    }>
  >([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Form state for Add Program
  const [programForm, setProgramForm] = useState({
    name: "",
    acronym: "",
    departmentId: "",
  });
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState("");
  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);

  // Table visibility state - 'colleges', 'departments', 'programs', or null for all
  const [activeTable, setActiveTable] = useState<
    "colleges" | "departments" | "programs" | null
  >(null);

  // Fetch available colleges for department form
  useEffect(() => {
    async function fetchColleges() {
      setLoadingColleges(true);
      try {
        const res = await fetch("/api/institution/colleges/list");
        const data = await res.json();
        if (res.ok && data?.colleges) {
          setAvailableColleges(data.colleges);
        } else {
          console.error("Failed to fetch colleges:", data?.error);
          setAvailableColleges([]);
        }
      } catch (e) {
        console.error("Failed to fetch colleges:", e);
        setAvailableColleges([]);
      } finally {
        setLoadingColleges(false);
      }
    }
    fetchColleges();
  }, []);

  // Fetch available departments for program form
  useEffect(() => {
    async function fetchDepartments() {
      setLoadingDepartments(true);
      try {
        const res = await fetch("/api/institution/departments/list");
        const data = await res.json();
        if (res.ok && data?.departments) {
          setAvailableDepartments(data.departments);
        } else {
          console.error("Failed to fetch departments:", data?.error);
          setAvailableDepartments([]);
        }
      } catch (e) {
        console.error("Failed to fetch departments:", e);
        setAvailableDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    }
    fetchDepartments();
  }, []);

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Update URL when filters change
  const updateCollegesFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (collegesPage > 1) params.set("collegesPage", collegesPage.toString());
      if (collegesPageSize !== 10)
        params.set("collegesPageSize", collegesPageSize.toString());
      if (collegesSearch) params.set("collegesSearch", collegesSearch);
      if (collegesSortBy !== "name")
        params.set("collegesSortBy", collegesSortBy);
      if (collegesSortOrder !== "asc")
        params.set("collegesSortOrder", collegesSortOrder);

      // Preserve departments and programs filters
      if (departmentsPage > 1)
        params.set("departmentsPage", departmentsPage.toString());
      if (departmentsPageSize !== 10)
        params.set("departmentsPageSize", departmentsPageSize.toString());
      if (departmentsSearch) params.set("departmentsSearch", departmentsSearch);
      if (departmentsSortBy !== "name")
        params.set("departmentsSortBy", departmentsSortBy);
      if (departmentsSortOrder !== "asc")
        params.set("departmentsSortOrder", departmentsSortOrder);
      if (programsPage > 1) params.set("programsPage", programsPage.toString());
      if (programsPageSize !== 10)
        params.set("programsPageSize", programsPageSize.toString());
      if (programsSearch) params.set("programsSearch", programsSearch);
      if (programsSortBy !== "name")
        params.set("programsSortBy", programsSortBy);
      if (programsSortOrder !== "asc")
        params.set("programsSortOrder", programsSortOrder);

      const url = params.toString()
        ? `/dashboard/institution/settings?${params.toString()}`
        : "/dashboard/institution/settings";
      router.push(url);
    });
  };

  const updateDepartmentsFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      // Preserve colleges and programs filters
      if (collegesPage > 1) params.set("collegesPage", collegesPage.toString());
      if (collegesPageSize !== 10)
        params.set("collegesPageSize", collegesPageSize.toString());
      if (collegesSearch) params.set("collegesSearch", collegesSearch);
      if (collegesSortBy !== "name")
        params.set("collegesSortBy", collegesSortBy);
      if (collegesSortOrder !== "asc")
        params.set("collegesSortOrder", collegesSortOrder);

      if (departmentsPage > 1)
        params.set("departmentsPage", departmentsPage.toString());
      if (departmentsPageSize !== 10)
        params.set("departmentsPageSize", departmentsPageSize.toString());
      if (departmentsSearch) params.set("departmentsSearch", departmentsSearch);
      if (departmentsSortBy !== "name")
        params.set("departmentsSortBy", departmentsSortBy);
      if (departmentsSortOrder !== "asc")
        params.set("departmentsSortOrder", departmentsSortOrder);
      if (programsPage > 1) params.set("programsPage", programsPage.toString());
      if (programsPageSize !== 10)
        params.set("programsPageSize", programsPageSize.toString());
      if (programsSearch) params.set("programsSearch", programsSearch);
      if (programsSortBy !== "name")
        params.set("programsSortBy", programsSortBy);
      if (programsSortOrder !== "asc")
        params.set("programsSortOrder", programsSortOrder);

      const url = params.toString()
        ? `/dashboard/institution/settings?${params.toString()}`
        : "/dashboard/institution/settings";
      router.push(url);
    });
  };

  const updateProgramsFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      // Preserve colleges and departments filters
      if (collegesPage > 1) params.set("collegesPage", collegesPage.toString());
      if (collegesPageSize !== 10)
        params.set("collegesPageSize", collegesPageSize.toString());
      if (collegesSearch) params.set("collegesSearch", collegesSearch);
      if (collegesSortBy !== "name")
        params.set("collegesSortBy", collegesSortBy);
      if (collegesSortOrder !== "asc")
        params.set("collegesSortOrder", collegesSortOrder);
      if (departmentsPage > 1)
        params.set("departmentsPage", departmentsPage.toString());
      if (departmentsPageSize !== 10)
        params.set("departmentsPageSize", departmentsPageSize.toString());
      if (departmentsSearch) params.set("departmentsSearch", departmentsSearch);
      if (departmentsSortBy !== "name")
        params.set("departmentsSortBy", departmentsSortBy);
      if (departmentsSortOrder !== "asc")
        params.set("departmentsSortOrder", departmentsSortOrder);

      if (programsPage > 1) params.set("programsPage", programsPage.toString());
      if (programsPageSize !== 10)
        params.set("programsPageSize", programsPageSize.toString());
      if (programsSearch) params.set("programsSearch", programsSearch);
      if (programsSortBy !== "name")
        params.set("programsSortBy", programsSortBy);
      if (programsSortOrder !== "asc")
        params.set("programsSortOrder", programsSortOrder);

      const url = params.toString()
        ? `/dashboard/institution/settings?${params.toString()}`
        : "/dashboard/institution/settings";
      router.push(url);
    });
  };

  // Handle colleges search
  const handleCollegesSearch = (value: string) => {
    setCollegesSearch(value);
    setCollegesPage(1);
    setTimeout(() => updateCollegesFilters(), 300);
  };

  // Handle departments search
  const handleDepartmentsSearch = (value: string) => {
    setDepartmentsSearch(value);
    setDepartmentsPage(1);
    setTimeout(() => updateDepartmentsFilters(), 300);
  };

  // Handle colleges page size change
  const handleCollegesPageSizeChange = (value: string) => {
    setCollegesPageSize(parseInt(value, 10));
    setCollegesPage(1);
    updateCollegesFilters();
  };

  // Handle departments page size change
  const handleDepartmentsPageSizeChange = (value: string) => {
    setDepartmentsPageSize(parseInt(value, 10));
    setDepartmentsPage(1);
    updateDepartmentsFilters();
  };

  // Handle colleges page change
  const handleCollegesPageChange = (page: number) => {
    setCollegesPage(page);
    updateCollegesFilters();
  };

  // Handle departments page change
  const handleDepartmentsPageChange = (page: number) => {
    setDepartmentsPage(page);
    updateDepartmentsFilters();
  };

  // Handle programs search
  const handleProgramsSearch = (value: string) => {
    setProgramsSearch(value);
    setProgramsPage(1);
    setTimeout(() => updateProgramsFilters(), 300);
  };

  // Handle programs page size change
  const handleProgramsPageSizeChange = (value: string) => {
    setProgramsPageSize(parseInt(value, 10));
    setProgramsPage(1);
    updateProgramsFilters();
  };

  // Handle programs page change
  const handleProgramsPageChange = (page: number) => {
    setProgramsPage(page);
    updateProgramsFilters();
  };

  // Handle colleges sort
  const handleCollegesSort = () => {
    const newOrder = collegesSortOrder === "asc" ? "desc" : "asc";
    setCollegesSortOrder(newOrder);
    setCollegesPage(1);
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("collegesPage", "1");
      if (collegesPageSize !== 10)
        params.set("collegesPageSize", collegesPageSize.toString());
      if (collegesSearch) params.set("collegesSearch", collegesSearch);
      params.set("collegesSortBy", "name");
      params.set("collegesSortOrder", newOrder);

      // Preserve departments and programs filters
      if (departmentsPage > 1)
        params.set("departmentsPage", departmentsPage.toString());
      if (departmentsPageSize !== 10)
        params.set("departmentsPageSize", departmentsPageSize.toString());
      if (departmentsSearch) params.set("departmentsSearch", departmentsSearch);
      if (departmentsSortBy !== "name")
        params.set("departmentsSortBy", departmentsSortBy);
      if (departmentsSortOrder !== "asc")
        params.set("departmentsSortOrder", departmentsSortOrder);
      if (programsPage > 1) params.set("programsPage", programsPage.toString());
      if (programsPageSize !== 10)
        params.set("programsPageSize", programsPageSize.toString());
      if (programsSearch) params.set("programsSearch", programsSearch);
      if (programsSortBy !== "name")
        params.set("programsSortBy", programsSortBy);
      if (programsSortOrder !== "asc")
        params.set("programsSortOrder", programsSortOrder);

      const url = params.toString()
        ? `/dashboard/institution/settings?${params.toString()}`
        : "/dashboard/institution/settings";
      router.replace(url, { scroll: false });
    });
  };

  // Handle departments sort
  const handleDepartmentsSort = () => {
    const newOrder = departmentsSortOrder === "asc" ? "desc" : "asc";
    setDepartmentsSortOrder(newOrder);
    setDepartmentsPage(1);
    startTransition(() => {
      const params = new URLSearchParams();
      // Preserve colleges and programs filters
      if (collegesPage > 1) params.set("collegesPage", collegesPage.toString());
      if (collegesPageSize !== 10)
        params.set("collegesPageSize", collegesPageSize.toString());
      if (collegesSearch) params.set("collegesSearch", collegesSearch);
      if (collegesSortBy !== "name")
        params.set("collegesSortBy", collegesSortBy);
      if (collegesSortOrder !== "asc")
        params.set("collegesSortOrder", collegesSortOrder);

      params.set("departmentsPage", "1");
      if (departmentsPageSize !== 10)
        params.set("departmentsPageSize", departmentsPageSize.toString());
      if (departmentsSearch) params.set("departmentsSearch", departmentsSearch);
      params.set("departmentsSortBy", "name");
      params.set("departmentsSortOrder", newOrder);
      if (programsPage > 1) params.set("programsPage", programsPage.toString());
      if (programsPageSize !== 10)
        params.set("programsPageSize", programsPageSize.toString());
      if (programsSearch) params.set("programsSearch", programsSearch);
      if (programsSortBy !== "name")
        params.set("programsSortBy", programsSortBy);
      if (programsSortOrder !== "asc")
        params.set("programsSortOrder", programsSortOrder);

      const url = params.toString()
        ? `/dashboard/institution/settings?${params.toString()}`
        : "/dashboard/institution/settings";
      router.replace(url, { scroll: false });
    });
  };

  // Handle programs sort
  const handleProgramsSort = () => {
    const newOrder = programsSortOrder === "asc" ? "desc" : "asc";
    setProgramsSortOrder(newOrder);
    setProgramsPage(1);
    startTransition(() => {
      const params = new URLSearchParams();
      // Preserve colleges and departments filters
      if (collegesPage > 1) params.set("collegesPage", collegesPage.toString());
      if (collegesPageSize !== 10)
        params.set("collegesPageSize", collegesPageSize.toString());
      if (collegesSearch) params.set("collegesSearch", collegesSearch);
      if (collegesSortBy !== "name")
        params.set("collegesSortBy", collegesSortBy);
      if (collegesSortOrder !== "asc")
        params.set("collegesSortOrder", collegesSortOrder);
      if (departmentsPage > 1)
        params.set("departmentsPage", departmentsPage.toString());
      if (departmentsPageSize !== 10)
        params.set("departmentsPageSize", departmentsPageSize.toString());
      if (departmentsSearch) params.set("departmentsSearch", departmentsSearch);
      if (departmentsSortBy !== "name")
        params.set("departmentsSortBy", departmentsSortBy);
      if (departmentsSortOrder !== "asc")
        params.set("departmentsSortOrder", departmentsSortOrder);

      params.set("programsPage", "1");
      if (programsPageSize !== 10)
        params.set("programsPageSize", programsPageSize.toString());
      if (programsSearch) params.set("programsSearch", programsSearch);
      params.set("programsSortBy", "name");
      params.set("programsSortOrder", newOrder);

      const url = params.toString()
        ? `/dashboard/institution/settings?${params.toString()}`
        : "/dashboard/institution/settings";
      router.replace(url, { scroll: false });
    });
  };

  // Handle view college
  const handleViewCollege = (college: CollegeListItem) => {
    setViewCollege(college);
    setIsViewCollegeModalOpen(true);
  };

  // Handle view department
  const handleViewDepartment = (department: DepartmentListItem) => {
    setViewDepartment(department);
    setIsViewDepartmentModalOpen(true);
  };

  // Handle view program
  const handleViewProgram = (program: ProgramListItem) => {
    setViewProgram(program);
    setIsViewProgramModalOpen(true);
  };

  // Handle delete college
  const handleDeleteCollege = async (collegeId: string) => {
    if (!confirm("Are you sure you want to delete this college?")) {
      return;
    }

    setActionLoading(collegeId);
    try {
      const res = await fetch(`/api/institution/colleges/${collegeId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to delete college");
        return;
      }

      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete college");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete department
  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm("Are you sure you want to delete this department?")) {
      return;
    }

    setActionLoading(departmentId);
    try {
      const res = await fetch(`/api/institution/departments/${departmentId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to delete department");
        return;
      }

      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete department");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete program
  const handleDeleteProgram = async (programId: string) => {
    if (!confirm("Are you sure you want to delete this program?")) {
      return;
    }

    setActionLoading(programId);
    try {
      const res = await fetch(`/api/institution/programs/${programId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to delete program");
        return;
      }

      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete program");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle add college
  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      if (collegeForm.logo) {
        formData.append("logo", collegeForm.logo);
      }
      formData.append("name", collegeForm.name);
      formData.append("acronym", collegeForm.acronym);
      formData.append("email", collegeForm.email);
      formData.append("phone", collegeForm.phone);

      const res = await fetch("/api/institution/colleges", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to create college");
        return;
      }

      // Reset form
      setCollegeForm({
        logo: null,
        name: "",
        acronym: "",
        email: "",
        phone: "",
      });
      setCollegeLogoPreview(null);
      setIsAddCollegeModalOpen(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create college");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle add department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      if (departmentForm.logo) {
        formData.append("logo", departmentForm.logo);
      }
      formData.append("name", departmentForm.name);
      formData.append("acronym", departmentForm.acronym);
      formData.append("email", departmentForm.email);
      formData.append("phone", departmentForm.phone);
      formData.append("collegeId", departmentForm.collegeId);

      const res = await fetch("/api/institution/departments", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to create department");
        return;
      }

      // Reset form
      setDepartmentForm({
        logo: null,
        name: "",
        acronym: "",
        email: "",
        phone: "",
        collegeId: "",
      });
      setDepartmentLogoPreview(null);
      setIsAddDepartmentModalOpen(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create department");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle add program
  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/institution/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: programForm.name,
          acronym: programForm.acronym,
          departmentId: programForm.departmentId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to create program");
        return;
      }

      // Reset form
      setProgramForm({
        name: "",
        acronym: "",
        departmentId: "",
      });
      setDepartmentSearchQuery("");
      setIsAddProgramModalOpen(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create program");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle college logo change
  const handleCollegeLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCollegeForm({ ...collegeForm, logo: file });
      setCollegeLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handle department logo change
  const handleDepartmentLogoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setDepartmentForm({ ...departmentForm, logo: file });
      setDepartmentLogoPreview(URL.createObjectURL(file));
    }
  };

  const collegesTotalPages = Math.ceil(initialCollegesTotal / collegesPageSize);
  const departmentsTotalPages = Math.ceil(
    initialDepartmentsTotal / departmentsPageSize
  );
  const programsTotalPages = Math.ceil(initialProgramsTotal / programsPageSize);

  // Get selected department's college name
  const selectedDepartment = availableDepartments.find(
    (d) => d.departmentId === programForm.departmentId
  );
  const selectedCollegeName = selectedDepartment?.collegeName || "";

  // Filter departments based on search query
  const filteredDepartments = useMemo(() => {
    if (!departmentSearchQuery.trim()) {
      return availableDepartments;
    }
    const query = departmentSearchQuery.toLowerCase();
    return availableDepartments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(query) ||
        dept.acronym.toLowerCase().includes(query) ||
        dept.collegeName.toLowerCase().includes(query)
    );
  }, [availableDepartments, departmentSearchQuery]);

  return (
    <div className="space-y-6 p-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Institution Settings
        </h1>
        <p className="text-muted-foreground">
          Manage colleges, departments, and programs within your institution
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card
          className={`cursor-pointer transition-colors hover:bg-accent ${
            activeTable === "colleges" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() =>
            setActiveTable(activeTable === "colleges" ? null : "colleges")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Colleges
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalColleges}</div>
            <p className="text-xs text-muted-foreground">
              Colleges in institution
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors hover:bg-accent ${
            activeTable === "departments" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() =>
            setActiveTable(activeTable === "departments" ? null : "departments")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Departments
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              Departments in institution
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors hover:bg-accent ${
            activeTable === "programs" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() =>
            setActiveTable(activeTable === "programs" ? null : "programs")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Programs
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              Programs offered by institution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Colleges Table */}
      {(activeTable === null || activeTable === "colleges") && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle>Colleges</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsAddCollegeModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add College
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, acronym, email..."
                    value={collegesSearch}
                    onChange={(e) => handleCollegesSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Rows per page:
                  </span>
                  <Select
                    value={collegesPageSize.toString()}
                    onValueChange={handleCollegesPageSizeChange}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto w-full -mx-6 px-6">
                  <div className="min-w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Logo</TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={handleCollegesSort}
                            >
                              College Name
                            {collegesSortBy === "name" ? (
                              collegesSortOrder === "asc" ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ArrowDown className="ml-2 h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Acronym</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {initialColleges.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p className="text-muted-foreground">
                              No colleges found
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        initialColleges.map((college) => (
                          <TableRow key={college.collegeId}>
                            <TableCell>
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={college.logo}
                                  alt={college.name}
                                />
                                <AvatarFallback>
                                  {college.acronym
                                    ? college.acronym.toUpperCase().slice(0, 2)
                                    : getInitials(college.name)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">
                              {college.name}
                            </TableCell>
                            <TableCell>{college.acronym}</TableCell>
                            <TableCell>{college.email}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewCollege(college)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleDeleteCollege(college.collegeId)
                                  }
                                  disabled={actionLoading === college.collegeId}
                                >
                                  {actionLoading === college.collegeId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </div>
                {collegesTotalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (collegesPage > 1) {
                                handleCollegesPageChange(collegesPage - 1);
                              }
                            }}
                            className={
                              collegesPage === 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: collegesTotalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleCollegesPageChange(page);
                              }}
                              isActive={collegesPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (collegesPage < collegesTotalPages) {
                                handleCollegesPageChange(collegesPage + 1);
                              }
                            }}
                            className={
                              collegesPage === collegesTotalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Departments Table */}
      {(activeTable === null || activeTable === "departments") && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle>Departments</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsAddDepartmentModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, acronym, email..."
                    value={departmentsSearch}
                    onChange={(e) => handleDepartmentsSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Rows per page:
                  </span>
                  <Select
                    value={departmentsPageSize.toString()}
                    onValueChange={handleDepartmentsPageSizeChange}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto w-full -mx-6 px-6">
                  <div className="min-w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Logo</TableHead>
                          <TableHead>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={handleDepartmentsSort}
                            >
                              Department Name
                            {departmentsSortBy === "name" ? (
                              departmentsSortOrder === "asc" ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ArrowDown className="ml-2 h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {initialDepartments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p className="text-muted-foreground">
                              No departments found
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        initialDepartments.map((department) => (
                          <TableRow key={department.departmentId}>
                            <TableCell>
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={department.logo}
                                  alt={department.name}
                                />
                                <AvatarFallback>
                                  {department.acronym
                                    ? department.acronym
                                        .toUpperCase()
                                        .slice(0, 2)
                                    : getInitials(department.name)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">
                              {department.name}
                            </TableCell>
                            <TableCell>
                              {department.collegeName || "-"}
                            </TableCell>
                            <TableCell>{department.email}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleViewDepartment(department)
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleDeleteDepartment(
                                      department.departmentId
                                    )
                                  }
                                  disabled={
                                    actionLoading === department.departmentId
                                  }
                                >
                                  {actionLoading === department.departmentId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </div>
                {departmentsTotalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (departmentsPage > 1) {
                                handleDepartmentsPageChange(
                                  departmentsPage - 1
                                );
                              }
                            }}
                            className={
                              departmentsPage === 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: departmentsTotalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDepartmentsPageChange(page);
                              }}
                              isActive={departmentsPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (departmentsPage < departmentsTotalPages) {
                                handleDepartmentsPageChange(
                                  departmentsPage + 1
                                );
                              }
                            }}
                            className={
                              departmentsPage === departmentsTotalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Programs Table */}
      {(activeTable === null || activeTable === "programs") && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle>Program Offerings</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsAddProgramModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Program
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by program name, acronym..."
                    value={programsSearch}
                    onChange={(e) => handleProgramsSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Rows per page:
                  </span>
                  <Select
                    value={programsPageSize.toString()}
                    onValueChange={handleProgramsPageSizeChange}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={handleProgramsSort}
                        >
                          Program Name
                            {programsSortBy === "name" ? (
                              programsSortOrder === "asc" ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                              ) : (
                                <ArrowDown className="ml-2 h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Program Acronym</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {initialPrograms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p className="text-muted-foreground">
                              No programs found
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        initialPrograms.map((program) => (
                          <TableRow key={program.programId}>
                            <TableCell className="font-medium">
                              {program.name}
                            </TableCell>
                            <TableCell>{program.acronym}</TableCell>
                            <TableCell>{program.collegeName || "-"}</TableCell>
                            <TableCell>
                              {program.departmentName || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewProgram(program)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // TODO: Implement edit functionality
                                    alert("Edit functionality coming soon");
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleDeleteProgram(program.programId)
                                  }
                                  disabled={actionLoading === program.programId}
                                >
                                  {actionLoading === program.programId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      </TableBody>
                    </Table>
                {programsTotalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (programsPage > 1) {
                                handleProgramsPageChange(programsPage - 1);
                              }
                            }}
                            className={
                              programsPage === 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: programsTotalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleProgramsPageChange(page);
                              }}
                              isActive={programsPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (programsPage < programsTotalPages) {
                                handleProgramsPageChange(programsPage + 1);
                              }
                            }}
                            className={
                              programsPage === programsTotalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add College Modal */}
      <Dialog
        open={isAddCollegeModalOpen}
        onOpenChange={setIsAddCollegeModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add College</DialogTitle>
            <DialogDescription>
              Create a new college for your institution
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCollege}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="college-logo">
                  Logo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="college-logo"
                  type="file"
                  accept="image/*"
                  onChange={handleCollegeLogoChange}
                  required
                />
                {collegeLogoPreview && (
                  <div className="mt-2">
                    <img
                      src={collegeLogoPreview}
                      alt="Logo preview"
                      className="h-20 w-20 rounded object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="college-institution">Institution</Label>
                <Input
                  id="college-institution"
                  value={institutionName}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="college-name">
                  College Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="college-name"
                  value={collegeForm.name}
                  onChange={(e) =>
                    setCollegeForm({ ...collegeForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="college-acronym">
                  College Acronym <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="college-acronym"
                  value={collegeForm.acronym}
                  onChange={(e) =>
                    setCollegeForm({ ...collegeForm, acronym: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="college-email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="college-email"
                    type="email"
                    value={collegeForm.email}
                    onChange={(e) =>
                      setCollegeForm({ ...collegeForm, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college-phone">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="college-phone"
                    type="tel"
                    value={collegeForm.phone}
                    onChange={(e) =>
                      setCollegeForm({ ...collegeForm, phone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCollegeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create College"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Department Modal */}
      <Dialog
        open={isAddDepartmentModalOpen}
        onOpenChange={setIsAddDepartmentModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Create a new department for your institution
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDepartment}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="department-logo">
                  Logo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="department-logo"
                  type="file"
                  accept="image/*"
                  onChange={handleDepartmentLogoChange}
                  required
                />
                {departmentLogoPreview && (
                  <div className="mt-2">
                    <img
                      src={departmentLogoPreview}
                      alt="Logo preview"
                      className="h-20 w-20 rounded object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-name">
                  Department Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="department-name"
                  value={departmentForm.name}
                  onChange={(e) =>
                    setDepartmentForm({
                      ...departmentForm,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-acronym">
                  Department Acronym <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="department-acronym"
                  value={departmentForm.acronym}
                  onChange={(e) =>
                    setDepartmentForm({
                      ...departmentForm,
                      acronym: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-college">
                  College <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={departmentForm.collegeId}
                  onValueChange={(value) =>
                    setDepartmentForm({ ...departmentForm, collegeId: value })
                  }
                  disabled={loadingColleges || availableColleges.length === 0}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue 
                      placeholder={
                        loadingColleges 
                          ? "Loading colleges..." 
                          : availableColleges.length === 0 
                          ? "No colleges available" 
                          : "Select a college"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColleges.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {loadingColleges ? "Loading colleges..." : "No colleges available"}
                      </div>
                    ) : (
                      availableColleges.map((college) => (
                        <SelectItem
                          key={college.collegeId}
                          value={college.collegeId}
                        >
                          {college.name} ({college.acronym})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!loadingColleges && availableColleges.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No colleges are available for this institution. Please add colleges first.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department-email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="department-email"
                    type="email"
                    value={departmentForm.email}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department-phone">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="department-phone"
                    type="tel"
                    value={departmentForm.phone}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        phone: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDepartmentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Department"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View College Modal */}
      <Dialog
        open={isViewCollegeModalOpen}
        onOpenChange={setIsViewCollegeModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>College Details</DialogTitle>
          </DialogHeader>
          {viewCollege && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={viewCollege.logo} alt={viewCollege.name} />
                  <AvatarFallback>
                    {viewCollege.acronym
                      ? viewCollege.acronym.toUpperCase().slice(0, 2)
                      : getInitials(viewCollege.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{viewCollege.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {viewCollege.acronym}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewCollege.email}
                  </p>
                </div>
                {viewCollege.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">
                      {viewCollege.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewCollegeModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Department Modal */}
      <Dialog
        open={isViewDepartmentModalOpen}
        onOpenChange={setIsViewDepartmentModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Department Details</DialogTitle>
          </DialogHeader>
          {viewDepartment && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={viewDepartment.logo}
                    alt={viewDepartment.name}
                  />
                  <AvatarFallback>
                    {viewDepartment.acronym
                      ? viewDepartment.acronym.toUpperCase().slice(0, 2)
                      : getInitials(viewDepartment.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {viewDepartment.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {viewDepartment.acronym}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">College</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewDepartment.collegeName || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewDepartment.email}
                  </p>
                </div>
                {viewDepartment.phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">
                      {viewDepartment.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDepartmentModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Program Modal */}
      <Dialog
        open={isAddProgramModalOpen}
        onOpenChange={(open) => {
          setIsAddProgramModalOpen(open);
          if (!open) {
            // Reset form when modal closes
            setProgramForm({
              name: "",
              acronym: "",
              departmentId: "",
            });
            setDepartmentSearchQuery("");
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Program</DialogTitle>
            <DialogDescription>
              Create a new program for your institution
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProgram}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="program-name">
                  Program Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="program-name"
                  value={programForm.name}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-acronym">
                  Program Acronym <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="program-acronym"
                  value={programForm.acronym}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, acronym: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-department">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Popover
                  open={departmentPopoverOpen}
                  onOpenChange={setDepartmentPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={departmentPopoverOpen}
                      className="w-full justify-between"
                      disabled={loadingDepartments || availableDepartments.length === 0}
                    >
                      {loadingDepartments
                        ? "Loading departments..."
                        : programForm.departmentId
                        ? filteredDepartments.find(
                            (dept) =>
                              dept.departmentId === programForm.departmentId
                          )?.name
                          ? `${
                              filteredDepartments.find(
                                (dept) =>
                                  dept.departmentId === programForm.departmentId
                              )?.name
                            } (${
                              filteredDepartments.find(
                                (dept) =>
                                  dept.departmentId === programForm.departmentId
                              )?.acronym
                            })`
                          : "Select a department"
                        : availableDepartments.length === 0
                        ? "No departments available"
                        : "Select a department"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search departments..."
                        value={departmentSearchQuery}
                        onValueChange={setDepartmentSearchQuery}
                      />
                      <CommandList>
                        {loadingDepartments ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Loading departments...
                          </div>
                        ) : filteredDepartments.length === 0 ? (
                          <CommandEmpty>
                            {availableDepartments.length === 0
                              ? "No departments available for this institution"
                              : "No departments found."}
                          </CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {filteredDepartments.map((dept) => (
                              <CommandItem
                                key={dept.departmentId}
                                value={`${dept.name} ${dept.acronym}`}
                                onSelect={() => {
                                  setProgramForm({
                                    ...programForm,
                                    departmentId: dept.departmentId,
                                  });
                                  setDepartmentSearchQuery("");
                                  setDepartmentPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={
                                    programForm.departmentId === dept.departmentId
                                      ? "mr-2 h-4 w-4 opacity-100"
                                      : "mr-2 h-4 w-4 opacity-0"
                                  }
                                />
                                {dept.name} ({dept.acronym})
                                {dept.collegeName && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    - {dept.collegeName}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {!loadingDepartments && availableDepartments.length === 0 && (
                  <p className="text-xs text-amber-600">
                    No departments are available for this institution. Please add departments first.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-college">College</Label>
                <Input
                  id="program-college"
                  value={selectedCollegeName || "Select a department to see college"}
                  disabled
                  className={selectedCollegeName ? "" : "text-muted-foreground"}
                />
                {!selectedCollegeName && programForm.departmentId && (
                  <p className="text-xs text-amber-600">
                    Selected department does not have an associated college.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddProgramModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Program"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Program Modal */}
      <Dialog
        open={isViewProgramModalOpen}
        onOpenChange={setIsViewProgramModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Program Details</DialogTitle>
          </DialogHeader>
          {viewProgram && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{viewProgram.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {viewProgram.acronym}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">College</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewProgram.collegeName || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewProgram.departmentName || "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewProgramModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
