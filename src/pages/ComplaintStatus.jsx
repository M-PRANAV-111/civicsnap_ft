import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import ComplaintCard from '../components/ComplaintCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { Menu, Filter, ClipboardList, Plus, ArrowLeft, MapPin, Clock, X,
  AlertCircle, CheckCircle2, XCircle, ExternalLink, Star } from 'lucide-react';

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];

const STATUS_ICONS = { Pending: AlertCircle, 'In Progress': Clock, Resolved: CheckCircle2, Rejected: XCircle };
const STATUS_COLORS = { Pending: '#D97706', 'In Progress': '#1D4ED8', Resolved: '#059669', Rejected: '#DC2626' };
const TIMELINE_DOT  = { Pending: '#FCD34D', 'In Progress': '#60A5FA', Resolved: '#34D399', Rejected: '#F87171' };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

/** Inline complaint detail panel for desktop */
function ComplaintDetailPanel({ complaint, onClose }) {
  const navigate = useNavigate();
  if (!complaint) return null;
  const mapsUrl = complaint.location
    ? `https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}` : null;

  return (
    <div className="w-96 flex-shrink-0 border-l overflow-y-auto flex flex-col"
      style={{ background: 'var(--cs-card)', borderColor: 'var(--cs-border)' }}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--cs-border)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{complaint.id}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>{complaint.category}</p>
        </div>
        <button onClick={onClose} className="btn-ghost w-8 h-8 p-0 justify-center rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Image */}
        {complaint.image ? (
          <img src={complaint.image} alt="" className="w-full h-36 object-cover rounded-xl border"
            style={{ borderColor: 'var(--cs-border)' }} />
        ) : (
          <div className="w-full h-28 rounded-xl border flex flex-col items-center justify-center gap-2"
            style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
            <ClipboardList className="w-7 h-7" style={{ color: 'rgba(75,85,99,0.3)' }} />
            <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>No image</p>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <StatusBadge status={complaint.status} />
          <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>{formatDate(complaint.submittedAt)}</span>
        </div>

        {/* Description */}
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--cs-muted)' }}>Description</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--cs-ink)' }}>
            {complaint.description || 'No description provided'}
          </p>
        </div>

        {/* Location */}
        <div className="card flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#EFF6FF' }}>
            <MapPin className="w-4 h-4" style={{ color: 'var(--cs-accent)' }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--cs-muted)' }}>Location</p>
            <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>{complaint.address}</p>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="text-xs font-medium flex items-center gap-1 mt-1"
                style={{ color: 'var(--cs-accent)' }}>
                Open Maps <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Rejection */}
        {complaint.status === 'Rejected' && complaint.rejectionReason && (
          <div className="rounded-xl p-3 border border-red-200" style={{ background: '#FEF2F2' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-700">Rejection Reason</span>
            </div>
            <p className="text-xs text-red-700/80">{complaint.rejectionReason}</p>
          </div>
        )}

        {/* Resolution */}
        {complaint.status === 'Resolved' && (
          <div className="rounded-xl p-3 border border-emerald-200" style={{ background: '#ECFDF5' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Issue Resolved</span>
            </div>
            <p className="text-xs" style={{ color: '#065F46' }}>Marked as resolved by assigned officer.</p>
          </div>
        )}

        {/* Timeline */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--cs-muted)' }}>Timeline</p>
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-0 bottom-0 w-px" style={{ background: 'var(--cs-border)' }} />
            {complaint.timeline.map((event, idx) => {
              const Icon = STATUS_ICONS[event.status] || AlertCircle;
              const color = STATUS_COLORS[event.status] || '#6B7280';
              const dot = TIMELINE_DOT[event.status] || '#D1D5DB';
              return (
                <div key={idx} className="relative mb-4 last:mb-0">
                  <div className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2"
                    style={{ background: '#fff', borderColor: dot }} />
                  <div className="card-sm ml-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="text-xs font-semibold" style={{ color }}>{event.status}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>{event.note}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(75,85,99,0.5)' }}>{formatDateTime(event.time)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review CTA */}
        {complaint.status === 'Resolved' && (
          <button onClick={() => navigate(`/review/${complaint.id}`)} className="btn-primary">
            <Star className="w-4 h-4" /> Leave a Review
          </button>
        )}
      </div>
    </div>
  );
}

export default function ComplaintStatus({ onSelectComplaint } = {}) {
  const { complaints, setSidebarOpen } = useApp();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const isMobileView = typeof setSidebarOpen !== 'undefined';

  const filtered = activeFilter === 'All'
    ? complaints
    : complaints.filter(c => c.status === activeFilter);

  const handleCardClick = (complaint) => {
    // Check if we're in desktop layout (no setSidebarOpen from mobile context won't matter here)
    // We use window width to decide: if desktop, show panel; otherwise navigate
    if (window.innerWidth >= 768) {
      setSelectedComplaint(complaint);
    } else {
      navigate(`/complaint/${complaint.id}`);
    }
  };

  return (
    <div className="flex h-full" style={{ background: 'var(--cs-bg)' }}>
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <div className="page-header">
          <button onClick={() => setSidebarOpen?.(true)}
            className="btn-ghost w-9 h-9 rounded-xl p-0 justify-center">
            <Menu className="w-4 h-4" />
          </button>
          <span className="page-title">Complaints</span>
          <button className="btn-ghost w-9 h-9 rounded-xl p-0 justify-center">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 px-4 pt-4 pb-2 flex-shrink-0">
          {[
            { label: 'Total',    count: complaints.length, color: 'var(--cs-ink)',   bg: '#FFFFFF' },
            { label: 'Pending',  count: complaints.filter(c=>c.status==='Pending').length, color:'#B45309', bg:'#FFFBEB' },
            { label: 'Resolved', count: complaints.filter(c=>c.status==='Resolved').length,color:'#065F46', bg:'#ECFDF5' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className="flex-1 rounded-xl p-3 text-center border shadow-card"
              style={{ background: bg, borderColor: 'var(--cs-border)' }}>
              <p className="text-xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setSelectedComplaint(null); }}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all"
              style={activeFilter === f
                ? { background: 'var(--cs-accent)', color: '#fff', borderColor: 'var(--cs-accent)' }
                : { background: '#fff', color: 'var(--cs-muted)', borderColor: 'var(--cs-border)' }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="scrollable px-4 pb-4 flex flex-col gap-2.5 pt-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-full border flex items-center justify-center"
                style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
                <ClipboardList className="w-7 h-7" style={{ color: 'rgba(75,85,99,0.4)' }} />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm" style={{ color: 'var(--cs-ink)' }}>No complaints found</p>
                <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>Try a different filter</p>
              </div>
              <button onClick={() => navigate('/camera')} className="btn-primary w-auto px-6 py-3">
                <Plus className="w-4 h-4" /> Report an Issue
              </button>
            </div>
          ) : (
            filtered.map(c => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                onClick={handleCardClick}
              />
            ))
          )}
        </div>
      </div>

      {/* Desktop detail panel */}
      {selectedComplaint && (
        <ComplaintDetailPanel
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  );
}
