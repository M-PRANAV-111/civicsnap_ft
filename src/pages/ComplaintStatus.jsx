import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  Menu,
  Plus,
  Star,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import ComplaintCard from '../components/ComplaintCard.jsx';
import AttachmentList from '../components/AttachmentList.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  formatLocalizedDate,
  formatLocalizedDateTime,
  translateCategory,
  translateStatus,
} from '../utils/i18nHelpers.js';

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];

const STATUS_ICONS = {
  Pending: AlertCircle,
  'In Progress': Clock,
  Resolved: CheckCircle2,
  Rejected: XCircle,
};

const STATUS_COLORS = {
  Pending: '#D97706',
  'In Progress': '#1D4ED8',
  Resolved: '#059669',
  Rejected: '#DC2626',
};

const TIMELINE_DOT = {
  Pending: '#FCD34D',
  'In Progress': '#60A5FA',
  Resolved: '#34D399',
  Rejected: '#F87171',
};

function ComplaintDetailPanel({ complaint, onClose, canReview }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  if (!complaint) return null;

  const timeline = complaint.timeline || [];
  const mapsUrl = complaint.mapsLink || (complaint.location ? `https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}` : null);

  return (
    <div
      className="w-96 flex-shrink-0 border-l overflow-y-auto flex flex-col"
      style={{ background: 'var(--cs-card)', borderColor: 'var(--cs-border)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--cs-border)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{complaint.id}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>{translateCategory(t, complaint.category)}</p>
        </div>
        <button type="button" onClick={onClose} className="btn-ghost w-8 h-8 p-0 justify-center rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {complaint.image ? (
          <img
            src={complaint.image}
            alt={t('complaintStatus.detail.imageAlt')}
            className="w-full h-36 object-cover rounded-xl border"
            style={{ borderColor: 'var(--cs-border)' }}
          />
        ) : (
          <div
            className="w-full h-28 rounded-xl border flex flex-col items-center justify-center gap-2"
            style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}
          >
            <ClipboardList className="w-7 h-7" style={{ color: 'rgba(75,85,99,0.3)' }} />
            <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>{t('complaintStatus.detail.noImage')}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={complaint.status} />
          <div className="flex items-center gap-2">
            {complaint.syncStatus === 'queued' && (
              <span
                className="text-[11px] px-2 py-1 rounded-full border font-medium"
                style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}
              >
                {t('complaintStatus.savedLocally')}
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>
              {formatLocalizedDate(complaint.submittedAt, i18n, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--cs-muted)' }}>
            {t('complaintStatus.detail.description')}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--cs-ink)' }}>
            {complaint.description || t('complaintStatus.detail.noDescription')}
          </p>
        </div>

        <AttachmentList attachments={complaint.attachments} />

        <div className="card flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
            <MapPin className="w-4 h-4" style={{ color: 'var(--cs-accent)' }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--cs-muted)' }}>
              {t('complaintStatus.detail.location')}
            </p>
            <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>{complaint.address}</p>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium flex items-center gap-1 mt-1"
                style={{ color: 'var(--cs-accent)' }}
              >
                {t('complaintStatus.detail.openMaps')} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {complaint.status === 'Rejected' && complaint.rejectionReason && (
          <div className="rounded-xl p-3 border border-red-200" style={{ background: '#FEF2F2' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-700">{t('complaintStatus.detail.rejectionReason')}</span>
            </div>
            <p className="text-xs text-red-700/80">{complaint.rejectionReason}</p>
          </div>
        )}

        {complaint.status === 'Resolved' && (
          <div className="rounded-xl p-3 border border-emerald-200" style={{ background: '#ECFDF5' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">{t('complaintStatus.detail.resolution')}</span>
            </div>
            {complaint.resolutionProofUrl ? (
              <img
                src={complaint.resolutionProofUrl}
                alt={t('complaintStatus.detail.resolutionProofAlt')}
                className="w-full h-32 rounded-xl object-cover border"
                style={{ borderColor: '#A7F3D0' }}
              />
            ) : (
              <p className="text-xs" style={{ color: '#065F46' }}>{t('complaintStatus.detail.markedResolved')}</p>
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--cs-muted)' }}>
            {t('complaintStatus.detail.timeline')}
          </p>
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-0 bottom-0 w-px" style={{ background: 'var(--cs-border)' }} />
            {timeline.map((event, index) => {
              const Icon = STATUS_ICONS[event.status] || AlertCircle;
              const color = STATUS_COLORS[event.status] || '#6B7280';
              const dot = TIMELINE_DOT[event.status] || '#D1D5DB';

              return (
                <div key={`${event.time}-${index}`} className="relative mb-4 last:mb-0">
                  <div
                    className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2"
                    style={{ background: '#fff', borderColor: dot }}
                  />
                  <div className="card-sm ml-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="text-xs font-semibold" style={{ color }}>{translateStatus(t, event.status)}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>{event.note}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(75,85,99,0.5)' }}>
                      {formatLocalizedDateTime(event.time, i18n, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {complaint.status === 'Resolved' && canReview && (
          <button type="button" onClick={() => navigate(`/review/${complaint.id}`)} className="btn-primary">
            <Star className="w-4 h-4" /> {t('complaintStatus.detail.leaveReview')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ComplaintStatus() {
  const { t } = useTranslation();
  const {
    authUser,
    complaints,
    complaintsLoaded,
    fetchComplaints,
    setSidebarOpen,
    token,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const shouldFetchCitizenComplaints = Boolean(token && authUser?.role === 'citizen');

  const loadComplaintList = async () => {
    setLoading(true);
    setLoadError('');

    try {
      await fetchComplaints();
    } catch (error) {
      setLoadError(error.message || t('complaintStatus.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!shouldFetchCitizenComplaints) return;

    if (!complaintsLoaded) {
      loadComplaintList();
    }
  }, [complaintsLoaded, shouldFetchCitizenComplaints]);

  useEffect(() => {
    if (!location.state?.complaintId || window.innerWidth < 768) return;

    const matchedComplaint = complaints.find((complaint) => complaint.id === location.state.complaintId);
    if (matchedComplaint) {
      setSelectedComplaint(matchedComplaint);
    }
  }, [complaints, location.state]);

  const filteredComplaints =
    activeFilter === 'All'
      ? complaints
      : complaints.filter((complaint) => complaint.status === activeFilter);

  const handleReportIssue = () => {
    navigate(window.innerWidth >= 768 ? '/dashboard' : '/camera');
  };

  const handleCardClick = (complaint) => {
    if (window.innerWidth >= 768) {
      setSelectedComplaint(complaint);
      return;
    }

    navigate(`/complaint/${complaint.id}`);
  };

  const filterLabel = (filter) => {
    if (filter === 'All') return t('complaintStatus.filters.all');
    return translateStatus(t, filter);
  };

  return (
    <div className="flex h-full" style={{ background: 'var(--cs-bg)' }}>
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <div className="page-header">
          <button
            type="button"
            onClick={() => setSidebarOpen?.(true)}
            className="btn-ghost w-9 h-9 rounded-xl p-0 justify-center"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="page-title">{t('complaintStatus.title')}</span>
          <button type="button" className="btn-ghost w-9 h-9 rounded-xl p-0 justify-center">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-3 px-4 pt-4 pb-2 flex-shrink-0">
          {[
            { label: t('complaintStatus.summary.total'), count: complaints.length, color: 'var(--cs-ink)', bg: '#FFFFFF' },
            { label: t('statuses.pending'), count: complaints.filter((complaint) => complaint.status === 'Pending').length, color: '#B45309', bg: '#FFFBEB' },
            { label: t('statuses.resolved'), count: complaints.filter((complaint) => complaint.status === 'Resolved').length, color: '#065F46', bg: '#ECFDF5' },
          ].map(({ label, count, color, bg }) => (
            <div
              key={label}
              className="flex-1 rounded-xl p-3 text-center border shadow-card"
              style={{ background: bg, borderColor: 'var(--cs-border)' }}
            >
              <p className="text-xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 px-4 py-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setActiveFilter(filter);
                setSelectedComplaint(null);
              }}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all"
              style={
                activeFilter === filter
                  ? { background: 'var(--cs-accent)', color: '#fff', borderColor: 'var(--cs-accent)' }
                  : { background: '#fff', color: 'var(--cs-muted)', borderColor: 'var(--cs-border)' }
              }
            >
              {filterLabel(filter)}
            </button>
          ))}
        </div>

        <div className="scrollable px-4 pb-4 flex flex-col gap-2.5 pt-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <LoaderPlaceholder />
              <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>{t('complaintStatus.loading')}</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <AlertCircle className="w-8 h-8" style={{ color: '#DC2626' }} />
              <div className="text-center">
                <p className="font-medium text-sm" style={{ color: 'var(--cs-ink)' }}>{t('complaintStatus.loadErrorTitle')}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>{loadError}</p>
              </div>
              <button type="button" onClick={loadComplaintList} className="btn-secondary w-auto px-6">
                {t('complaintStatus.retry')}
              </button>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div
                className="w-14 h-14 rounded-full border flex items-center justify-center"
                style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}
              >
                <ClipboardList className="w-7 h-7" style={{ color: 'rgba(75,85,99,0.4)' }} />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm" style={{ color: 'var(--cs-ink)' }}>{t('complaintStatus.emptyTitle')}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>{t('complaintStatus.emptySubtitle')}</p>
              </div>
              <button type="button" onClick={handleReportIssue} className="btn-primary w-auto px-6 py-3">
                <Plus className="w-4 h-4" /> {t('complaintStatus.reportIssue')}
              </button>
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onClick={handleCardClick}
                footer={
                  complaint.syncStatus === 'queued' ? (
                    <span
                      className="text-[11px] px-2 py-1 rounded-full border font-medium w-fit"
                      style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}
                    >
                      {t('complaintStatus.savedLocallyRetry')}
                    </span>
                  ) : null
                }
              />
            ))
          )}
        </div>
      </div>

      {selectedComplaint && (
        <ComplaintDetailPanel
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          canReview={Boolean(token)}
        />
      )}
    </div>
  );
}

function LoaderPlaceholder() {
  return <Clock className="w-8 h-8 animate-pulse" style={{ color: 'var(--cs-accent)' }} />;
}
