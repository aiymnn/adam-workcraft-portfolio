'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { LockIcon, CheckIcon, AlertIcon, XIcon } from '@/components/shared/icons';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { DEFAULT_PROFILE, type AdminProfile, loadProfile, saveProfile } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty',
  'letmein',
  'admin123',
  'welcome123',
]);

function validateProfileName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Name is required.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > 80) return 'Name must be 80 characters or less.';
  return null;
}

function validateProfileEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return 'Email is required.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address.';
  if (trimmed.length > 120) return 'Email must be 120 characters or less.';
  return null;
}

function validatePassword(value: string, profile: AdminProfile): string | null {
  if (value.length < 8) return 'Use at least 8 characters.';
  if (value.length > 128) return 'Password is too long.';
  if (/\s/.test(value)) return 'Password cannot contain spaces.';
  if (!/[a-z]/.test(value)) return 'Add at least one lowercase letter.';
  if (!/[A-Z]/.test(value)) return 'Add at least one uppercase letter.';
  if (!/[0-9]/.test(value)) return 'Add at least one number.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Add at least one symbol.';
  if (/(.)\1\1/.test(value)) return 'Avoid repeated characters like "aaa".';

  const lowercase = value.toLowerCase();
  if (WEAK_PASSWORDS.has(lowercase)) return 'Password is too common.';

  const emailLocalPart = profile.email.split('@')[0]?.toLowerCase().trim();
  if (emailLocalPart && emailLocalPart.length >= 3 && lowercase.includes(emailLocalPart)) {
    return 'Do not include your email name in password.';
  }

  const nameToken = profile.name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .find((token) => token.length >= 3);
  if (nameToken && lowercase.includes(nameToken)) {
    return 'Do not include your name in password.';
  }

  return null;
}

function getPasswordRuleChecks(value: string, profile: AdminProfile) {
  const lowercase = value.toLowerCase();
  const emailLocalPart = profile.email.split('@')[0]?.toLowerCase().trim();
  const nameToken = profile.name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .find((token) => token.length >= 3);

  return [
    { label: 'At least 8 characters', passed: value.length >= 8 },
    { label: 'Has lowercase letter', passed: /[a-z]/.test(value) },
    { label: 'Has uppercase letter', passed: /[A-Z]/.test(value) },
    { label: 'Has number', passed: /[0-9]/.test(value) },
    { label: 'Has symbol', passed: /[^A-Za-z0-9]/.test(value) },
    { label: 'No spaces', passed: !/\s/.test(value) },
    { label: 'No repeated characters (aaa)', passed: !/(.)\1\1/.test(value) },
    { label: 'Not a common password', passed: !WEAK_PASSWORDS.has(lowercase) },
    {
      label: 'Does not include your email name',
      passed: !(emailLocalPart && emailLocalPart.length >= 3 && lowercase.includes(emailLocalPart)),
    },
    {
      label: 'Does not include your name',
      passed: !(nameToken && lowercase.includes(nameToken)),
    },
  ];
}

function getPasswordStrength(passedCount: number, totalCount: number) {
  if (totalCount === 0 || passedCount <= 4) {
    return { label: 'Weak', tone: 'text-red-300 border-red-400/40 bg-red-500/10' };
  }

  if (passedCount <= 8) {
    return { label: 'Medium', tone: 'text-amber-300 border-amber-400/40 bg-amber-500/10' };
  }

  return { label: 'Strong', tone: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10' };
}

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

  const [profile, setProfile] = useState<AdminProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [resettingAvatar, setResettingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'finalizing'>('idle');

  const { toast } = useToast();
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const passwordChecks = getPasswordRuleChecks(newPassword, profile);
  const passedPasswordChecks = passwordChecks.filter((check) => check.passed).length;
  const passwordStrength = getPasswordStrength(passedPasswordChecks, passwordChecks.length);
  const allPasswordChecksPassed = passwordChecks.every((check) => check.passed);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      setLastPage('/admin/profile');
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/api/admin/profile', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Failed to load profile');
        }

        const payload = (await response.json()) as { success?: boolean; profile?: AdminProfile };
        if (!active || !payload.profile) return;

        setProfile(payload.profile);
        saveProfile(payload.profile);
        return;
      } catch {
        if (!active) return;
      }

      const fallbackProfile = loadProfile();
      setProfile(fallbackProfile);
      saveProfile(fallbackProfile);
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

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

  const syncProfileToServer = async (nextProfile: AdminProfile): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(nextProfile),
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSaveProfile = async () => {
    const nextName = profile.name.trim();
    const nextEmail = profile.email.trim().toLowerCase();

    const nextNameError = validateProfileName(nextName);
    const nextEmailError = validateProfileEmail(nextEmail);

    setNameError(nextNameError ?? '');
    setEmailError(nextEmailError ?? '');

    if (nextNameError || nextEmailError) {
      toast.error('Please fix profile validation errors before saving.');
      return;
    }

    const nextProfile = {
      ...profile,
      name: nextName,
      email: nextEmail,
    };

    setProfile(nextProfile);
    saveProfile(nextProfile);

    const synced = await syncProfileToServer(nextProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (synced) {
      toast.success('Profile updated');
    } else {
      toast.error('Profile updated locally, but database sync failed');
    }
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
      const synced = await syncProfileToServer(updatedProfile);
      if (previousFileId && payload.previousFileDeleted) {
        toast[synced ? 'success' : 'error'](synced ? 'Profile image updated and previous image removed' : 'Profile image updated locally, but database sync failed');
      } else {
        toast[synced ? 'success' : 'error'](synced ? 'Profile image updated' : 'Profile image updated locally, but database sync failed');
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
    const synced = await syncProfileToServer(updatedProfile);

    if (!previousFileId) {
      toast[synced ? 'success' : 'error'](synced ? 'Profile image reset' : 'Profile image reset locally, but database sync failed');
      return;
    }

    setResettingAvatar(true);
    const deleted = await removePreviousAvatarFromDrive(previousFileId);
    setResettingAvatar(false);

    if (deleted) {
      toast[synced ? 'success' : 'error'](synced ? 'Profile image reset and previous image removed' : 'Profile image reset locally, but database sync failed');
    } else {
      toast[synced ? 'success' : 'error'](synced ? 'Profile image reset' : 'Profile image reset locally, but database sync failed');
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

    const nextName = profile.name.trim();
    const nextEmail = profile.email.trim().toLowerCase();
    const nextNameError = validateProfileName(nextName);
    const nextEmailError = validateProfileEmail(nextEmail);

    if (nextNameError || nextEmailError) {
      setNameError(nextNameError ?? '');
      setEmailError(nextEmailError ?? '');
      toast.error('Save a valid name and email before changing password.');
      return;
    }

    const normalizedProfile = {
      ...profile,
      name: nextName,
      email: nextEmail,
    };

    const passwordValidationError = validatePassword(newPassword, normalizedProfile);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
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

        <main className="scrollbar-hidden flex-1 overflow-y-auto">
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
                    onChange={(e) => {
                      setNameError('');
                      setProfile((p) => ({ ...p, name: e.target.value }));
                    }}
                  />
                  {nameError && (
                    <p className="text-xs text-red-400">{nameError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-muted)]">Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => {
                      setEmailError('');
                      setProfile((p) => ({ ...p, email: e.target.value }));
                    }}
                  />
                  {emailError && (
                    <p className="text-xs text-red-400">{emailError}</p>
                  )}
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
                    onChange={(e) => {
                      setPasswordError('');
                      setNewPassword(e.target.value);
                    }}
                    placeholder="Min. 8 chars, upper/lower/number/symbol"
                  />
                  {newPassword && (
                    <div className="space-y-1 rounded-lg border border-[var(--border)]/60 bg-[var(--button)]/30 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-[var(--text-dim)]">Password strength</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${passwordStrength.tone}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      {passwordChecks.map((check) => (
                        <div key={check.label} className="flex items-center gap-2 text-xs">
                          {check.passed ? (
                            <CheckIcon className="size-3.5 text-emerald-400" />
                          ) : (
                            <XIcon className="size-3.5 text-red-400" />
                          )}
                          <span className={check.passed ? 'text-emerald-300' : 'text-red-300'}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                    disabled={!newPassword || !confirmPassword || !allPasswordChecksPassed}
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
