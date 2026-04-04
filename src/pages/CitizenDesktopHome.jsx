import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext.jsx';
import ComplaintForm from './ComplaintForm.jsx';
import {
  PlusCircle, Clock, CheckCircle2, XCircle,
  MapPin, ChevronRight, FileText, BarChart2,
} from 'lucide-react';
import { translateStatus } from '../utils/i18nHelpers.js';

const STATUS_CONFIG = {
  Pending: { color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
  'In Progress': { color: '#3B82F6', bg: '#EFF6FF', icon: BarChart2 },
  Resolved: { color: '#10B981', bg: '#ECFDF5', icon: CheckCircle2 },
  Rejected: { color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
};

function StatusPill({ status }) {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[status] ?? { color: '#6B7280', bg: '#F3F4F6', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon className="w-3 h-3" />
      {translateStatus(t, status)}
    </span>
  );
}

export default function CitizenDesktopHome({ onViewAll, highlightForm }) {
  const { t } = useTranslation();
  const { complaints } = useApp();

  const formRef = useRef(null);
  const [formHighlighted, setFormHighlighted] = useState(false);

  useEffect(() => {
    if (!highlightForm) return;
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFormHighlighted(true);
    const timeoutId = setTimeout(() => setFormHighlighted(false), 1800);
    return () => clearTimeout(timeoutId);
  }, [highlightForm]);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((complaint) => complaint.status === 'Pending').length,
    inProgress: complaints.filter((complaint) => complaint.status === 'In Progress').length,
    resolved: complaints.filter((complaint) => complaint.status === 'Resolved').length,
  };

  const recent = complaints.slice(0, 5);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div
        className="rounded-2xl px-6 py-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, var(--cs-accent) 0%, #1e40af 100%)' }}
      >
        <div>
          <p className="text-blue-200 text-sm font-medium mb-1">{t('dashboardCitizen.portalBadge')}</p>
          <h2 className="text-white text-xl font-bold">{t('dashboardCitizen.heroTitle')}</h2>
          <p className="text-blue-200 text-sm mt-1">
            {t('dashboardCitizen.heroSubtitle')}
          </p>
        </div>
        <button
          onClick={() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setFormHighlighted(true);
            setTimeout(() => setFormHighlighted(false), 1800);
          }}
          id="new-complaint-banner"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 flex-shrink-0"
          style={{ background: '#fff', color: 'var(--cs-accent)', border: 'none', cursor: 'pointer' }}
        >
          <PlusCircle className="w-4 h-4" />
          {t('dashboardCitizen.fileComplaint')}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('dashboardCitizen.stats.totalFiled'), value: stats.total, color: '#6366F1', bg: '#EEF2FF', icon: FileText },
          { label: t('statuses.pending'), value: stats.pending, color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
          { label: t('statuses.inProgress'), value: stats.inProgress, color: '#3B82F6', bg: '#EFF6FF', icon: BarChart2 },
          { label: t('statuses.resolved'), value: stats.resolved, color: '#10B981', bg: '#ECFDF5', icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4 border"
            style={{ background: 'var(--cs-card)', borderColor: 'var(--cs-border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--cs-ink)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl border" style={{ background: 'var(--cs-card)', borderColor: 'var(--cs-border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--cs-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{t('dashboardCitizen.recentComplaints')}</h3>
            <button
              onClick={onViewAll}
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--cs-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              id="view-all-complaints"
            >
              {t('dashboardCitizen.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--cs-border)' }}>
            {recent.length > 0 ? (
              recent.map((complaint) => (
                <div key={complaint.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--cs-ink)' }}>
                      {complaint.description || t('dashboardCitizen.noDescription')}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--cs-muted)' }} />
                      <p className="text-xs truncate" style={{ color: 'var(--cs-muted)' }}>
                        {complaint.address || t('dashboardCitizen.locationPending')}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={complaint.status} />
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--cs-ink)' }}>
                  {t('dashboardCitizen.emptyTitle')}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>
                  {t('dashboardCitizen.emptySubtitle')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          ref={formRef}
          className="rounded-2xl border transition-all duration-300"
          style={{
            background: 'var(--cs-card)',
            borderColor: formHighlighted ? 'var(--cs-accent)' : 'var(--cs-border)',
            boxShadow: formHighlighted ? '0 0 0 3px rgba(29,78,216,0.15)' : 'none',
          }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--cs-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{t('dashboardCitizen.quickSubmitTitle')}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>
              {t('dashboardCitizen.quickSubmitSubtitle')}
            </p>
          </div>

          <ComplaintForm mode="desktop" embedded />
        </div>
      </div>
    </div>
  );
}
