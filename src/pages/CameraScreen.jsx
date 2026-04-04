import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext.jsx';
import AppLogo from '../components/AppLogo.jsx';
import {
  AlertTriangle,
  Image,
  Loader2,
  Menu,
  SwitchCamera,
  Upload,
  Zap,
} from 'lucide-react';

function isSecureCameraContext() {
  if (typeof window === 'undefined') return false;

  return (
    window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

function buildCameraError(type, t, detail = '') {
  switch (type) {
    case 'DESKTOP_ONLY':
      return {
        title: t('camera.errors.desktopOnlyTitle'),
        detail: t('camera.errors.desktopOnlyDetail'),
      };
    case 'INSECURE_CONTEXT':
      return {
        title: t('camera.errors.insecureTitle'),
        detail: t('camera.errors.insecureDetail'),
      };
    case 'PERMISSION_DENIED':
      return {
        title: t('camera.errors.permissionTitle'),
        detail: t('camera.errors.permissionDetail'),
      };
    case 'UNSUPPORTED':
      return {
        title: t('camera.errors.unsupportedTitle'),
        detail: t('camera.errors.unsupportedDetail'),
      };
    default:
      return {
        title: t('camera.errors.unavailableTitle'),
        detail: detail || t('camera.errors.unavailableDetail'),
      };
  }
}

function FallbackScreen({ error, onRetry, onUpload, onOpenMenu, allowRetry = true }) {
  const { t } = useTranslation();

  return (
    <div className="screen items-center justify-center px-8 gap-5" style={{ background: 'var(--cs-bg)' }}>
      <div
        className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-5 pb-3"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={onOpenMenu}
          className="w-10 h-10 rounded-full border flex items-center justify-center"
          style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}
        >
          <Menu className="w-4 h-4" style={{ color: 'var(--cs-muted)' }} />
        </button>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{ background: 'var(--cs-card)', borderColor: 'var(--cs-border)' }}
        >
          <AppLogo
            showTitle={false}
            clickable={false}
            imageClassName="h-8 w-auto"
            containerClassName="leading-none"
          />
        </div>
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center text-center gap-5 mt-14">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center border"
          style={{ background: '#FEF3C7', borderColor: '#FDE68A' }}
        >
          <AlertTriangle className="w-10 h-10" style={{ color: '#D97706' }} />
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cs-ink)' }}>
            {error.title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--cs-muted)' }}>
            {error.detail}
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {allowRetry && (
            <button type="button" onClick={onRetry} className="btn-primary w-full">
              {t('camera.retryCamera')}
            </button>
          )}
          <button type="button" onClick={onUpload} className="btn-secondary w-full">
            <Upload className="w-4 h-4" /> {t('camera.uploadInstead')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CameraScreen() {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const readinessIntervalRef = useRef(null);
  const readinessTimeoutRef = useRef(null);
  const startAttemptRef = useRef(0);

  const [facingMode, setFacingMode] = useState('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [flash, setFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileViewport, setMobileViewport] = useState(() => isMobileViewport());

  const { setCapturedImage, setSidebarOpen } = useApp();
  const navigate = useNavigate();

  const clearReadinessWatchers = useCallback(() => {
    if (readinessIntervalRef.current) {
      window.clearInterval(readinessIntervalRef.current);
      readinessIntervalRef.current = null;
    }

    if (readinessTimeoutRef.current) {
      window.clearTimeout(readinessTimeoutRef.current);
      readinessTimeoutRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    clearReadinessWatchers();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [clearReadinessWatchers]);

  const markCameraReady = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return false;

    if (video.readyState < 2 && video.videoWidth === 0 && video.videoHeight === 0) {
      return false;
    }

    clearReadinessWatchers();
    setCameraReady(true);
    setCameraLoading(false);
    setCameraError(null);
    return true;
  }, [clearReadinessWatchers]);

  const startCamera = useCallback(async () => {
    if (!mounted) return;

    const attemptId = startAttemptRef.current + 1;
    startAttemptRef.current = attemptId;
    stopCamera();
    setCameraReady(false);
    setCameraLoading(true);
    setCameraError(null);

    if (!mobileViewport) {
      setCameraLoading(false);
      setCameraError(buildCameraError('DESKTOP_ONLY', t));
      return;
    }

    if (!isSecureCameraContext()) {
      setCameraLoading(false);
      setCameraError(buildCameraError('INSECURE_CONTEXT', t));
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraLoading(false);
      setCameraError(buildCameraError('UNSUPPORTED', t));
      return;
    }

    try {
      if (navigator.permissions?.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' });
          if (permissionStatus?.state === 'denied') {
            setCameraLoading(false);
            setCameraError(buildCameraError('PERMISSION_DENIED', t));
            return;
          }
        } catch {
          // Some mobile browsers do not support querying camera permission.
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (markCameraReady()) {
          return;
        }

        readinessIntervalRef.current = window.setInterval(() => {
          if (startAttemptRef.current !== attemptId) {
            clearReadinessWatchers();
            return;
          }

          markCameraReady();
        }, 250);

        readinessTimeoutRef.current = window.setTimeout(() => {
          if (startAttemptRef.current !== attemptId) {
            return;
          }

          stopCamera();
          setCameraLoading(false);
          setCameraError(
            buildCameraError(
              'CAMERA_UNAVAILABLE',
              t,
              t('camera.errors.previewTimeout'),
            ),
          );
        }, 4000);
      }
    } catch (error) {
      clearReadinessWatchers();
      setCameraLoading(false);
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
        setCameraError(buildCameraError('PERMISSION_DENIED', t));
        return;
      }

      if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
        setCameraError(buildCameraError('CAMERA_UNAVAILABLE', t, t('camera.errors.noDevice')));
        return;
      }

      if (error?.name === 'NotReadableError') {
        setCameraError(buildCameraError('CAMERA_UNAVAILABLE', t, t('camera.errors.inUse')));
        return;
      }

      setCameraError(buildCameraError('CAMERA_UNAVAILABLE', t, error?.message));
    }
  }, [clearReadinessWatchers, facingMode, markCameraReady, mobileViewport, mounted, stopCamera, t]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleResize = () => setMobileViewport(isMobileViewport());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    startCamera();
    return () => stopCamera();
  }, [mounted, startCamera, stopCamera]);

  const handleVideoReady = useCallback(() => {
    markCameraReady();
  }, [markCameraReady]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
    setCapturedImage(dataUrl);
    navigate('/submit');
  };

  const flipCamera = () => {
    setFacingMode((currentMode) => (currentMode === 'environment' ? 'user' : 'environment'));
  };

  const pickFromGallery = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setCapturedImage(loadEvent.target?.result || null);
      requestAnimationFrame(() => navigate('/submit'));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  if (cameraError) {
    return (
      <>
        <FallbackScreen
          error={cameraError}
          onRetry={startCamera}
          onUpload={() => fileInputRef.current?.click()}
          onOpenMenu={() => setSidebarOpen(true)}
          allowRetry={cameraError.title !== t('camera.errors.desktopOnlyTitle')}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={pickFromGallery}
        />
      </>
    );
  }

  return (
    <div className="screen relative bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={handleVideoReady}
        onLoadedData={handleVideoReady}
        onCanPlay={handleVideoReady}
        onPlaying={handleVideoReady}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {flash && <div className="absolute inset-0 bg-white z-20 pointer-events-none camera-flash" />}

      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

      <div
        className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 pb-3"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center"
          id="menu-btn"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5">
          <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-blue-400 animate-pulse' : 'bg-amber-400'}`} />
          <AppLogo
            showTitle={false}
            clickable={false}
            imageClassName="h-8 w-auto brightness-0 invert"
            containerClassName="leading-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setTorchOn((value) => !value)}
          className="w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center"
          style={{
            background: torchOn ? 'rgba(29,78,216,0.6)' : 'rgba(0,0,0,0.4)',
            borderColor: torchOn ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.2)',
          }}
          id="torch-btn"
        >
          <Zap className="w-5 h-5 text-white" />
        </button>
      </div>

      {cameraReady && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br-lg" />
          </div>
        </div>
      )}

      {cameraLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <div className="text-center px-8">
            <p className="text-white text-sm font-medium">{t('camera.openingCamera')}</p>
            <p className="text-white/60 text-xs mt-1">{t('camera.cameraAccessRequired')}</p>
          </div>
        </div>
      )}

      <div
        className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-around px-8 pt-4"
        style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center"
          id="gallery-btn"
        >
          <Image className="w-5 h-5 text-white" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={pickFromGallery}
        />

        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full bg-white/10 ripple" />
          <button
            type="button"
            onClick={capturePhoto}
            disabled={!cameraReady}
            className="relative rounded-full bg-white border-4 border-white/30 shadow-2xl active:scale-90 transition-transform duration-150 disabled:opacity-40"
            style={{ width: '72px', height: '72px' }}
            id="capture-btn"
          >
            <div className="w-full h-full rounded-full bg-white border-4" style={{ borderColor: '#1a1a1a' }} />
          </button>
        </div>

        <button
          type="button"
          onClick={flipCamera}
          disabled={cameraLoading}
          className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center disabled:opacity-40"
          id="flip-btn"
        >
          <SwitchCamera className="w-5 h-5 text-white" />
        </button>
      </div>

      <div
        className="absolute inset-x-0 z-20 text-center pointer-events-none"
        style={{ bottom: 'calc(9rem + env(safe-area-inset-bottom))' }}
      >
        <p className="text-white/40 text-xs tracking-wide">
          {cameraReady ? t('camera.tapToCapture') : t('camera.waitingForPreview')}
        </p>
      </div>
    </div>
  );
}
