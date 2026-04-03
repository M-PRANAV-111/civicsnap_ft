import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import CategoryCard, { CATEGORIES } from '../components/CategoryCard.jsx';
import {
  ArrowLeft, MapPin, Loader2, CheckCircle2, Camera,
  Search, X, RefreshCw, ExternalLink, Navigation2
} from 'lucide-react';

// ── Nominatim forward search (free, no API key) ──────────────────────────────
async function searchPlaces(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=in&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('search failed');
  return res.json();
}

// ── Reverse geocode (coords → address) ──────────────────────────────────────
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const a = data.address || {};
    const parts = [
      a.road || a.neighbourhood || a.suburb,
      a.city || a.town || a.village || a.county,
      a.state,
    ].filter(Boolean);
    return { label: parts.slice(0, 2).join(', '), full: parts.join(', ') };
  } catch {
    return { label: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`, full: '' };
  }
}

// ── Location search dropdown component ──────────────────────────────────────
function LocationSearch({ onPick, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleInput = (val) => {
    setQuery(val);
    setError('');
    clearTimeout(debounceRef.current);
    if (val.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchPlaces(val);
        setResults(data);
        if (data.length === 0) setError('No results found. Try a more specific name.');
      } catch {
        setError('Search failed. Check your internet connection.');
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const formatResult = (r) => {
    const a = r.address || {};
    const label = r.display_name.split(',').slice(0, 3).join(',');
    return label;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--cs-muted)' }} />
        <input
          ref={inputRef}
          className="input-field pl-9 pr-9"
          placeholder="Search your area, street, landmark…"
          value={query}
          onChange={e => handleInput(e.target.value)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--cs-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Loading */}
      {searching && (
        <div className="flex items-center gap-2 px-1 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--cs-accent)' }} />
          <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>Searching…</span>
        </div>
      )}

      {/* Error */}
      {error && !searching && (
        <p className="text-xs px-1" style={{ color: '#B45309' }}>{error}</p>
      )}

      {/* Results */}
      {results.length > 0 && !searching && (
        <div className="flex flex-col gap-1 rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--cs-border)', background: 'var(--cs-card)' }}>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => onPick({
                lat: parseFloat(r.lat),
                lng: parseFloat(r.lon),
                label: formatResult(r),
              })}
              className="flex items-start gap-3 px-3 py-2.5 text-left border-b last:border-b-0"
              style={{ borderColor: 'var(--cs-border)', background: 'none', cursor: 'pointer' }}
            >
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--cs-accent)' }} />
              <span className="text-sm leading-snug" style={{ color: 'var(--cs-ink)' }}>
                {formatResult(r)}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs px-1" style={{ color: 'rgba(75,85,99,0.5)' }}>
        Powered by OpenStreetMap · type at least 3 characters
      </p>
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────────────────
export default function ComplaintForm() {
  const { capturedImage, setCapturedImage, addComplaint } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // Location state
  const [location, setLocation] = useState(null);   // { lat, lng }
  const [address, setAddress]   = useState('');     // human-readable
  const [locSource, setLocSource] = useState('');   // 'gps' | 'search' | ''
  const [locLoading, setLocLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  // On mount: try GPS, then silently fail (let user search)
  useEffect(() => {
    tryGPSOnMount();
  }, []);

  const tryGPSOnMount = async () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { label } = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(label);
        setLocSource('gps');
        setLocLoading(false);
      },
      () => {
        // GPS failed silently — user can search manually
        setLocLoading(false);
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  const handleSearchPick = async ({ lat, lng, label }) => {
    setLocation({ lat, lng });
    setAddress(label);
    setLocSource('search');
    setShowSearch(false);
  };

  const handlePickNewPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setCapturedImage(ev.target.result); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!category || !location) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    addComplaint({
      image: capturedImage,
      description,
      category,
      location,
      address: address || `${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E`,
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => { setCapturedImage(null); navigate('/status'); }, 1800);
  };

  // ── Guard: no image ──────────────────────────────────────────────────
  if (!capturedImage) {
    return (
      <div className="screen items-center justify-center px-6 gap-5" style={{ background: 'var(--cs-bg)' }}>
        <div className="w-16 h-16 rounded-2xl border flex items-center justify-center"
          style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
          <Camera className="w-8 h-8" style={{ color: 'rgba(75,85,99,0.3)' }} />
        </div>
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--cs-ink)' }}>No photo selected</p>
          <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Take a photo or upload from your gallery</p>
        </div>
        <div className="flex flex-col gap-2.5 w-full">
          <button onClick={() => navigate('/camera')} className="btn-primary">
            <Camera className="w-4 h-4" /> Open Camera
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
            Upload from Gallery
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={handlePickNewPhoto} />
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="screen items-center justify-center px-6 gap-5" style={{ background: 'var(--cs-bg)' }}>
        <div className="w-20 h-20 rounded-full border flex items-center justify-center"
          style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold" style={{ color: 'var(--cs-ink)' }}>Submitted!</h2>
          <p className="text-sm mt-1.5" style={{ color: 'var(--cs-muted)' }}>
            Your complaint has been registered and will be reviewed shortly.
          </p>
        </div>
      </div>
    );
  }

  const mapsUrl = location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : null;
  const canSubmit = !!category && !!location && !submitting;

  // ── Main form ────────────────────────────────────────────────────────
  return (
    <div className="screen" style={{ background: 'var(--cs-bg)' }}>
      <div className="page-header">
        <button onClick={() => navigate('/camera')}
          className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl" id="back-btn">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="page-title">Report Issue</span>
        <div className="w-9" />
      </div>

      <div className="scrollable">
        <div className="px-4 py-4 flex flex-col gap-5 bottom-safe">

          {/* Image preview */}
          <div className="relative rounded-2xl overflow-hidden border shadow-sm"
            style={{ borderColor: 'var(--cs-border)' }}>
            <img src={capturedImage} alt="Captured" className="w-full h-52 object-cover" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-2.5 right-2.5 flex items-center gap-1.5 backdrop-blur-sm text-white rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              <Camera className="w-3.5 h-3.5" /> Change Photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={handlePickNewPhoto} />
          </div>

          {/* Description */}
          <div>
            <label className="label" htmlFor="desc">
              Description <span style={{ color: 'var(--cs-muted)', textTransform: 'lowercase', letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea id="desc" className="input-field resize-none" rows={3}
              placeholder="Describe the issue briefly…"
              value={description} maxLength={300}
              onChange={e => setDescription(e.target.value)} />
            <p className="text-xs mt-1 text-right" style={{ color: 'rgba(75,85,99,0.4)' }}>{description.length}/300</p>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category <span style={{ color: '#EF4444' }}>*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <CategoryCard key={cat} category={cat} selected={category === cat} onSelect={setCategory} />
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Location <span style={{ color: '#EF4444' }}>*</span></label>
              {locSource && (
                <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                  style={{
                    background: locSource === 'gps' ? '#ECFDF5' : '#EFF6FF',
                    borderColor: locSource === 'gps' ? '#A7F3D0' : '#BFDBFE',
                    color: locSource === 'gps' ? '#065F46' : 'var(--cs-accent)'
                  }}>
                  {locSource === 'gps' ? '📡 GPS' : '🔍 Searched'}
                </span>
              )}
            </div>

            {/* Current location display */}
            {!showSearch && (
              <div className="card flex items-start gap-3 py-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border flex-shrink-0"
                  style={{
                    background: location ? '#ECFDF5' : 'var(--cs-subtle)',
                    borderColor: location ? '#A7F3D0' : 'var(--cs-border)'
                  }}>
                  {locLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--cs-accent)' }} />
                    : location
                      ? <MapPin className="w-4 h-4 text-emerald-600" />
                      : <Navigation2 className="w-4 h-4" style={{ color: 'rgba(75,85,99,0.4)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  {locLoading && (
                    <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>Getting GPS location…</p>
                  )}
                  {location && !locLoading && (
                    <>
                      <p className="text-sm font-medium leading-snug" style={{ color: 'var(--cs-ink)' }}>
                        {address}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(75,85,99,0.5)' }}>
                        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                      </p>
                      {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noreferrer"
                          className="text-xs font-medium flex items-center gap-1 mt-1"
                          style={{ color: 'var(--cs-accent)' }}>
                          Verify on Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </>
                  )}
                  {!location && !locLoading && (
                    <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>
                      No location set — search below
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Search box */}
            {showSearch ? (
              <div className="flex flex-col gap-3">
                <LocationSearch
                  onPick={handleSearchPick}
                  initialQuery={address}
                />
                <button onClick={() => setShowSearch(false)} className="btn-ghost text-sm">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="btn-secondary mt-2 py-2.5 text-sm"
                id="search-location-btn"
              >
                <Search className="w-4 h-4" />
                {location ? 'Change location' : 'Search your location'}
              </button>
            )}

            {!location && !locLoading && !showSearch && (
              <p className="text-xs mt-2 px-1" style={{ color: '#B45309' }}>
                ⚠ Location is required. Please search for your area above.
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-1">
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
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              id="submit-btn"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                : <><CheckCircle2 className="w-4 h-4" /> Submit Complaint</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
