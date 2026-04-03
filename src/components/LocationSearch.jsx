import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_SCRIPT_ID = 'civicsnap-google-maps-script';
const GOOGLE_CALLBACK_NAME = '__civicsnapGoogleMapsReady';
let googleMapsPromise = null;

function buildMapsLink(latitude, longitude) {
  if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) {
    return '';
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function isGooglePlacesConfigured() {
  return Boolean(GOOGLE_MAPS_API_KEY);
}

function loadGoogleMapsPlaces() {
  if (!isGooglePlacesConfigured()) {
    return Promise.reject(new Error('Google Maps Places API key is not configured.'));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.google?.maps?.places) {
          resolve(window.google.maps);
          return;
        }

        reject(new Error('Google Maps failed to initialize.'));
      }, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Google Maps.')), { once: true });
      return;
    }

    window[GOOGLE_CALLBACK_NAME] = () => {
      if (window.google?.maps?.places) {
        resolve(window.google.maps);
        return;
      }

      reject(new Error('Google Maps failed to initialize.'));
    };

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=${GOOGLE_CALLBACK_NAME}`;
    script.onerror = () => reject(new Error('Unable to load Google Maps.'));
    document.head.appendChild(script);
  })
    .catch((error) => {
      googleMapsPromise = null;
      throw error;
    })
    .finally(() => {
      delete window[GOOGLE_CALLBACK_NAME];
    });

  return googleMapsPromise;
}

async function searchGooglePlaces(query) {
  const maps = await loadGoogleMapsPlaces();

  return new Promise((resolve, reject) => {
    const service = new maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'in' },
      },
      (predictions, status) => {
        if (status === maps.places.PlacesServiceStatus.OK) {
          resolve(predictions || []);
          return;
        }

        if (status === maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
          return;
        }

        reject(new Error('Google Maps search failed.'));
      },
    );
  });
}

async function resolveGooglePlace(prediction) {
  const maps = await loadGoogleMapsPlaces();

  return new Promise((resolve, reject) => {
    const geocoder = new maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === maps.GeocoderStatus.OK && results?.[0]) {
        const topResult = results[0];
        const point = topResult.geometry?.location;

        resolve({
          lat: point?.lat?.() ?? null,
          lng: point?.lng?.() ?? null,
          label: topResult.formatted_address || prediction.description,
          mapsLink: point ? buildMapsLink(point.lat(), point.lng()) : '',
        });
        return;
      }

      reject(new Error('Unable to read the selected place.'));
    });
  });
}

async function searchNominatimPlaces(query) {
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=in&addressdetails=1`;
  const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });

  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
}

function formatNominatimResult(result) {
  return result.display_name.split(',').slice(0, 3).join(',').trim();
}

async function reverseGeocodeLocation(lat, lng) {
  try {
    if (isGooglePlacesConfigured()) {
      const maps = await loadGoogleMapsPlaces();
      const geocoder = new maps.Geocoder();

      const address = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === maps.GeocoderStatus.OK && results?.[0]) {
            resolve(results[0].formatted_address);
            return;
          }

          reject(new Error('Reverse geocode failed'));
        });
      });

      return {
        label: address,
        full: address,
        mapsLink: buildMapsLink(lat, lng),
      };
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const data = await response.json();
    const address = data.address || {};
    const parts = [
      address.road || address.neighbourhood || address.suburb,
      address.city || address.town || address.village || address.county,
      address.state,
    ].filter(Boolean);
    const label = parts.slice(0, 2).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    return {
      label,
      full: parts.join(', '),
      mapsLink: buildMapsLink(lat, lng),
    };
  } catch {
    const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    return { label: fallback, full: fallback, mapsLink: buildMapsLink(lat, lng) };
  }
}

export function LocationSearch({
  onPick,
  initialQuery = '',
  autoFocus = false,
  placeholder = 'Search your area, street, landmark...',
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => () => {
    clearTimeout(debounceRef.current);
  }, []);

  const handleInput = (value) => {
    setQuery(value);
    setError('');
    clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        if (isGooglePlacesConfigured()) {
          const predictions = await searchGooglePlaces(value);
          setResults(
            predictions.map((prediction) => ({
              key: prediction.place_id,
              label: prediction.description,
              raw: prediction,
              source: 'google',
            })),
          );
          if (predictions.length === 0) {
            setError('No results found. Try a more specific name.');
          }
        } else {
          const fallbackResults = await searchNominatimPlaces(value);
          setResults(
            fallbackResults.map((result, index) => ({
              key: `${result.place_id}-${index}`,
              label: formatNominatimResult(result),
              raw: result,
              source: 'nominatim',
            })),
          );
          if (fallbackResults.length === 0) {
            setError('No results found. Try a more specific name.');
          }
        }
      } catch {
        setError('Search failed. Check your internet connection.');
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handlePickResult = async (result) => {
    try {
      setSearching(true);
      setError('');

      if (result.source === 'google') {
        const resolved = await resolveGooglePlace(result.raw);
        if (resolved.lat === null || resolved.lng === null) {
          throw new Error('Missing coordinates');
        }

        onPick(resolved);
      } else {
        onPick({
          lat: parseFloat(result.raw.lat),
          lng: parseFloat(result.raw.lon),
          label: result.label,
          mapsLink: buildMapsLink(parseFloat(result.raw.lat), parseFloat(result.raw.lon)),
        });
      }

      setResults([]);
      setQuery(result.label);
    } catch {
      setError('Unable to use that location right now.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--cs-muted)' }}
        />
        <input
          ref={inputRef}
          className="input-field pl-9 pr-9"
          placeholder={placeholder}
          value={query}
          onChange={(event) => handleInput(event.target.value)}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setError('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--cs-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {searching && (
        <div className="flex items-center gap-2 px-1 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--cs-accent)' }} />
          <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>Searching...</span>
        </div>
      )}

      {error && !searching && (
        <p className="text-xs px-1" style={{ color: '#B45309' }}>{error}</p>
      )}

      {results.length > 0 && !searching && (
        <div
          className="flex flex-col gap-1 rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--cs-border)', background: 'var(--cs-card)' }}
        >
          {results.map((result) => (
            <button
              key={result.key}
              type="button"
              onClick={() => handlePickResult(result)}
              className="flex items-start gap-3 px-3 py-2.5 text-left border-b last:border-b-0"
              style={{ borderColor: 'var(--cs-border)', background: 'none', cursor: 'pointer' }}
            >
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--cs-accent)' }} />
              <span className="text-sm leading-snug" style={{ color: 'var(--cs-ink)' }}>
                {result.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs px-1" style={{ color: 'rgba(75,85,99,0.5)' }}>
        {isGooglePlacesConfigured()
          ? 'Powered by Google Maps Places API.'
          : 'Search fallback is active. Add VITE_GOOGLE_MAPS_API_KEY to enable Google Maps Places results.'}
      </p>
    </div>
  );
}

export { buildMapsLink, isGooglePlacesConfigured, reverseGeocodeLocation };
