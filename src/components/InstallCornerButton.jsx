import { useEffect, useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function InstallCornerButton({
  compact = false,
  label = 'Install App',
  className = '',
  messageAlign = 'right',
}) {
  const { canInstallApp, installApp, installAppHint, installSupportMode } = useApp();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!message) return undefined;

    const timeoutId = window.setTimeout(() => setMessage(''), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  if (!canInstallApp) {
    return null;
  }

  const handleInstall = async () => {
    setBusy(true);
    setMessage('');

    try {
      const result = await installApp();
      if (!result?.success) {
        setMessage(result?.message || installAppHint);
      }
    } finally {
      setBusy(false);
    }
  };

  const buttonStyle = compact
    ? {
        background: 'rgba(0,0,0,0.4)',
        borderColor: 'rgba(255,255,255,0.2)',
        color: '#FFFFFF',
      }
    : {
        background: '#EFF6FF',
        borderColor: '#BFDBFE',
        color: 'var(--cs-accent)',
      };

  return (
    <div className={`relative ${className}`.trim()}>
      <button
        type="button"
        onClick={handleInstall}
        disabled={busy}
        className={
          compact
            ? 'w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center disabled:opacity-60'
            : 'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border disabled:opacity-60'
        }
        style={buttonStyle}
        id={compact ? 'install-app-corner' : 'install-app-button'}
        title="Install CivicSnap App"
      >
        <ArrowDownToLine className="w-4 h-4" />
        {!compact && <span>{busy ? 'Opening...' : installSupportMode === 'prompt' ? label : 'How to Install'}</span>}
      </button>

      {message && (
        <div
          className="absolute top-full mt-2 min-w-[12rem] max-w-[16rem] rounded-xl border px-3 py-2 text-xs leading-relaxed shadow-lg z-20"
          style={{
            background: '#FFFFFF',
            borderColor: 'var(--cs-border)',
            color: 'var(--cs-muted)',
            [messageAlign]: 0,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
