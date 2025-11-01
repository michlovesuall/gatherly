"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Users, GraduationCap, Building2 } from "lucide-react";
import type { InstitutionDashboardStats } from "@/lib/repos/institution";

export interface InstitutionDashboardProps {
  stats: InstitutionDashboardStats;
}

export function InstitutionDashboard({ stats }: InstitutionDashboardProps) {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Platform-wide statistics and overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Institutions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Institutions
            </CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInstitutions}</div>
            <p className="text-xs text-muted-foreground">
              Institutions with approved status
            </p>
          </CardContent>
        </Card>

        {/* Total Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Students
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Active student accounts
            </p>
          </CardContent>
        </Card>

        {/* Total Employees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Active employee accounts
            </p>
          </CardContent>
        </Card>

        {/* Total Clubs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClubs}</div>
            <p className="text-xs text-muted-foreground">
              Clubs and organizations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Users (Active Students + Active Employees)
              </span>
              <span className="text-lg font-semibold">
                {stats.totalStudents + stats.totalEmployees}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Institutions (Approved + Pending)
              </span>
              <span className="text-lg font-semibold">
                {(stats.approvedInstitutions || 0) +
                  (stats.pendingInstitutions || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
