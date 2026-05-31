'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { LockIcon, CheckIcon, AlertIcon } from '@/components/shared/icons';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { type AdminProfile, loadProfile, saveProfile } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';

export default function ProfilePage() {
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1280;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  });
  const manualToggleRef = useRef(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<AdminProfile>(loadProfile());
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [resettingAvatar, setResettingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'finalizing'>('idle');

  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      setLastPage('/admin/profile');
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileSidebarOpen(false);
        document.body.style.overflow = '';
      }
    };

    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handleResize = () => {
      if (manualToggleRef.current) return;
      setSidebarExpanded(window.innerWidth >= 1280);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const handleToggleSidebar = () => {
    manualToggleRef.current = true;
    if (isMobile) {
      const next = !mobileSidebarOpen;
      setMobileSidebarOpen(next);
      document.body.style.overflow = next ? 'hidden' : '';
    } else {
      setSidebarExpanded((prev) => !prev);
    }
  };

  const handleSaveProfile = () => {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success('Profile updated');
  };

  const handleOpenAvatarPicker = () => {
    avatarFileInputRef.current?.click();
  };

  const extractProxyFileId = (avatarUrl: string | undefined): string | null => {
    if (!avatarUrl) return null;
    const match = avatarUrl.match(/\/api\/media\/([^/?#]+)/);
    return match?.[1] || null;
  };

  const removePreviousAvatarFromDrive = async (fileId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/media/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        return false;
      }

      const payload = (await response.json()) as { success?: boolean };
      return Boolean(payload.success);
    } catch {
      return false;
    }
  };

  const uploadAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const previousFileId = extractProxyFileId(profile.avatarUrl);

    setUploadingAvatar(true);
    setUploadStage('uploading');
    setUploadProgress(10);

    let progressTimer: ReturnType<typeof setInterval> | null = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.max(1, Math.round((90 - prev) / 6));
      });
    }, 180);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (previousFileId) {
        formData.append('previousFileId', previousFileId);
      }

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        file?: { proxyUrl?: string; driveViewUrl?: string };
        previousFileDeleted?: boolean;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to upload profile image');
      }

      const nextAvatarUrl = payload.file?.proxyUrl || payload.file?.driveViewUrl;
      if (!nextAvatarUrl) {
        throw new Error('Upload finished but no image URL was returned');
      }

      setUploadStage('finalizing');
      setUploadProgress(96);

      const updatedProfile = {
        ...profile,
        avatarUrl: nextAvatarUrl,
      };

      setProfile(updatedProfile);
      saveProfile(updatedProfile);
      if (previousFileId && payload.previousFileDeleted) {
        toast.success('Profile image updated and previous image removed');
      } else {
        toast.success('Profile image updated');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload profile image';
      toast.error(message);
    } finally {
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }

      setUploadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 240));

      setUploadingAvatar(false);
      setUploadStage('idle');
      setUploadProgress(0);
    }
  };

  const handleResetAvatar = async () => {
    if (uploadingAvatar || resettingAvatar) return;

    const previousFileId = extractProxyFileId(profile.avatarUrl);
    const updatedProfile = { ...profile, avatarUrl: '/person-2.png' };

    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    if (!previousFileId) {
      toast.success('Profile image reset');
      return;
    }

    setResettingAvatar(true);
    const deleted = await removePreviousAvatarFromDrive(previousFileId);
    setResettingAvatar(false);

    if (deleted) {
      toast.success('Profile image reset and previous image removed');
    } else {
      toast.success('Profile image reset');
      toast.error('Could not remove previous Drive image automatically');
    }
  };

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAvatarFile(file);
    event.target.value = '';
  };

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordSaved(false);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      localStorage.setItem('admin_password', newPassword);
    } catch {}

    setNewPassword('');
    setConfirmPassword('');
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
    toast.success('Password updated');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader
        sidebarExpanded={sidebarExpanded}
        isMobile={isMobile}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {isMobile ? (
          <MobileSidebar
            open={mobileSidebarOpen}
            onClose={() => { setMobileSidebarOpen(false); document.body.style.overflow = ''; }}
          />
        ) : (
          <DesktopSidebar expanded={sidebarExpanded} />
        )}

        <main className="flex-1 overflow-y-auto">
          <AdminPageShell>
            <AdminPageHeader title="Profile Settings" description="Manage your personal information and password" />

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar src={profile.avatarUrl} alt="Profile" fallback={profile.name || 'AW'} className="size-14" />
                  <div>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                    <CardDescription>Your name and email address</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Profile picture</label>
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenAvatarPicker}
                      disabled={uploadingAvatar || resettingAvatar}
                    >
                      {uploadingAvatar ? 'Uploading...' : 'Upload New Photo'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetAvatar}
                      disabled={uploadingAvatar || resettingAvatar}
                    >
                      {resettingAvatar ? 'Resetting...' : 'Reset to Default'}
                    </Button>
                  </div>
                  <p className="text-xs text-[var(--text-dim)]">
                    JPG, PNG, or WEBP image. Uploads to Google Drive and replaces previous profile image.
                  </p>
                  <p className="text-xs text-[var(--text-dim)]">Recommended under 5MB for faster upload.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveProfile}
                  >
                    {saved ? (
                      <><CheckIcon className="size-4" /><span>Saved</span></>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--button)]">
                    <LockIcon className="size-4 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Change Password</CardTitle>
                    <CardDescription>Update your account password</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>
                {passwordError && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertIcon className="size-4" />
                    <span>{passwordError}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    onClick={handleChangePassword}
                    disabled={!newPassword || !confirmPassword}
                    className="border border-[var(--border)] bg-[var(--text)] text-[var(--bg-end)] hover:opacity-90 disabled:opacity-40"
                  >
                    {passwordSaved ? (
                      <><CheckIcon className="size-4" /><span>Password Updated</span></>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AdminPageShell>
        </main>
      </div>

      {uploadingAvatar && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 backdrop-blur-sm">
          <div className="w-[92%] max-w-sm rounded-2xl border border-white/15 bg-[var(--bg-start)]/95 p-5 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-[var(--text-dim)] border-t-[var(--text)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Uploading profile image</p>
                <p className="text-xs text-[var(--text-dim)]" aria-live="polite">
                  {uploadStage === 'finalizing' ? 'Saving and refreshing preview...' : 'Sending file to Google Drive...'}
                </p>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--button)]">
              <div
                className="h-full rounded-full bg-[var(--text)] transition-[width] duration-200 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            <p className="mt-2 text-right text-xs tabular-nums text-[var(--text-dim)]">{uploadProgress}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
