import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Image,
  MapPin,
  Star,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import AttachmentList from '../components/AttachmentList.jsx';
import { formatLocalizedDateTime, translateCategory, translateStatus } from '../utils/i18nHelpers.js';

const STATUS_ICONS = {
  Pending: AlertCircle,
  'In Progress': Clock,
  Resolved: CheckCircle2,
  Rejected: XCircle,
};

const STATUS_COLORS = {
  Pending: 'text-amber-600',
  'In Progress': 'text-blue-600',
  Resolved: 'text-emerald-600',
  Rejected: 'text-red-600',
};

const TIMELINE_DOT = {
  Pending: 'border-amber-400',
  'In Progress': 'border-blue-400',
  Resolved: 'border-emerald-400',
  Rejected: 'border-red-400',
};

export default function ComplaintDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { complaints, fetchComplaintById, token } = useApp();

  const [complaint, setComplaint] = useState(() => complaints.find((item) => item.id === id) || null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const localComplaint = complaints.find((item) => item.id === id);
    if (localComplaint) {
      setComplaint(localComplaint);
    }
  }, [complaints, id]);

  useEffect(() => {
    if (!id || !token) return;

    let mounted = true;
    setLoading(true);
    setLoadError('');

    fetchComplaintById(id)
      .then((data) => {
        if (mounted && data) {
          setComplaint(data);
        }
      })
      .catch((error) => {
        if (mounted) {
          setLoadError(error.message || t('complaintDetails.errors.loadFailed'));
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [fetchComplaintById, id, t, token]);

  if (loading && !complaint) {
    return (
      <div className="screen bg-cs-bg items-center justify-center gap-4">
        <Clock className="w-8 h-8 animate-pulse text-cs-accent" />
        <p className="text-cs-muted text-sm">{t('complaintDetails.loading')}</p>
      </div>
    );
  }

  if (loadError && !complaint) {
    return (
      <div className="screen bg-cs-bg items-center justify-center gap-4 px-6">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <div className="text-center">
          <p className="text-cs-ink text-sm font-medium">{t('complaintDetails.loadErrorTitle')}</p>
          <p className="text-cs-muted text-xs mt-1">{loadError}</p>
        </div>
        <button type="button" onClick={() => navigate('/status')} className="btn-secondary w-auto px-6">
          {t('complaintDetails.goBack')}
        </button>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="screen bg-cs-bg items-center justify-center gap-4">
        <XCircle className="w-10 h-10 text-red-400" />
        <p className="text-cs-muted text-sm">{t('complaintDetails.notFound')}</p>
        <button type="button" onClick={() => navigate('/status')} className="btn-secondary w-auto px-6">
          {t('complaintDetails.goBack')}
        </button>
      </div>
    );
  }

  const mapsUrl = complaint.mapsLink || (complaint.location ? `https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}` : null);

  return (
    <div className="screen bg-cs-bg">
      <div className="page-header">
        <button type="button" onClick={() => navigate('/status')} className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="page-title">{complaint.id}</span>
        <div className="w-9" />
      </div>

      <div className="scrollable">
        <div className="flex flex-col gap-4 px-4 py-4 bottom-safe">
          {complaint.image ? (
            <div className="w-full h-48 rounded-2xl overflow-hidden border border-cs-border shadow-card">
              <img src={complaint.image} alt={t('complaintDetails.imageAlt')} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-36 rounded-2xl bg-cs-subtle border border-cs-border flex flex-col items-center justify-center gap-2">
              <Image className="w-7 h-7 text-cs-muted/30" />
              <p className="text-cs-muted/50 text-xs">{t('complaintDetails.noImage')}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={complaint.status} />
            <div className="flex items-center gap-2">
              {complaint.syncStatus === 'queued' && (
                <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200">
                  {t('complaintDetails.savedLocally')}
                </span>
              )}
              <span className="text-xs bg-cs-subtle text-cs-muted px-3 py-1.5 rounded-full border border-cs-border">
                {translateCategory(t, complaint.category)}
              </span>
            </div>
          </div>

          <div className="card">
            <p className="text-cs-muted text-xs font-medium uppercase tracking-wide mb-2">{t('complaintDetails.description')}</p>
            <p className="text-cs-ink text-sm leading-relaxed">
              {complaint.description || t('complaintDetails.noDescription')}
            </p>
          </div>

          <AttachmentList attachments={complaint.attachments} />

          <div className="card flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-cs-accent" />
            </div>
            <div className="flex-1">
              <p className="text-cs-muted text-xs font-medium uppercase tracking-wide mb-0.5">{t('complaintDetails.location')}</p>
              <p className="text-cs-ink text-sm">{complaint.address}</p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cs-accent text-xs font-medium flex items-center gap-1 mt-1 hover:underline"
                >
                  {t('complaintDetails.openMaps')} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {complaint.status === 'Rejected' && complaint.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <p className="text-red-700 text-sm font-semibold">{t('complaintDetails.rejectionReason')}</p>
              </div>
              <p className="text-red-700/80 text-sm">{complaint.rejectionReason}</p>
            </div>
          )}

          {complaint.status === 'Resolved' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-emerald-700 text-sm font-semibold">{t('complaintDetails.resolution')}</p>
              </div>
              {complaint.resolutionProofUrl ? (
                <img
                  src={complaint.resolutionProofUrl}
                  alt={t('complaintDetails.resolutionProofAlt')}
                  className="w-full h-40 rounded-xl object-cover border border-emerald-200"
                />
              ) : (
                <p className="text-emerald-700/80 text-sm">{t('complaintDetails.markedResolved')}</p>
              )}
            </div>
          )}

          <div>
            <p className="text-cs-muted text-xs font-semibold uppercase tracking-wide mb-3">{t('complaintDetails.timeline')}</p>
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />
              {(complaint.timeline || []).map((event, index) => {
                const Icon = STATUS_ICONS[event.status] || AlertCircle;
                const colorClass = STATUS_COLORS[event.status] || 'text-cs-muted';
                const dotBorder = TIMELINE_DOT[event.status] || 'border-cs-border';

                return (
                  <div key={`${event.time}-${index}`} className="relative mb-4 last:mb-0">
                    <div className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full bg-cs-card border-2 ${dotBorder}`} />
                    <div className="card-sm ml-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                        <span className={`text-xs font-semibold ${colorClass}`}>{translateStatus(t, event.status)}</span>
                      </div>
                      <p className="text-cs-muted text-xs">{event.note}</p>
                      <p className="text-cs-muted/50 text-xs mt-1">
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

          {complaint.status === 'Resolved' && token && (
            <button type="button" onClick={() => navigate(`/review/${complaint.id}`)} className="btn-primary" id="review-btn">
              <Star className="w-4 h-4" /> {t('complaintDetails.leaveReview')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
