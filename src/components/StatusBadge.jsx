import { useTranslation } from 'react-i18next';
import { translateStatus } from '../utils/i18nHelpers.js';

const STATUS_CONFIG = {
  'Pending':     { className: 'badge-pending',    dot: 'bg-amber-400' },
  'In Progress': { className: 'badge-inprogress', dot: 'bg-blue-500' },
  'Resolved':    { className: 'badge-resolved',   dot: 'bg-emerald-500' },
  'Rejected':    { className: 'badge-rejected',   dot: 'bg-red-500' },
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
  return (
    <span className={`${config.className} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {translateStatus(t, status)}
    </span>
  );
}
