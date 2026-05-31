'use client';

import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, subDays, subWeeks } from 'date-fns';
import type { Booking, FormData } from './_components/types';
import { EMPTY_FORM } from './_components/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, TrendingUpIcon, TrendingDownIcon } from '@/components/shared/icons';
import NumberFlow from '@number-flow/react';
import { createAdminBooking, deleteAdminBooking, fetchAdminBookings, generateAdminReviewCode, updateAdminBooking } from '@/lib/services/admin-bookings';
import { isAuthenticated, setLastPage } from '@/lib/services/auth';
import { useToast } from '@/hooks/use-toast';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import { ScheduleLoadingSkeleton } from '@/components/admin/loading';
import ScheduleDialog from './_components/dialog';
import RightPanel from './_components/right-panel';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function sortBookings(items: Booking[]): Booking[] {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
}

interface CalendarGridProps {
  currentMonth: Date;
  bookings: Booking[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onEditBooking: (b: Booking) => void;
  changingStatusId: string | null;
}

type ScheduleStats = { total: number; today: number; week: number; pending: number; todayTrend?: { value: number; direction: 'up' | 'down' }; weekTrend?: { value: number; direction: 'up' | 'down' }; pendingTrend?: { value: number; direction: 'up' | 'down' } };
type ScheduleTrends = { total?: { value: number; direction: 'up' | 'down' }; today?: { value: number; direction: 'up' | 'down' }; week?: { value: number; direction: 'up' | 'down' }; pending?: { value: number; direction: 'up' | 'down' } };

const StatsCards = memo(function StatsCards({ stats, trends }: { stats: ScheduleStats; trends?: ScheduleTrends }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {[
        { label: 'Total', value: stats.total, icon: 'calendar', accent: 'bg-sky-900/40 text-sky-400', trend: trends?.total },
        { label: 'Today', value: stats.today, icon: 'today', accent: 'bg-emerald-900/40 text-emerald-400', trend: trends?.today },
        { label: 'This Week', value: stats.week, icon: 'week', accent: 'bg-blue-900/40 text-blue-400', trend: trends?.week },
        { label: 'Pending', value: stats.pending, icon: 'pending', accent: 'bg-amber-900/40 text-amber-300', trend: trends?.pending },
      ].map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${s.accent}`}>
              {s.icon === 'calendar' && (
                <svg className="size-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              )}
              {s.icon === 'today' && (
                <svg className="size-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {s.icon === 'week' && (
                <svg className="size-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
              )}
              {s.icon === 'pending' && (
                <svg className="size-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text-dim)]">{s.label}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xl font-bold tracking-tight text-[var(--text)]">
                  <NumberFlow value={s.value} transformTiming={{ duration: 600, easing: 'ease-out' }} />
                </p>
                {s.trend && (
                  <span className={`flex items-center gap-0.5 text-[10px] font-medium ${s.trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.trend.direction === 'up' ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
                    {s.trend.value}%
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

const CalendarGrid = memo(function CalendarGrid({ currentMonth, bookings, selectedDate, onSelectDate, onPrevMonth, onNextMonth, onEditBooking, changingStatusId }: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const existing = map.get(b.date) || [];
      existing.push(b);
      map.set(b.date, existing);
    }
    return map;
  }, [bookings]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-mid)]/30">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <button
          onClick={onPrevMonth}
          className="flex size-8 items-center justify-center rounded-lg text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text)]"
        >
          <ChevronLeftIcon />
        </button>
        <h3 className="text-sm font-semibold tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={onNextMonth}
          className="flex size-8 items-center justify-center rounded-lg text-[var(--text-dim)] transition-colors hover:bg-[var(--button)] hover:text-[var(--text)]"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="border-b border-[var(--border)] px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-[var(--text-dim)]"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDate.get(dateStr) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isSameDay(day, new Date());

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(day)}
              className={`flex min-h-[90px] flex-col border-b border-r border-[var(--border)] p-1.5 text-left transition-colors ${
                isCurrentMonth ? 'hover:bg-[var(--button)]' : 'bg-[var(--bg-end)]/20'
              } ${
                isSelected ? 'ring-2 ring-inset ring-[var(--button-hover)] bg-[var(--button)]' : ''
              }`}
            >
              <span
                className={`mb-0.5 inline-flex size-5 items-center justify-center rounded-full text-xs font-medium leading-none ${
                  isTodayDate
                    ? 'bg-[var(--text)] text-[var(--bg-end)]'
                    : isCurrentMonth
                      ? 'text-[var(--text)]'
                      : 'text-[var(--text-dim)]'
                }`}
              >
                {format(day, 'd')}
              </span>
              <div className="flex flex-col gap-[2px]">
                {dayBookings.slice(0, 3).map((b) => (
                  <span
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); onEditBooking(b); }}
                    className={`truncate rounded px-1 py-[1px] text-[10px] font-medium leading-tight transition-all ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-900/50 text-emerald-200'
                        : b.status === 'pending'
                          ? 'bg-amber-900/50 text-amber-200'
                          : 'bg-red-900/50 text-red-300'
                    } ${changingStatusId === b.id ? 'animate-pulse' : ''}`}
                    title={`${b.time} - ${b.name}`}
                  >
                    {b.time} {b.name.split(' ')[0]}
                  </span>
                ))}
                {dayBookings.length > 3 && (
                  <span className="px-1 text-[10px] font-medium text-[var(--text-dim)]">
                    +{dayBookings.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default function SchedulePage() {
  const router = useRouter();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const manualToggleRef = useRef(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const editingRef = useRef(editingBooking);
  editingRef.current = editingBooking;
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const [statusPendingConfirm, setStatusPendingConfirm] = useState<{ id: string; status: Booking['status'] } | null>(null);
  const [mobileTab, setMobileTab] = useState<'calendar' | 'bookings'>('calendar');

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (typeof window !== 'undefined' && !isAuthenticated()) {
        setLastPage('/admin/schedule');
        router.replace('/admin/login');
        return;
      }

      try {
        const rows = await fetchAdminBookings();
        if (!active) return;
        setBookings(sortBookings(rows));
      } catch {
        if (!active) return;
        toast.error('Failed to load bookings');
      } finally {
        if (active) setIsLoadingBookings(false);
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, [router, toast]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const handleResize = () => {
      if (manualToggleRef.current) return;
      setSidebarExpanded(window.innerWidth >= 1280);
    };
    setSidebarExpanded(window.innerWidth >= 1280);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const selectedStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const dayBookings = useMemo(
    () => bookings.filter((b) => b.date === selectedStr).sort((a, b) => a.time.localeCompare(b.time)),
    [bookings, selectedStr],
  );

  const stats = useMemo(() => {
    const today = new Date();
    const todayS = format(today, 'yyyy-MM-dd');
    const yesterdayS = format(subDays(today, 1), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const lastWeekStart = format(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const lastWeekEnd = format(endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const total = bookings.length;
    const todayCount = bookings.filter((b) => b.date === todayS).length;
    const yesterdayCount = bookings.filter((b) => b.date === yesterdayS).length;
    const weekCount = bookings.filter((b) => b.date >= weekStart && b.date <= weekEnd).length;
    const lastWeekCount = bookings.filter((b) => b.date >= lastWeekStart && b.date <= lastWeekEnd).length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const lastWeekPending = bookings.filter((b) => b.status === 'pending' && b.date >= lastWeekStart && b.date <= lastWeekEnd).length;

    const getTrend = (current: number, previous: number): { value: number; direction: 'up' | 'down' } | undefined => {
      if (previous === 0) return undefined;
      const pct = Math.round(((current - previous) / previous) * 100);
      if (pct === 0) return undefined;
      return { value: Math.abs(pct), direction: pct > 0 ? 'up' : 'down' };
    };

    return {
      total,
      today: todayCount,
      week: weekCount,
      pending,
      todayTrend: getTrend(todayCount, yesterdayCount),
      weekTrend: getTrend(weekCount, lastWeekCount),
      pendingTrend: getTrend(pending, lastWeekPending),
    };
  }, [bookings]);

  const handleToggleSidebar = useCallback(() => {
    manualToggleRef.current = true;
    if (isMobile) {
      const next = !mobileSidebarOpen;
      setMobileSidebarOpen(next);
      document.body.style.overflow = next ? 'hidden' : '';
    } else {
      setSidebarExpanded((prev) => !prev);
    }
  }, [isMobile, mobileSidebarOpen]);

  const openNewBooking = useCallback(() => {
    setFormData({ ...EMPTY_FORM, date: selectedStr, time: '09:00' });
    setEditingBooking(null);
    setShowNewDialog(true);
  }, [selectedStr]);

  const openEditBooking = useCallback((b: Booking) => {
    setFormData({
      name: b.name,
      email: b.email,
      phone: b.phone,
      service: b.service,
      time: b.time,
      notes: b.notes,
      date: b.date,
      status: b.status,
    });
    setEditingBooking(b);
    setShowNewDialog(true);
  }, []);

  const closeDialog = useCallback(() => {
    setShowNewDialog(false);
    setEditingBooking(null);
  }, []);

  const handleFormChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    const targetDate = formData.date || selectedStr;

    try {
      if (editingBooking) {
        const updated = await updateAdminBooking(editingBooking.id, {
          date: targetDate,
          time: formData.time,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone,
          service: formData.service,
          notes: formData.notes,
          status: (formData.status as Booking['status']) || editingBooking.status,
        });

        setBookings((prev) => sortBookings(prev.map((b) => (b.id === updated.id ? updated : b))));
        closeDialog();
        toast.success('Booking updated');
        return;
      }

      const created = await createAdminBooking({
        date: targetDate,
        time: formData.time,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone,
        service: formData.service,
        notes: formData.notes,
      });

      setBookings((prev) => sortBookings([...prev, created]));
      closeDialog();
      toast.success('Booking created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save booking');
    }
  }, [formData, editingBooking, selectedStr, closeDialog, toast]);

  const handleRequestStatusChange = useCallback((id: string, status: Booking['status']) => {
    setStatusPendingConfirm({ id, status });
  }, []);

  const confirmStatusChange = useCallback(async () => {
    if (!statusPendingConfirm) return;
    const { id, status } = statusPendingConfirm;
    setStatusPendingConfirm(null);
    setChangingStatusId(id);

    try {
      const updated = await updateAdminBooking(id, { status });
      setBookings((prev) => sortBookings(prev.map((b) => (b.id === id ? updated : b))));
      if (editingRef.current?.id === id) {
        setEditingBooking((prev) => (prev ? { ...prev, status: updated.status } : null));
      }
      toast.success(`Status changed to ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setTimeout(() => setChangingStatusId(null), 500);
    }
  }, [statusPendingConfirm, toast]);

  const cancelStatusChange = useCallback(() => {
    setStatusPendingConfirm(null);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteAdminBooking(id);
        setBookings((prev) => prev.filter((b) => b.id !== id));
        closeDialog();
        toast.success('Booking deleted');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete booking');
      }
    },
    [closeDialog, toast],
  );

  const handleGenerateReviewCode = useCallback(async (id: string) => {
    try {
      const updated = await generateAdminReviewCode(id);
      setBookings((prev) => sortBookings(prev.map((b) => (b.id === id ? updated : b))));
      toast.success('Review code generated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate review code');
    }
  }, [toast]);

  const selectedDateLabel = useMemo(() => format(selectedDate, 'EEEE, MMMM d, yyyy'), [selectedDate]);

  const isToday = useMemo(() => selectedStr === todayStr, [selectedStr, todayStr]);
  const showInitialSkeleton = isLoadingBookings && bookings.length === 0;

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
            <AdminPageHeader
              title="Scheduling"
              description="Manage your bookings and appointments"
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openNewBooking}
                  className="border border-[var(--border)] bg-[var(--button)] text-[var(--text-muted)] hover:bg-[var(--button-hover)] hover:text-[var(--text)]"
                >
                  <PlusIcon />
                  <span>New Booking</span>
                </Button>
              }
            />

            {showInitialSkeleton ? (
              <ScheduleLoadingSkeleton mobileTab={mobileTab} />
            ) : (
              <>
                <StatsCards stats={stats} trends={{ today: stats.todayTrend, week: stats.weekTrend, pending: stats.pendingTrend }} />

                <div className="mb-4 flex rounded-lg border border-[var(--border)] p-0.5 lg:hidden">
                  {(['calendar', 'bookings'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setMobileTab(t)}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        mobileTab === t
                          ? 'bg-[var(--button-hover)] text-[var(--text)]'
                          : 'text-[var(--text-dim)]'
                      }`}
                    >
                      {t === 'calendar' ? 'Calendar' : 'Bookings'}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
                  <section className={`lg:w-8/12 ${mobileTab !== 'calendar' ? 'hidden lg:block' : ''}`}>
                    <CalendarGrid
                      currentMonth={currentMonth}
                      bookings={bookings}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      onPrevMonth={() => setCurrentMonth((m) => subMonths(m, 1))}
                      onNextMonth={() => setCurrentMonth((m) => addMonths(m, 1))}
                      onEditBooking={openEditBooking}
                      changingStatusId={changingStatusId}
                    />
                  </section>

                  <section className={`lg:w-4/12 ${mobileTab !== 'bookings' ? 'hidden lg:block' : ''}`}>
                    <RightPanel
                      selectedDate={selectedDate}
                      dateLabel={selectedDateLabel}
                      isToday={isToday}
                      dayBookings={dayBookings}
                      bookingsCount={bookings.length}
                      changingStatusId={changingStatusId}
                      onNewBooking={openNewBooking}
                      onEditBooking={openEditBooking}
                      onRequestStatusChange={handleRequestStatusChange}
                      onGenerateReviewCode={handleGenerateReviewCode}
                    />
                  </section>
                </div>
              </>
            )}
          </AdminPageShell>
        </main>
      </div>

      {statusPendingConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={cancelStatusChange}
        >
          <div
            className="w-full rounded-t-xl border border-[var(--border)] bg-[var(--bg-mid)] p-5 shadow-2xl sm:mx-4 sm:max-w-xs sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-sm font-medium text-[var(--text)]">
              Change status to <span className="capitalize">{statusPendingConfirm.status}</span>?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={cancelStatusChange}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--button)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--button-hover)]"
              >
                No
              </button>
              <button
                onClick={confirmStatusChange}
                className="flex-1 rounded-lg bg-[var(--text)] px-3 py-2 text-sm font-medium text-[var(--bg-end)] transition-colors hover:opacity-90"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      <ScheduleDialog
        open={showNewDialog}
        editingBooking={editingBooking}
        formData={formData}
        onFormChange={handleFormChange}
        onSave={handleSave}
        onClose={closeDialog}
        onDelete={handleDelete}
      />
    </div>
  );
}
