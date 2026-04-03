import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDownToLine, X } from 'lucide-react';
import { isMobileDevice, useApp } from '../context/AppContext.jsx';

const INSTALL_DISMISSED_KEY = 'civicsnap_install_banner_dismissed';
const INSTALL_COMPLETED_KEY = 'civicsnap_install_completed';

function readSessionFlag(key) {
  if (typeof window === 'undefined') return false;

  try {
    return window.sessionStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeSessionFlag(key, value) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // Ignore storage failures so the banner never crashes mobile render.
  }
}

function readLocalFlag(key) {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeLocalFlag(key, value) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // Ignore storage failures so the banner never crashes mobile render.
  }
}

export default function InstallBanner() {
  const { canInstallApp, installApp, installAppHint, installSupportMode, isStandaloneMode } = useApp();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(() => readSessionFlag(INSTALL_DISMISSED_KEY));
  const [installComplete, setInstallComplete] = useState(() => readLocalFlag(INSTALL_COMPLETED_KEY));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const supportedPaths = ['/camera', '/mobile-login'];

  useEffect(() => {
    const handleInstalled = () => {
      writeLocalFlag(INSTALL_COMPLETED_KEY, true);
      setInstallComplete(true);
      setDismissed(true);
      setMessage('');
    };

    window.addEventListener('appinstalled', handleInstalled);
    return () => window.removeEventListener('appinstalled', handleInstalled);
  }, []);

  useEffect(() => {
    if (isStandaloneMode) {
      writeLocalFlag(INSTALL_COMPLETED_KEY, true);
      setInstallComplete(true);
      setDismissed(true);
    }
  }, [isStandaloneMode]);

  if (!isMobileDevice() || !canInstallApp || dismissed || installComplete || !supportedPaths.includes(location.pathname)) {
    return null;
  }

  const handleDismiss = () => {
    writeSessionFlag(INSTALL_DISMISSED_KEY, true);
    setDismissed(true);
  };

  const handleInstall = async () => {
    setBusy(true);
    setMessage('');

    try {
      const result = await installApp();
      const nextMessage = result?.message || installAppHint;

      if (result?.success) {
        writeLocalFlag(INSTALL_COMPLETED_KEY, true);
        setInstallComplete(true);
        setMessage('');
        return;
      }

      setMessage(nextMessage);
      if (nextMessage.toLowerCase().includes('dismissed')) {
        handleDismiss();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pointer-events-none" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      <div
        className="max-w-sm mx-auto rounded-3xl border shadow-2xl px-4 py-4 pointer-events-auto"
        style={{
          background: 'rgba(255,255,255,0.98)',
          borderColor: '#BFDBFE',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>
              Install CivicSnap
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--cs-muted)' }}>
              Install this app for faster access and app-like experience.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--cs-subtle)', color: 'var(--cs-muted)', border: 'none', cursor: 'pointer' }}
            aria-label="Dismiss install banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={handleDismiss}
            className="btn-secondary w-auto px-4 py-3 text-sm"
          >
            Maybe Later
          </button>
          <button
            type="button"
            onClick={handleInstall}
            disabled={busy}
            className="btn-primary flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArrowDownToLine className="w-4 h-4" />
            {busy ? 'Opening...' : installSupportMode === 'prompt' ? 'Install' : 'How to Install'}
          </button>
        </div>

        {message && (
          <p className="text-xs mt-3" style={{ color: 'var(--cs-muted)' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
