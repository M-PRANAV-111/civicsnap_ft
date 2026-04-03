import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { MapPin, ChevronRight, Image } from 'lucide-react';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ComplaintCard({ complaint, onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(complaint);
    } else {
      navigate(`/complaint/${complaint.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="card w-full text-left flex gap-3 items-start group transition-all duration-150"
      style={{ cursor: 'pointer' }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.transform = '';
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = ''; }}
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center border"
        style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
        {complaint.image ? (
          <img src={complaint.image} alt="complaint" className="w-full h-full object-cover" />
        ) : (
          <Image className="w-5 h-5" style={{ color: 'rgba(75,85,99,0.4)' }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--cs-accent)' }}>{complaint.id}</span>
          <StatusBadge status={complaint.status} />
        </div>
        <p className="text-sm font-medium leading-snug mb-1.5 line-clamp-2" style={{ color: 'var(--cs-ink)' }}>
          {complaint.description || 'No description provided'}
        </p>
        <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--cs-muted)' }}>
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{complaint.address || 'Location pending'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'rgba(75,85,99,0.6)' }}>{formatDate(complaint.submittedAt)}</span>
          <span className="text-xs px-2 py-0.5 rounded-full border"
            style={{ color: 'var(--cs-muted)', background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
            {complaint.category}
          </span>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1 transition-colors"
        style={{ color: 'var(--cs-border)' }} />
    </button>
  );
}
