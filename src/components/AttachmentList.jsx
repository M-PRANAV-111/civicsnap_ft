import { ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';
import { buildImageUrl } from '../context/AppContext.jsx';

export default function AttachmentList({ attachments = [], title = 'Attachments' }) {
  if (!attachments.length) return null;

  return (
    <div className="card">
      <p className="text-cs-muted text-xs font-medium uppercase tracking-wide mb-3">{title}</p>
      <div className="grid grid-cols-1 gap-3">
        {attachments.map((attachment) => {
          const fileUrl = attachment.url || buildImageUrl(attachment.fileUrl);
          const isImage = attachment.fileType === 'image';

          return (
            <a
              key={attachment.id || attachment.fileUrl}
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border p-3 flex items-center gap-3 transition-colors hover:bg-cs-subtle"
              style={{ borderColor: 'var(--cs-border)' }}
            >
              {isImage ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border flex items-center justify-center" style={{ borderColor: 'var(--cs-border)' }}>
                  {fileUrl ? (
                    <img src={fileUrl} alt={attachment.fileName} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5" style={{ color: 'var(--cs-muted)' }} />
                  )}
                </div>
              ) : (
                <div
                  className="w-16 h-16 rounded-xl border flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FEF3C7', borderColor: '#FDE68A' }}
                >
                  <FileText className="w-7 h-7" style={{ color: '#B45309' }} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--cs-ink)' }}>
                  {attachment.fileName || 'Attachment'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>
                  {isImage ? 'Image attachment' : 'PDF attachment'}
                </p>
              </div>

              <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--cs-muted)' }} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
