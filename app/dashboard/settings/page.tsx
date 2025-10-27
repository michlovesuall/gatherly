"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  // Update Account form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return user?.avatar || "";
  }, [avatarFile, user?.avatar]);

  useEffect(() => {
    let mounted = true;
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (data?.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setEmail(data.user.email || "");
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  function getInitials(n?: string) {
    if (!n) return "";
    return n
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }

  async function onSaveAccountInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingInfo(true);
    try {
      const res = await fetch("/api/account/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, name, email }),
      });
      if (!res.ok) throw new Error("Failed to update account");
      toast.success("Account information updated");
      setUser({ ...user, name, email });
    } catch (err) {
      toast.error("Could not update account information");
    } finally {
      setSavingInfo(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          currentPassword,
          newPassword,
        }),
      });
      if (!res.ok) throw new Error("Failed to change password");
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Could not change password");
    } finally {
      setChangingPassword(false);
    }
  }

  async function onUploadAvatar(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !avatarFile) {
      toast.error("Please choose an image to upload");
      return;
    }
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("userId", user.userId);
      form.append("avatar", avatarFile);
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Failed to upload avatar");
      const data = await res.json().catch(() => ({}));
      const newUrl: string = data?.avatarUrl || avatarPreview;
      setUser({ ...user, avatar: newUrl });
      setAvatarFile(null);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error("Could not upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <Toaster richColors />
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Toaster richColors />
        <p className="text-sm text-muted-foreground">
          You are not signed in. Please log in to manage your account.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <Toaster richColors />

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="text-base font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">Role: {user.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Update Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSaveAccountInfo} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={savingInfo}
              >
                {savingInfo ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onChangePassword} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={changingPassword}
              >
                {changingPassword ? "Changing…" : "Change Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Upload Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onUploadAvatar} className="grid gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarPreview} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  PNG or JPG up to 2MB.
                </p>
              </div>
            </div>
            <div>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? "Uploading…" : "Upload"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
