'use client';

import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays } from 'date-fns';
import type { Booking, FormData } from './types';
import { EMPTY_FORM } from './types';
import { Button } from '@/components/ui/button';
import AdminHeader from '@/components/admin/admin-header';
import { DesktopSidebar, MobileSidebar } from '@/components/admin/admin-sidebar';
import { AdminPageShell, AdminPageHeader } from '@/components/admin/admin-page-layout';
import ScheduleDialog from './dialog';
import RightPanel from './right-panel';

const STORAGE_KEY = 'admin_bookings';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function PlusIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Booking[];
  } catch {}
  return [];
}

function makeDummyBookings(): Booking[] {
  const today = new Date();
  const yyyyMMdd = (d: Date) => format(d, 'yyyy-MM-dd');
  return [
    { id: 'd1', date: yyyyMMdd(today), time: '09:00', name: 'Alice Johnson', email: 'alice@example.com', phone: '+60 12-345 6789', service: 'Brand Consultation', status: 'confirmed', notes: 'Discuss new brand identity for startup launch.' },
    { id: 'd2', date: yyyyMMdd(today), time: '11:00', name: 'Bob Lee', email: 'bob@example.com', phone: '+60 12-987 6543', service: 'UI/UX Design Review', status: 'pending', notes: 'Review latest Figma mockups before client presentation.' },
    { id: 'd3', date: yyyyMMdd(today), time: '14:30', name: 'Carol Tan', email: 'carol@example.com', phone: '+60 12-555 1212', service: 'Website Strategy', status: 'cancelled', notes: '' },
    { id: 'd4', date: yyyyMMdd(addDays(today, 1)), time: '10:30', name: 'David Wong', email: 'david@example.com', phone: '+60 12-444 3333', service: 'Photography Session', status: 'confirmed', notes: 'Product shoot for new collection.' },
    { id: 'd5', date: yyyyMMdd(addDays(today, 2)), time: '16:00', name: 'Eve Martinez', email: 'eve@example.com', phone: '+60 12-777 8888', service: 'Social Media Audit', status: 'pending', notes: '' },
    { id: 'd6', date: yyyyMMdd(addDays(today, 3)), time: '09:30', name: 'Frank Lim', email: 'frank@example.com', phone: '+60 12-666 5555', service: 'Brand Consultation', status: 'confirmed', notes: 'Second session.' },
    { id: 'd7', date: yyyyMMdd(addDays(today, -2)), time: '15:00', name: 'Grace Chen', email: 'grace@example.com', phone: '+60 12-333 2222', service: 'Content Writing', status: 'confirmed', notes: 'Blog post series planning.' },
  ];
}

function initBookings(): Booking[] {
  const existing = loadBookings();
  if (existing.length > 0) return existing;
  const dummies = makeDummyBookings();
  saveBookings(dummies);
  return dummies;
}

function saveBookings(bookings: Booking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {}
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

type ScheduleStats = { total: number; today: number; week: number; pending: number };

const StatsCards = memo(function StatsCards({ stats }: { stats: ScheduleStats }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {[
        { label: 'Total', value: stats.total, icon: 'calendar' },
        { label: 'Today', value: stats.today, icon: 'today' },
        { label: 'This Week', value: stats.week, icon: 'week' },
        { label: 'Pending', value: stats.pending, icon: 'pending' },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-mid)]/40 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--button)]">
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
            <div>
              <p className="text-xs font-medium text-[var(--text-dim)]">{s.label}</p>
              <p className="mt-0.5 text-xl font-bold tracking-tight text-[var(--text)]">{s.value}</p>
            </div>
          </div>
        </div>
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const editingRef = useRef(editingBooking);
  editingRef.current = editingBooking;
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'calendar' | 'bookings'>('calendar');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = localStorage.getItem('admin_auth');
      if (authed !== 'true') {
        router.replace('/admin/login');
        return;
      }
    }
    setBookings(initBookings());
  }, [router]);

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
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    return {
      total: bookings.length,
      today: bookings.filter((b) => b.date === todayS).length,
      week: bookings.filter((b) => b.date >= weekStart && b.date <= weekEnd).length,
      pending: bookings.filter((b) => b.status === 'pending').length,
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

  const handleSignOut = useCallback(() => {
    localStorage.removeItem('admin_auth');
    router.push('/admin/login');
  }, [router]);

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

  const handleSave = useCallback(() => {
    if (!formData.name.trim() || !formData.email.trim()) return;
    const targetDate = formData.date || selectedStr;
    const newBookings = [...bookings];
    if (editingBooking) {
      const idx = newBookings.findIndex((b) => b.id === editingBooking.id);
      if (idx !== -1) {
        newBookings[idx] = {
          ...newBookings[idx],
          date: targetDate,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone,
          service: formData.service,
          time: formData.time,
          notes: formData.notes,
          status: (formData.status as Booking['status']) || newBookings[idx].status,
        };
      }
    } else {
      newBookings.push({
        id: generateId(),
        date: targetDate,
        time: formData.time,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone,
        service: formData.service,
        notes: formData.notes,
        status: 'pending',
      });
    }
    setBookings(newBookings);
    saveBookings(newBookings);
    closeDialog();
  }, [bookings, formData, editingBooking, selectedStr, closeDialog]);

  const handleStatusChange = useCallback(
    (id: string, status: Booking['status']) => {
      setChangingStatusId(id);
      setTimeout(() => setChangingStatusId(null), 500);
      setBookings((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, status } : b));
        saveBookings(next);
        return next;
      });
      if (editingRef.current?.id === id) {
        setEditingBooking((prev) => (prev ? { ...prev, status } : null));
      }
    },
    [],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setBookings((prev) => {
        const next = prev.filter((b) => b.id !== id);
        saveBookings(next);
        return next;
      });
      closeDialog();
    },
    [closeDialog],
  );

  const selectedDateLabel = useMemo(() => format(selectedDate, 'EEEE, MMMM d, yyyy'), [selectedDate]);

  const isToday = useMemo(() => selectedStr === todayStr, [selectedStr, todayStr]);

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader
        sidebarExpanded={sidebarExpanded}
        isMobile={isMobile}
        onToggleSidebar={handleToggleSidebar}
        onSignOut={handleSignOut}
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

            <StatsCards stats={stats} />

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
                  onStatusChange={handleStatusChange}
                />
              </section>
            </div>
          </AdminPageShell>
        </main>
      </div>

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
