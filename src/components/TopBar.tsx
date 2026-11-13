import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudOff,
  FileText,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { FilterState, TabId, UserRole } from '../types';
import {
  ARABIC_MONTHS,
  UAE_LOCATIONS,
  assetUrl,
  getMonthLabel,
  getUaeCurrentDate,
} from '../utils/uaeDate';
import styles from './TopBar.module.css';

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  type: 'info' | 'warning' | 'success';
  targetTab?: TabId;
}

interface TopBarProps {
  filter: FilterState;
  onFilterChange: (next: Partial<FilterState>) => void;
  user: User | null;
  actorName: string;
  activeRole: UserRole;
  isCloudMode: boolean;
  firebaseOnline: boolean;
  hasUnsyncedLocalData: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onSyncLocal: () => void;
  onOpenPrintPreview: () => void;
  onToggleMobileMenu: () => void;
  notifications: NotificationItem[];
  onDismissNotification: (id: string) => void;
  onClearNotifications: () => void;
  onNavigateTab: (tab: TabId) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مدير النظام',
  finance: 'الإدارة المالية',
  auditor: 'مدقق داخلي',
  viewer: 'مستعرض تنفيذي',
};

export const TopBar: React.FC<TopBarProps> = ({
  filter,
  onFilterChange,
  user,
  actorName,
  activeRole,
  isCloudMode,
  firebaseOnline,
  hasUnsyncedLocalData,
  onSignIn,
  onSignOut,
  onSyncLocal,
  onOpenPrintPreview,
  onToggleMobileMenu,
  notifications,
  onDismissNotification,
  onClearNotifications,
  onNavigateTab,
}) => {
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const logoSrc = assetUrl('assets/aistudio/logo_1afd1154.png');

  const quickYears = useMemo(() => {
    const currentYear = getUaeCurrentDate().year;
    const set = new Set<number>([
      currentYear - 2,
      currentYear - 1,
      currentYear,
      currentYear + 1,
      filter.year,
    ]);
    return Array.from(set).sort((a, b) => b - a);
  }, [filter.year]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotif(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotif(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const renderPeriodFilterPill = (compact = false) => (
    <div
      className={`${styles.filterPill} ${
        compact ? 'w-full justify-between px-2.5 text-[11px]' : 'gap-2 px-3 text-xs'
      }`}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-[#0B4F93]" />
        <select
          aria-label="الشهر السريع"
          value={filter.month}
          onChange={(e) => {
            const val = e.target.value;
            onFilterChange({ month: val === 'all' ? 'all' : Number(val), auctionId: 'all' });
          }}
          className="cursor-pointer appearance-none bg-transparent pl-1 font-extrabold text-[#0A2C52] focus:outline-none"
        >
          <option value="all">كل الأشهر</option>
          {ARABIC_MONTHS.map((m, idx) => (
            <option key={m} value={idx + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <span aria-hidden="true" className="h-4 w-px shrink-0 bg-slate-200" />

      <div className="relative flex shrink-0 items-center">
        <select
          aria-label="السنة السريعة"
          value={filter.year}
          onChange={(e) => onFilterChange({ year: Number(e.target.value), auctionId: 'all' })}
          className="font-mono-num tabular-nums cursor-pointer appearance-none bg-transparent pl-4 pr-1 font-extrabold text-[#0B4F93] focus:outline-none"
        >
          {quickYears.map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute left-0 h-3.5 w-3.5 text-[#0A2C52]/80"
        />
      </div>
    </div>
  );

  const renderLocationFilterPill = (compact = false) => (
    <div
      className={`${styles.filterPill} relative ${
        compact ? 'w-full px-2.5 text-[11px]' : 'gap-1.5 px-3 text-xs'
      }`}
    >
      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0B4F93]" />
      <select
        aria-label="الموقع السريع"
        value={filter.location}
        onChange={(e) => onFilterChange({ location: e.target.value, auctionId: 'all' })}
        className={`cursor-pointer appearance-none truncate bg-transparent pl-4 font-extrabold text-[#0A2C52] focus:outline-none ${
          compact ? 'w-full' : 'max-w-[165px] lg:max-w-[205px]'
        }`}
      >
        <option value="all">جميع المواقع والساحات</option>
        {UAE_LOCATIONS.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#0A2C52]/80"
      />
    </div>
  );

  return (
    <header className={`no-print ${styles.topbarRoot}`}>
      {/* Clipped Decorative Corporate Waves & Subtle Light Streaks */}
      <div aria-hidden="true" className={styles.backdropClip}>
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className={styles.corporateWavesSvg}
        >
          <defs>
            <linearGradient id="saaedTopWaveA" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
              <stop offset="45%" stopColor="#1d6fd6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#08306b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="saaedTopWaveB" x1="100%" y1="100%" x2="10%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.28" />
              <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#041838" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="saaedLogoStreak" x1="100%" y1="0%" x2="72%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="45%" stopColor="#7dd3fc" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,44 C320,14 680,58 1060,22 C1220,8 1340,12 1440,24 L1440,60 L0,60 Z"
            fill="url(#saaedTopWaveA)"
          />
          <path
            d="M0,18 C280,48 640,4 1020,38 C1200,52 1340,38 1440,12 L1440,0 L0,0 Z"
            fill="url(#saaedTopWaveB)"
          />
          {/* Subtle diagonal light ribbon sweeping beneath transparent SAAED logo */}
          <path
            d="M1440,20 L1145,58"
            stroke="url(#saaedLogoStreak)"
            strokeWidth="1.25"
            fill="none"
          />
        </svg>
        <div className={styles.logoAmbientGlow} />
      </div>

      {/* Main Single-Row Top Bar */}
      <div className="relative z-10 flex h-14 w-full items-center justify-between gap-2 px-3 sm:px-5 lg:px-6">
        {/* Rightmost (RTL Start): Mobile Drawer Toggle + Seamless Transparent SAAED Logo */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3.5">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="فتح القائمة الجانبية"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/95 transition hover:bg-white/15 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('dashboard')}
            aria-label="الانتقال إلى لوحة المؤشرات الرئيسية – شركة ساعد"
            className="group relative flex shrink-0 items-center py-1 transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 rounded-md"
          >
            {!logoFailed ? (
              <img
                src={logoSrc}
                alt="شعار شركة ساعد SAAED"
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="h-9 w-auto max-w-[145px] object-contain drop-shadow-[0_2px_8px_rgba(3,18,44,0.65)] sm:h-10 sm:max-w-[170px]"
              />
            ) : (
              <span className="text-base font-extrabold tracking-tight text-white">
                SAAED <span className="text-rose-400">ساعد</span>
              </span>
            )}
          </button>

          <span aria-hidden="true" className={`${styles.verticalDivider} hidden md:block`} />
        </div>

        {/* Center-Right: Quick Period & Location Pill Filters (Desktop & Tablet Single Row) */}
        <div className="hidden min-w-0 items-center gap-2.5 md:flex lg:gap-3">
          {renderPeriodFilterPill(false)}
          {renderLocationFilterPill(false)}
        </div>

        {/* Center-Left to Far Left (RTL End): Export PDF, Sync, Notifications & User Profile */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5 lg:gap-3">
          <button
            type="button"
            onClick={onOpenPrintPreview}
            className={`${styles.pdfPillBtn} hidden sm:inline-flex`}
            title="معاينة وتصدير التقرير المالي بصيغة A4"
          >
            <FileText className="h-3.5 w-3.5 text-sky-300" />
            <span>تصدير PDF</span>
          </button>

          <button
            type="button"
            onClick={onOpenPrintPreview}
            aria-label="تصدير PDF"
            title="معاينة وتصدير التقرير المالي بصيغة A4"
            className={`${styles.circleIconBtn} sm:hidden`}
          >
            <FileText className="h-4 w-4 text-sky-200" />
          </button>

          {hasUnsyncedLocalData && (
            <button
              type="button"
              onClick={onSyncLocal}
              className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 shadow-xs transition hover:bg-amber-400 whitespace-nowrap"
            >
              <Cloud className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">مزامنة البيانات</span>
              <span className="xl:hidden">مزامنة</span>
            </button>
          )}

          <span aria-hidden="true" className={`${styles.verticalDivider} hidden sm:block`} />

          {/* Notifications Bell */}
          <div ref={notifRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowNotif((prev) => !prev);
                setShowUserMenu(false);
              }}
              aria-label="الإشعارات والتنبيهات"
              aria-expanded={showNotif}
              className={styles.circleIconBtn}
            >
              <Bell className="h-4 w-4 text-white" />
              {notifications.length > 0 && (
                <span className="font-mono-num tabular-nums absolute -top-1 -left-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-[#051d42] bg-[#DC2626] px-1 text-[10px] font-extrabold leading-none text-white shadow-sm">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute left-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-2xl sm:w-80">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-[#0A2C52]">
                    إشعارات النظام ({getMonthLabel(filter.month)} {filter.year})
                  </span>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearNotifications}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-[#0B4F93] transition hover:bg-red-50 hover:text-[#C8232C]"
                        title="مسح جميع الإشعارات"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>مسح الإشعارات</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotif(false)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
                {notifications.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500">
                    لا توجد إشعارات غير مقروءة حالياً.
                  </div>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="group flex items-start gap-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-right transition hover:bg-blue-50"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onDismissNotification(n.id);
                            if (n.targetTab) onNavigateTab(n.targetTab);
                            setShowNotif(false);
                          }}
                          className="flex min-w-0 flex-1 items-start gap-2 text-right"
                        >
                          {n.type === 'warning' ? (
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          ) : n.type === 'success' ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          ) : (
                            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#0B4F93]" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-800">{n.title}</div>
                            <div className="text-[11px] text-slate-600">{n.detail}</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismissNotification(n.id)}
                          aria-label={`تحديد إشعار "${n.title}" كمقروء وإخفاؤه`}
                          title="تمت القراءة (إخفاء)"
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-white hover:text-slate-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <span aria-hidden="true" className={`${styles.verticalDivider} hidden sm:block`} />

          {/* User Profile Dropdown */}
          <div ref={userMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu((prev) => !prev);
                setShowNotif(false);
              }}
              aria-expanded={showUserMenu}
              className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-1 text-right transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 sm:pr-2"
            >
              <div className="hidden text-left sm:block">
                <div className="max-w-[135px] truncate text-xs font-extrabold leading-tight text-white lg:max-w-[175px]">
                  {actorName}
                </div>
                <div className="flex items-center justify-end gap-1.5 text-[10px] font-medium text-blue-100/85">
                  <span>{ROLE_LABELS[activeRole]}</span>
                  <span aria-hidden="true" className="text-sky-300/60">
                    ·
                  </span>
                  {isCloudMode ? (
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                      />
                      <span>Firebase متصل</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-300">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-amber-400"
                      />
                      <span>وضع محلي</span>
                    </span>
                  )}
                </div>
              </div>

              <ChevronDown className="hidden h-3.5 w-3.5 text-blue-100/85 sm:block" />

              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={actorName}
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 shrink-0 rounded-full border border-sky-200/50 object-cover shadow-xs"
                />
              ) : (
                <div className={styles.circleIconBtn}>
                  <UserIcon className="h-4.5 w-4.5 text-white" />
                </div>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute left-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-2xl">
                <div className="mb-2 border-b border-slate-100 pb-2">
                  <div className="text-xs font-bold text-[#0A2C52]">{actorName}</div>
                  <div className="text-[11px] text-slate-500">
                    {user?.email || 'جلسة محلية — سجل الدخول للحفظ السحابي الدائم'}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold">
                    {isCloudMode && firebaseOnline ? (
                      <>
                        <Cloud className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">متصل بقاعدة بيانات Firebase</span>
                      </>
                    ) : (
                      <>
                        <CloudOff className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-amber-700">تخزين محلي مؤقت بالمتصفح</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSignOut();
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSignIn();
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B4F93] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#083c72]"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>تسجيل الدخول بحساب Google (Firebase)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab('settings');
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    إدارة الصلاحيات وسجل التعديلات
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Mobile/Small-Tablet Filter Strip (shown only below md so filters stay reachable on all viewports) */}
      <div className="relative z-10 grid grid-cols-2 gap-2 border-t border-sky-400/15 px-3 py-2 md:hidden">
        {renderPeriodFilterPill(true)}
        {renderLocationFilterPill(true)}
      </div>

      {/* Luminous Corporate Blue Bottom Border Hairline */}
      <div aria-hidden="true" className={styles.bottomGlowLine} />
    </header>
  );
};
