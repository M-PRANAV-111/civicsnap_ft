import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import CategoryCard, { CATEGORIES } from '../components/CategoryCard.jsx';
import { LocationSearch, buildMapsLink, reverseGeocodeLocation } from '../components/LocationSearch.jsx';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Navigation2,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';

const ACCEPTED_ATTACHMENT_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const ACCEPTED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function isLikelyOfflineError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('network') || message.includes('fetch') || message.includes('failed');
}

function isImageAttachment(value) {
  return String(value?.type || value?.fileType || '').startsWith('image/');
}

function isSupportedAttachment(file) {
  if (!file) return false;
  const normalizedName = String(file.name || '').toLowerCase();

  return ACCEPTED_ATTACHMENT_TYPES.includes(file.type) ||
    ACCEPTED_ATTACHMENT_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
}

function formatLocationError(error) {
  switch (error?.code) {
    case 1:
      return 'Location permission is required to use GPS.';
    case 2:
      return 'We could not detect your current location.';
    case 3:
      return 'Location lookup timed out. Please try again.';
    default:
      return 'Unable to fetch your location right now.';
  }
}

async function imageSourceToFile(imageSource) {
  if (!imageSource) return null;
  if (imageSource instanceof File) return imageSource;

  const response = await fetch(imageSource);
  const blob = await response.blob();
  return new File([blob], 'complaint.jpg', { type: blob.type || 'image/jpeg' });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result || '');
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

async function buildQueuedAttachment(file) {
  return {
    fileName: file.name,
    fileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    dataUrl: await fileToDataUrl(file),
  };
}

function createAttachmentPreview(file) {
  return {
    id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: isImageAttachment(file) ? URL.createObjectURL(file) : '',
  };
}

function revokeAttachmentPreview(attachment) {
  if (attachment?.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

function SuccessState({ desktop, savedLocally, complaintId, onViewComplaints, onSubmitAnother }) {
  return (
    <div className={`${desktop ? 'px-5 py-10' : 'screen items-center justify-center px-6'} flex flex-col gap-5`} style={{ background: desktop ? 'transparent' : 'var(--cs-bg)' }}>
      <div
        className="w-20 h-20 rounded-full border flex items-center justify-center self-center"
        style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--cs-ink)' }}>
          {savedLocally ? 'Saved Locally' : 'Complaint Submitted'}
        </h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--cs-muted)' }}>
          {savedLocally
            ? 'Your complaint is stored on this device and will retry automatically when the internet is back.'
            : 'Your complaint has been registered and is ready for tracking.'}
        </p>
        {complaintId && (
          <p className="text-sm font-semibold mt-2" style={{ color: 'var(--cs-ink)' }}>
            ID: {complaintId}
          </p>
        )}
      </div>

      {desktop ? (
        <div className="flex flex-col gap-2 w-full">
          <button type="button" onClick={onViewComplaints} className="btn-primary">
            View My Complaints
          </button>
          <button type="button" onClick={onSubmitAnother} className="btn-secondary">
            Submit Another Complaint
          </button>
        </div>
      ) : savedLocally ? (
        <span
          className="text-xs px-3 py-1 rounded-full border font-medium self-center"
          style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}
        >
          Saved locally - will retry
        </span>
      ) : null}
    </div>
  );
}

export default function ComplaintForm({ mode = 'mobile', embedded = false }) {
  const isDesktopForm = mode === 'desktop';
  const {
    authUser,
    capturedImage,
    createComplaint,
    getDepartmentId,
    mobileCitizenUser,
    queueOfflineComplaint,
    setCapturedImage,
  } = useApp();
  const navigate = useNavigate();

  const galleryInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const attachmentsRef = useRef([]);

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [locSource, setLocSource] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);
  const [submittedComplaintId, setSubmittedComplaintId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => () => {
    attachmentsRef.current.forEach(revokeAttachmentPreview);
  }, []);

  useEffect(() => {
    if (isDesktopForm || location || locLoading) return;
    if (!navigator.geolocation) return;

    handleUseMyLocation({ silentFailure: true });
    // We only want the initial mobile GPS attempt on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktopForm]);

  const resetAttachments = () => {
    attachmentsRef.current.forEach(revokeAttachmentPreview);
    attachmentsRef.current = [];
    setAttachments([]);
    setAttachmentError('');
  };

  const resetDesktopForm = () => {
    setDescription('');
    setCategory('');
    setLocation(null);
    setAddress('');
    setLocSource('');
    setLocError('');
    setShowSearch(false);
    setSubmitted(false);
    setSavedLocally(false);
    setSubmittedComplaintId('');
    setSubmissionError('');
    setSubmissionMessage('');
    setUploadProgress(0);
    resetAttachments();
  };

  const handleUseMyLocation = ({ silentFailure = false } = {}) => {
    if (!navigator.geolocation) {
      if (!silentFailure) {
        setLocError('Location access is not supported on this browser.');
      }
      return;
    }

    setLocLoading(true);
    setLocError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;
        const geo = await reverseGeocodeLocation(nextLat, nextLng);

        setLocation({ lat: nextLat, lng: nextLng });
        setAddress(geo.label);
        setLocSource('gps');
        setLocLoading(false);
      },
      (error) => {
        setLocLoading(false);
        if (!silentFailure) {
          setLocError(formatLocationError(error));
        }
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 },
    );
  };

  const handleSearchPick = ({ lat, lng, label }) => {
    setLocation({ lat, lng });
    setAddress(label);
    setLocSource('search');
    setLocError('');
    setShowSearch(false);
  };

  const handlePickNewPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setCapturedImage(loadEvent.target?.result || null);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleDesktopAttachmentSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';

    if (!selectedFiles.length) return;

    const invalidFile = selectedFiles.find((file) => !isSupportedAttachment(file));
    if (invalidFile) {
      setAttachmentError('Only JPG, JPEG, PNG, and PDF files are supported.');
    } else {
      setAttachmentError('');
    }

    const validFiles = selectedFiles.filter(isSupportedAttachment);
    if (!validFiles.length) return;

    setAttachments((currentAttachments) => {
      const existingKeys = new Set(
        currentAttachments.map((attachment) => `${attachment.file.name}-${attachment.file.lastModified}`),
      );

      const nextItems = validFiles
        .filter((file) => !existingKeys.has(`${file.name}-${file.lastModified}`))
        .map(createAttachmentPreview);

      return [...currentAttachments, ...nextItems];
    });
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachments((currentAttachments) => {
      const attachmentToRemove = currentAttachments.find((attachment) => attachment.id === attachmentId);
      revokeAttachmentPreview(attachmentToRemove);
      return currentAttachments.filter((attachment) => attachment.id !== attachmentId);
    });
  };

  const handleSubmit = async () => {
    const hasDesktopFiles = isDesktopForm ? attachments.map((attachment) => attachment.file) : [];
    if (!category || !location || submitting || (!isDesktopForm && !capturedImage)) return;

    const departmentId = getDepartmentId(category);
    if (!departmentId) {
      setSubmissionError('We could not map that category to a backend department. Please refresh and try again.');
      return;
    }

    setSubmissionError('');
    setSavedLocally(false);
    setSubmitting(true);
    setUploadProgress(10);
    setSubmissionMessage('Preparing complaint...');

    const mapsLink = buildMapsLink(location.lat, location.lng);
    const citizenType = authUser?.role === 'citizen' || mobileCitizenUser?.role === 'citizen' ? 'registered' : 'guest';

    try {
      const imageFile = isDesktopForm ? null : await imageSourceToFile(capturedImage);
      setUploadProgress(20);
      setSubmissionMessage('Uploading complaint...');

      const createdComplaint = await createComplaint(
        {
          citizenType,
          description: description.trim(),
          category,
          department: departmentId,
          latitude: location.lat,
          longitude: location.lng,
          mapsLink,
          priority: 'Normal',
          imageFile,
          fileName: imageFile?.name || 'complaint.jpg',
          attachments: hasDesktopFiles,
        },
        {
          onProgress: (progress) => {
            setUploadProgress(Math.max(20, progress));
            setSubmissionMessage(`Uploading complaint... ${progress}%`);
          },
        },
      );

      setUploadProgress(100);
      setSubmissionMessage('Complaint submitted successfully.');
      setSubmittedComplaintId(createdComplaint?.id || createdComplaint?._id || '');
      setSubmitted(true);
      setSubmitting(false);

      if (isDesktopForm) {
        setDescription('');
        setCategory('');
        setLocation(null);
        setAddress('');
        setLocSource('');
        setLocError('');
        resetAttachments();
        return;
      }

      setTimeout(() => {
        setCapturedImage(null);
        navigate('/status', { state: { complaintId: createdComplaint?.id } });
      }, 1500);
    } catch (error) {
      if (isLikelyOfflineError(error)) {
        const queuedAttachments = isDesktopForm
          ? await Promise.all(attachments.map((attachment) => buildQueuedAttachment(attachment.file)))
          : [];

        const queuedComplaint = queueOfflineComplaint({
          localId: `LOCAL-${Date.now()}`,
          citizenType,
          description: description.trim(),
          category,
          department: departmentId,
          latitude: location.lat,
          longitude: location.lng,
          mapsLink,
          priority: 'Normal',
          address: address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
          imageDataUrl: !isDesktopForm && typeof capturedImage === 'string' ? capturedImage : null,
          attachments: queuedAttachments,
          createdAt: new Date().toISOString(),
        });

        setSavedLocally(true);
        setSubmitted(true);
        setSubmitting(false);
        setUploadProgress(100);
        setSubmissionMessage('Saved locally - will retry when online.');
        setSubmittedComplaintId(queuedComplaint.localId);

        if (isDesktopForm) {
          setDescription('');
          setCategory('');
          setLocation(null);
          setAddress('');
          setLocSource('');
          setLocError('');
          resetAttachments();
          return;
        }

        setTimeout(() => {
          setCapturedImage(null);
          navigate('/status', { state: { complaintId: queuedComplaint.localId } });
        }, 1700);

        return;
      }

      setSubmissionError(error.message || 'Unable to submit complaint right now.');
      setSubmissionMessage('');
      setUploadProgress(0);
      setSubmitting(false);
    }
  };

  if (!isDesktopForm && !capturedImage) {
    return (
      <div className="screen items-center justify-center px-6 gap-5" style={{ background: 'var(--cs-bg)' }}>
        <div
          className="w-16 h-16 rounded-2xl border flex items-center justify-center"
          style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}
        >
          <Camera className="w-8 h-8" style={{ color: 'rgba(75,85,99,0.3)' }} />
        </div>
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--cs-ink)' }}>No photo selected</p>
          <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>
            Take a photo or upload from your gallery.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 w-full">
          <button type="button" onClick={() => navigate('/camera')} className="btn-primary">
            <Camera className="w-4 h-4" /> Open Camera
          </button>
          <button type="button" onClick={() => galleryInputRef.current?.click()} className="btn-secondary">
            Upload from Gallery
          </button>
        </div>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePickNewPhoto}
        />
      </div>
    );
  }

  if (submitted) {
    return (
      <SuccessState
        desktop={isDesktopForm}
        savedLocally={savedLocally}
        complaintId={submittedComplaintId}
        onViewComplaints={() => navigate('/status')}
        onSubmitAnother={resetDesktopForm}
      />
    );
  }

  const mapsUrl = location ? buildMapsLink(location.lat, location.lng) : null;
  const canSubmit = Boolean(category && location && !submitting && (isDesktopForm || capturedImage));
  const formPaddingClass = embedded ? 'px-5 py-4 flex flex-col gap-5' : 'px-4 py-4 flex flex-col gap-5 bottom-safe';

  const formContent = (
    <div className={formPaddingClass}>
      {!isDesktopForm && (
        <div className="relative rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: 'var(--cs-border)' }}>
          <img src={capturedImage} alt="Captured" className="w-full h-52 object-cover" />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="absolute top-2.5 right-2.5 flex items-center gap-1.5 backdrop-blur-sm text-white rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            <Camera className="w-3.5 h-3.5" /> Change Photo
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePickNewPhoto}
          />
        </div>
      )}

      {isDesktopForm && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">
              Attachments <span style={{ color: 'var(--cs-muted)', textTransform: 'lowercase', letterSpacing: 0 }}>(optional)</span>
            </label>
            <button type="button" onClick={() => attachmentInputRef.current?.click()} className="btn-secondary w-auto px-4 py-2 text-sm">
              <Upload className="w-4 h-4" /> Add files
            </button>
          </div>

          <div
            className="rounded-2xl border border-dashed px-4 py-4"
            style={{ borderColor: 'var(--cs-border)', background: 'var(--cs-subtle)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--cs-ink)' }}>
              Upload images or PDFs
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>
              Supported: JPG, JPEG, PNG, PDF.
            </p>
            <input
              ref={attachmentInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={handleDesktopAttachmentSelect}
            />
          </div>

          {attachmentError && (
            <p className="text-xs mt-2 px-1" style={{ color: '#B45309' }}>
              {attachmentError}
            </p>
          )}

          {attachments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="rounded-2xl border p-3 flex items-center gap-3"
                  style={{ background: '#FFFFFF', borderColor: 'var(--cs-border)' }}
                >
                  {attachment.previewUrl ? (
                    <img
                      src={attachment.previewUrl}
                      alt={attachment.file.name}
                      className="w-14 h-14 rounded-xl object-cover border"
                      style={{ borderColor: 'var(--cs-border)' }}
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl border flex items-center justify-center flex-shrink-0"
                      style={{ background: '#FEF3C7', borderColor: '#FDE68A' }}
                    >
                      <FileText className="w-6 h-6" style={{ color: '#B45309' }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--cs-ink)' }}>
                      {attachment.file.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>
                      {attachment.file.type || 'application/pdf'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="w-9 h-9 rounded-xl border flex items-center justify-center"
                    style={{ background: '#FFFFFF', borderColor: 'var(--cs-border)', color: 'var(--cs-muted)' }}
                    aria-label={`Remove ${attachment.file.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="label" htmlFor={isDesktopForm ? 'desktop-desc' : 'desc'}>
          Description <span style={{ color: 'var(--cs-muted)', textTransform: 'lowercase', letterSpacing: 0 }}>(optional)</span>
        </label>
        <textarea
          id={isDesktopForm ? 'desktop-desc' : 'desc'}
          className="input-field resize-none"
          rows={isDesktopForm ? 4 : 3}
          placeholder="Describe the issue briefly..."
          value={description}
          maxLength={300}
          onChange={(event) => setDescription(event.target.value)}
        />
        <p className="text-xs mt-1 text-right" style={{ color: 'rgba(75,85,99,0.4)' }}>
          {description.length}/300
        </p>
      </div>

      <div>
        <label className="label">
          Category <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <div className={`grid ${isDesktopForm ? 'grid-cols-4 xl:grid-cols-5' : 'grid-cols-3'} gap-2`}>
          {CATEGORIES.map((item) => (
            <CategoryCard key={item} category={item} selected={category === item} onSelect={setCategory} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">
            Location <span style={{ color: '#EF4444' }}>*</span>
          </label>
          {locSource && (
            <span
              className="text-xs px-2 py-0.5 rounded-full border font-medium"
              style={{
                background: locSource === 'gps' ? '#ECFDF5' : '#EFF6FF',
                borderColor: locSource === 'gps' ? '#A7F3D0' : '#BFDBFE',
                color: locSource === 'gps' ? '#065F46' : 'var(--cs-accent)',
              }}
            >
              {locSource === 'gps' ? 'GPS' : 'Searched'}
            </span>
          )}
        </div>

        <div className="card flex items-start gap-3 py-3.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
            style={{
              background: location ? '#ECFDF5' : 'var(--cs-subtle)',
              borderColor: location ? '#A7F3D0' : 'var(--cs-border)',
            }}
          >
            {locLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--cs-accent)' }} />
            ) : location ? (
              <MapPin className="w-4 h-4 text-emerald-600" />
            ) : (
              <Navigation2 className="w-4 h-4" style={{ color: 'rgba(75,85,99,0.4)' }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {locLoading && (
              <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>Getting GPS location...</p>
            )}
            {location && !locLoading && (
              <>
                <p className="text-sm font-medium leading-snug" style={{ color: 'var(--cs-ink)' }}>
                  {address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(75,85,99,0.5)' }}>
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium flex items-center gap-1 mt-1"
                    style={{ color: 'var(--cs-accent)' }}
                  >
                    Verify on Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </>
            )}
            {!location && !locLoading && (
              <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>
                {isDesktopForm ? 'Choose your location with GPS or search below.' : 'No location set yet.'}
              </p>
            )}
          </div>
        </div>

        <div className={`mt-3 flex ${isDesktopForm ? 'flex-row flex-wrap items-center' : 'flex-col'} gap-2`}>
          <button type="button" onClick={() => handleUseMyLocation()} className="btn-secondary w-auto px-4 py-2.5 text-sm">
            <Navigation2 className="w-4 h-4" />
            Use My Location
          </button>
          {!isDesktopForm && (
            <button
              type="button"
              onClick={() => setShowSearch((value) => !value)}
              className="btn-secondary w-auto px-4 py-2.5 text-sm"
              id="search-location-btn"
            >
              <Search className="w-4 h-4" />
              {showSearch ? 'Hide search' : location ? 'Change location' : 'Search your location'}
            </button>
          )}
        </div>

        {(isDesktopForm || showSearch) && (
          <div className="mt-3">
            <LocationSearch
              onPick={handleSearchPick}
              initialQuery={address}
              autoFocus={Boolean(isDesktopForm || showSearch)}
            />
          </div>
        )}

        {locError && (
          <p className="text-xs mt-2 px-1" style={{ color: '#B45309' }}>
            {locError}
          </p>
        )}

        {!location && !locLoading && !locError && (
          <p className="text-xs mt-2 px-1" style={{ color: '#B45309' }}>
            Location is required before submitting.
          </p>
        )}
      </div>

      <div className="pt-1">
        {submissionError && (
          <div className="rounded-xl px-3 py-3 mb-3 border" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: '#B91C1C' }} />
              <div>
                <p className="text-sm" style={{ color: '#B91C1C' }}>{submissionError}</p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="text-xs font-semibold mt-2"
                  style={{ color: 'var(--cs-accent)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Retry submission
                </button>
              </div>
            </div>
          </div>
        )}

        {submitting && (
          <div className="rounded-xl border px-3 py-3 mb-3" style={{ background: '#FFFFFF', borderColor: 'var(--cs-border)' }}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--cs-ink)' }}>
                {submissionMessage || 'Submitting complaint...'}
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--cs-accent)' }}>
                {uploadProgress}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--cs-subtle)' }}>
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%`, background: 'var(--cs-accent)' }}
              />
            </div>
          </div>
        )}

        {!category && (
          <p className="text-xs text-center mb-2" style={{ color: 'var(--cs-muted)' }}>
            Select a category to continue
          </p>
        )}
        {!location && category && (
          <p className="text-xs text-center mb-2" style={{ color: 'var(--cs-muted)' }}>
            Set a location to continue
          </p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          id="submit-btn"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" /> Submit Complaint
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <div className="screen" style={{ background: 'var(--cs-bg)' }}>
      <div className="page-header">
        <button
          type="button"
          onClick={() => navigate('/camera')}
          className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl"
          id="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="page-title">Report Issue</span>
        <div className="w-9" />
      </div>

      <div className="scrollable">
        {formContent}
      </div>
    </div>
  );
}
