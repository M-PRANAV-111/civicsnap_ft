import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  ArrowLeft, MapPin, Clock, Star, CheckCircle2,
  XCircle, AlertCircle, Image, ExternalLink
} from 'lucide-react';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

const STATUS_ICONS = {
  'Pending': AlertCircle,
  'In Progress': Clock,
  'Resolved': CheckCircle2,
  'Rejected': XCircle,
};

const STATUS_COLORS = {
  'Pending': 'text-amber-600',
  'In Progress': 'text-blue-600',
  'Resolved': 'text-emerald-600',
  'Rejected': 'text-red-600',
};

const TIMELINE_DOT = {
  'Pending': 'border-amber-400',
  'In Progress': 'border-blue-400',
  'Resolved': 'border-emerald-400',
  'Rejected': 'border-red-400',
};

export default function ComplaintDetails() {
  const { id } = useParams();
  const { complaints } = useApp();
  const navigate = useNavigate();

  const complaint = complaints.find((c) => c.id === id);

  if (!complaint) {
    return (
      <div className="screen bg-cs-bg items-center justify-center gap-4">
        <XCircle className="w-10 h-10 text-red-400" />
        <p className="text-cs-muted text-sm">Complaint not found</p>
        <button onClick={() => navigate('/status')} className="btn-secondary w-auto px-6">Go Back</button>
      </div>
    );
  }

  const mapsUrl = complaint.location
    ? `https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}` : null;

  return (
    <div className="screen bg-cs-bg">
      <div className="page-header">
        <button onClick={() => navigate('/status')} className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="page-title">{complaint.id}</span>
        <div className="w-9" />
      </div>

      <div className="scrollable">
        <div className="flex flex-col gap-4 px-4 py-4 bottom-safe">
          {/* Image */}
          {complaint.image ? (
            <div className="w-full h-48 rounded-2xl overflow-hidden border border-cs-border shadow-card">
              <img src={complaint.image} alt="complaint" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-36 rounded-2xl bg-cs-subtle border border-cs-border flex flex-col items-center justify-center gap-2">
              <Image className="w-7 h-7 text-cs-muted/30" />
              <p className="text-cs-muted/50 text-xs">No image available</p>
            </div>
          )}

          {/* Status + Category */}
          <div className="flex items-center justify-between">
            <StatusBadge status={complaint.status} />
            <span className="text-xs bg-cs-subtle text-cs-muted px-3 py-1.5 rounded-full border border-cs-border">
              {complaint.category}
            </span>
          </div>

          {/* Description */}
          <div className="card">
            <p className="text-cs-muted text-xs font-medium uppercase tracking-wide mb-2">Description</p>
            <p className="text-cs-ink text-sm leading-relaxed">
              {complaint.description || 'No description provided'}
            </p>
          </div>

          {/* Location */}
          <div className="card flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-cs-accent" />
            </div>
            <div className="flex-1">
              <p className="text-cs-muted text-xs font-medium uppercase tracking-wide mb-0.5">Location</p>
              <p className="text-cs-ink text-sm">{complaint.address}</p>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer"
                  className="text-cs-accent text-xs font-medium flex items-center gap-1 mt-1 hover:underline">
                  Open in Maps <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Rejection reason */}
          {complaint.status === 'Rejected' && complaint.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <p className="text-red-700 text-sm font-semibold">Rejection Reason</p>
              </div>
              <p className="text-red-700/80 text-sm">{complaint.rejectionReason}</p>
            </div>
          )}

          {/* Resolution note */}
          {complaint.status === 'Resolved' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-emerald-700 text-sm font-semibold">Issue Resolved</p>
              </div>
              <p className="text-emerald-700/80 text-sm">
                {complaint.resolutionProof ? 'Resolution proof available.' : 'Marked as resolved by assigned officer.'}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-cs-muted text-xs font-semibold uppercase tracking-wide mb-3">Timeline</p>
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />
              {complaint.timeline.map((event, idx) => {
                const Icon = STATUS_ICONS[event.status] || AlertCircle;
                const colorClass = STATUS_COLORS[event.status] || 'text-cs-muted';
                const dotBorder = TIMELINE_DOT[event.status] || 'border-cs-border';
                return (
                  <div key={idx} className="relative mb-4 last:mb-0">
                    <div className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full bg-cs-card border-2 ${dotBorder}`} />
                    <div className="card-sm ml-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                        <span className={`text-xs font-semibold ${colorClass}`}>{event.status}</span>
                      </div>
                      <p className="text-cs-muted text-xs">{event.note}</p>
                      <p className="text-cs-muted/50 text-xs mt-1">{formatDateTime(event.time)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review CTA */}
          {complaint.status === 'Resolved' && (
            <button onClick={() => navigate(`/review/${complaint.id}`)} className="btn-primary" id="review-btn">
              <Star className="w-4 h-4" /> Leave a Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
