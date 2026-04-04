import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StatusBadge from './StatusBadge.jsx';
import { buildImageUrl } from '../context/AppContext.jsx';
import { formatLocalizedDate, translateCategory } from '../utils/i18nHelpers.js';

function ComplaintCardBody({ complaint }) {
  const { t, i18n } = useTranslation();
  const thumbnail = complaint.image || buildImageUrl(complaint.imageUrl);

  return (
    <>
      <div
        className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center border"
        style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}
      >
        {thumbnail ? (
          <img src={thumbnail} alt={t('complaintCard.imageAlt')} className="w-full h-full object-cover" />
        ) : (
          <Image className="w-5 h-5" style={{ color: 'rgba(75,85,99,0.4)' }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--cs-accent)' }}>
            {complaint.id}
          </span>
          <StatusBadge status={complaint.status} />
        </div>
        <p className="text-sm font-medium leading-snug mb-1.5 line-clamp-2" style={{ color: 'var(--cs-ink)' }}>
          {complaint.description || t('complaintCard.noDescription')}
        </p>
        <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--cs-muted)' }}>
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{complaint.address || t('complaintCard.locationPending')}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs" style={{ color: 'rgba(75,85,99,0.6)' }}>
            {complaint.submittedAt
              ? formatLocalizedDate(complaint.submittedAt, i18n, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : t('complaintCard.justNow')}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{
              color: 'var(--cs-muted)',
              background: 'var(--cs-subtle)',
              borderColor: 'var(--cs-border)',
            }}
          >
            {translateCategory(t, complaint.category)}
          </span>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: 'var(--cs-border)' }} />
    </>
  );
}

export default function ComplaintCard({ complaint, onClick, actions = null, footer = null }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(complaint);
      return;
    }

    navigate(`/complaint/${complaint.id}`);
  };

  if (actions || footer) {
    return (
      <div className="card w-full text-left">
        <button type="button" onClick={handleClick} className="w-full text-left flex gap-3 items-start">
          <ComplaintCardBody complaint={complaint} />
        </button>

        {(actions || footer) && (
          <div className="mt-3 pt-3 border-t flex flex-col gap-3" style={{ borderColor: 'var(--cs-border)' }}>
            {footer}
            {actions}
          </div>
        )}
      </div>
    );
  }

  return (
    <button type="button" onClick={handleClick} className="card w-full text-left flex gap-3 items-start">
      <ComplaintCardBody complaint={complaint} />
    </button>
  );
}
