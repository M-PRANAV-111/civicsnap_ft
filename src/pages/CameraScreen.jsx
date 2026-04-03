import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Menu, SwitchCamera, Zap, Image, X, Camera, Upload, AlertTriangle } from 'lucide-react';

const isSecureContext = window.isSecureContext; // true on localhost or HTTPS

export default function CameraScreen() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const { setCapturedImage, setSidebarOpen } = useApp();
  const navigate = useNavigate();

  const startCamera = useCallback(async () => {
    // Camera requires HTTPS or localhost — skip on plain HTTP
    if (!isSecureContext) {
      setError('INSECURE_CONTEXT');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera API not supported on this browser.');
      return;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setCameraReady(false);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraReady(true);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('PERMISSION_DENIED');
      } else {
        setError('Camera unavailable. ' + err.message);
      }
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
    setCapturedImage(dataURL);
    navigate('/submit');
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const pickFromGallery = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCapturedImage(ev.target.result);
      // Use requestAnimationFrame so React commits the state before navigating
      requestAnimationFrame(() => navigate('/submit'));
    };
    reader.readAsDataURL(file);
  };

  // ── Error / Fallback states ──────────────────────────────────────────
  if (error === 'INSECURE_CONTEXT') {
    return (
      <div className="screen items-center justify-center px-8 gap-0" style={{ background: 'var(--cs-bg)' }}>
        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-5 pt-4 pb-3">
          <button onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-full border flex items-center justify-center"
            style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
            <Menu className="w-4 h-4" style={{ color: 'var(--cs-muted)' }} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{ background: 'var(--cs-card)', borderColor: 'var(--cs-border)' }}>
            <Camera className="w-3.5 h-3.5" style={{ color: 'var(--cs-accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--cs-ink)' }}>CivicSnap</span>
          </div>
          <div className="w-10" />
        </div>

        <div className="flex flex-col items-center text-center gap-5 mt-16">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center border"
            style={{ background: '#FEF3C7', borderColor: '#FDE68A' }}>
            <AlertTriangle className="w-10 h-10" style={{ color: '#D97706' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--cs-ink)' }}>
              Camera requires HTTPS
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cs-muted)' }}>
              Chrome blocks camera access on plain HTTP network URLs.<br />
              You can still upload a photo from your gallery below.
            </p>
          </div>

          {/* Upload from gallery — primary CTA */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary w-full"
            id="gallery-upload-btn"
          >
            <Upload className="w-4 h-4" /> Upload Photo from Gallery
          </button>

          <div className="w-full rounded-xl border p-4 text-left"
            style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--cs-muted)' }}>
              To enable camera access:
            </p>
            <ol className="text-xs flex flex-col gap-1.5" style={{ color: 'var(--cs-muted)' }}>
              <li>1. Open this link on <strong style={{ color: 'var(--cs-ink)' }}>localhost:5173</strong> instead</li>
              <li>2. Or serve the app over <strong style={{ color: 'var(--cs-ink)' }}>HTTPS</strong> (e.g. ngrok)</li>
              <li>3. Or on Chrome mobile, flag:
                <code className="block mt-0.5 px-2 py-1 rounded text-xs"
                  style={{ background: '#fff', color: 'var(--cs-accent)', border: '1px solid var(--cs-border)' }}>
                  chrome://flags/#unsafely-treat-insecure-origin-as-secure
                </code>
                and add <strong style={{ color: 'var(--cs-ink)' }}>http://192.168.0.121:5173</strong>
              </li>
            </ol>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pickFromGallery} />
      </div>
    );
  }

  if (error === 'PERMISSION_DENIED') {
    return (
      <div className="screen items-center justify-center px-8 gap-5" style={{ background: '#0f0f0f' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <X className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold mb-1">Camera permission denied</p>
          <p className="text-white/50 text-sm">Please allow camera access in your browser settings, then retry.</p>
        </div>
        <button onClick={startCamera} className="btn-primary w-auto px-8">Retry Camera</button>
        <button onClick={() => fileInputRef.current?.click()} className="btn-secondary w-auto px-8">
          <Image className="w-4 h-4" /> Upload Instead
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickFromGallery} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen items-center justify-center px-8 gap-5" style={{ background: '#0f0f0f' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <Camera className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-white/70 text-center text-sm">{error}</p>
        <button onClick={() => fileInputRef.current?.click()} className="btn-primary w-auto px-8">
          <Upload className="w-4 h-4" /> Upload Photo
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickFromGallery} />
      </div>
    );
  }

  // ── Normal camera view ────────────────────────────────────────────────
  return (
    <div className="screen relative bg-black">
      {/* Camera viewfinder */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white z-20 pointer-events-none camera-flash" />}

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 pt-4 pb-3">
        <button onClick={() => setSidebarOpen(true)}
          className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center"
          id="menu-btn">
          <Menu className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-white text-xs font-medium tracking-wide">CivicSnap</span>
        </div>

        <button
          onClick={() => setTorchOn(v => !v)}
          className="w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center"
          style={{
            background: torchOn ? 'rgba(29,78,216,0.6)' : 'rgba(0,0,0,0.4)',
            borderColor: torchOn ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.2)'
          }}
          id="torch-btn">
          <Zap className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Viewfinder guides */}
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

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-around px-8 pb-10 pt-4">
        {/* Gallery */}
        <button onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center"
          id="gallery-btn">
          <Image className="w-5 h-5 text-white" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickFromGallery} />

        {/* Capture */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full bg-white/10 ripple" />
          <button
            onClick={capturePhoto}
            disabled={!cameraReady}
            className="relative rounded-full bg-white border-4 border-white/30 shadow-2xl active:scale-90 transition-transform duration-150 disabled:opacity-40"
            style={{ width: '72px', height: '72px' }}
            id="capture-btn">
            <div className="w-full h-full rounded-full bg-white border-4" style={{ borderColor: '#1a1a1a' }} />
          </button>
        </div>

        {/* Flip */}
        <button onClick={flipCamera}
          className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center"
          id="flip-btn">
          <SwitchCamera className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Hint */}
      <div className="absolute bottom-36 inset-x-0 z-20 text-center pointer-events-none">
        <p className="text-white/40 text-xs tracking-wide">Tap the button to capture a photo</p>
      </div>
    </div>
  );
}
