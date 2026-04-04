import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext.jsx';
import InstallCornerButton from '../components/InstallCornerButton.jsx';
import AppLogo from '../components/AppLogo.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import {
  LayoutDashboard, ClipboardList, BarChart2,
  Shield, LogOut, PlusCircle
} from 'lucide-react';
import OfficerDashboard from './OfficerDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import HeatmapScreen from './HeatmapScreen.jsx';
import ComplaintStatus from './ComplaintStatus.jsx';
import CitizenDesktopHome from './CitizenDesktopHome.jsx';

const NAV_ITEMS_CITIZEN = [
  { key: 'citizen-home', labelKey: 'desktopLayout.citizenDashboard', icon: LayoutDashboard },
  { key: 'citizen-complaints', labelKey: 'desktopLayout.citizenComplaints', icon: ClipboardList },
];

const NAV_ITEMS_OFFICER = [
  { key: 'officer', labelKey: 'desktopLayout.officerDashboard', icon: LayoutDashboard },
  { key: 'status', labelKey: 'desktopLayout.allComplaints', icon: ClipboardList },
  { key: 'heatmap', labelKey: 'desktopLayout.analytics', icon: BarChart2 },
];

const NAV_ITEMS_ADMIN = [
  { key: 'admin', labelKey: 'desktopLayout.adminPanel', icon: Shield },
  { key: 'officer', labelKey: 'desktopLayout.officerView', icon: LayoutDashboard },
  { key: 'status', labelKey: 'desktopLayout.complaints', icon: ClipboardList },
  { key: 'heatmap', labelKey: 'desktopLayout.analytics', icon: BarChart2 },
];

export default function DesktopLayout({ page }) {
  const { t } = useTranslation();
  const { authUser, logoutDesktop, isAdminLoggedIn, isCitizenLoggedIn } = useApp();
  const navigate = useNavigate();

  const navItems = isCitizenLoggedIn
    ? NAV_ITEMS_CITIZEN
    : isAdminLoggedIn
    ? NAV_ITEMS_ADMIN
    : NAV_ITEMS_OFFICER;

  const defaultPage = isCitizenLoggedIn
    ? 'citizen-home'
    : isAdminLoggedIn
    ? 'admin'
    : 'officer';

  const [activePage, setActivePage] = useState(page || defaultPage);
  const [highlightFormCount, setHighlightFormCount] = useState(0);

  const triggerFormHighlight = () => {
    if (activePage !== 'citizen-home') {
      setActivePage('citizen-home');
      setTimeout(() => setHighlightFormCount((count) => count + 1), 100);
    } else {
      setHighlightFormCount((count) => count + 1);
    }
  };

  const handleLogout = () => {
    logoutDesktop();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'citizen-home':
        return <CitizenDesktopHome onViewAll={() => setActivePage('citizen-complaints')} highlightForm={highlightFormCount} />;
      case 'citizen-complaints':
        return <ComplaintStatus />;
      case 'admin':
        return <AdminDashboard />;
      case 'officer':
        return <OfficerDashboard desktop />;
      case 'heatmap':
        return <HeatmapScreen />;
      case 'status':
        return <ComplaintStatus />;
      default:
        return isCitizenLoggedIn
          ? <CitizenDesktopHome onViewAll={() => setActivePage('citizen-complaints')} highlightForm={highlightFormCount} />
          : <OfficerDashboard desktop />;
    }
  };

  const roleBadge = () => {
    if (authUser?.role === 'admin') return { label: t('desktopLayout.administrator'), cls: 'bg-purple-50 text-purple-700' };
    if (authUser?.role === 'officer') return { label: t('desktopLayout.fieldOfficer'), cls: 'bg-blue-50 text-cs-accent' };
    return { label: t('desktopLayout.citizen'), cls: 'bg-emerald-50 text-emerald-700' };
  };

  const activeLabel = navItems.find((item) => item.key === activePage)?.labelKey;
  const badge = roleBadge();

  return (
    <div className="desktop-layout animate-fade-in">
      <aside className="desktop-sidebar">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-cs-border">
          <AppLogo
            imageClassName="h-10 w-auto flex-shrink-0"
            titleClassName="text-cs-ink font-semibold text-base tracking-tight"
          />
        </div>

        <div className="px-4 py-4 border-b border-cs-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cs-accent/10 flex items-center justify-center text-cs-accent font-semibold text-sm flex-shrink-0">
              {authUser?.name?.charAt(0) ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-cs-ink font-medium text-sm truncate">{authUser?.name ?? t('desktopLayout.userFallback')}</p>
              <p className="text-cs-muted text-xs truncate">{authUser?.dept ?? ''}</p>
            </div>
          </div>
          <span className={`mt-2.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <nav className="flex-1 py-3 px-2">
          <p className="text-cs-muted/60 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">{t('common.navigation')}</p>
          {navItems.map(({ key, labelKey, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActivePage(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all duration-150 text-left
                ${activePage === key
                  ? 'bg-cs-accent text-white shadow-cs-accent/20 shadow-sm'
                  : 'text-cs-muted hover:text-cs-ink hover:bg-cs-subtle'}`}
              id={`nav-${key}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-cs-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-cs-muted hover:text-red-600 hover:bg-red-50 transition-all duration-150"
            id="desktop-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('common.signOut')}</span>
          </button>
        </div>
      </aside>

      <main className="desktop-main overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-cs-card border-b border-cs-border flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-cs-ink">
              {activeLabel ? t(activeLabel) : t('common.dashboard')}
            </h1>
            <p className="text-cs-muted text-xs mt-0.5">
              {new Date().toLocaleDateString(t('common.systemDateLocale'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <InstallCornerButton label={t('install.installApp')} />
            {isCitizenLoggedIn && (
              <button
                onClick={triggerFormHighlight}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150"
                style={{ background: 'var(--cs-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
                id="new-complaint-topbar"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {t('common.newComplaint')}
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-cs-muted bg-cs-subtle border border-cs-border rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t('common.systemOnline')}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
