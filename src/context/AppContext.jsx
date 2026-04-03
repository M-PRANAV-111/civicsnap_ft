import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AppContext = createContext(null);

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const TOKEN_KEY = 'civicsnap_token';
const OFFLINE_QUEUE_KEY = 'civicsnap_offline_complaints';
const CITIZEN_ACCOUNTS_KEY = 'civicsnap_citizen_accounts';
const CITIZEN_SESSION_KEY = 'civicsnap_citizen_session';

const FALLBACK_DEPARTMENTS = [
  { _id: 'dept-municipal', name: 'Municipal / GHMC' },
  { _id: 'dept-police', name: 'Police' },
  { _id: 'dept-traffic', name: 'Traffic Police' },
  { _id: 'dept-revenue', name: 'Revenue' },
  { _id: 'dept-endowments', name: 'Endowments' },
  { _id: 'dept-water', name: 'Water Supply' },
  { _id: 'dept-electricity', name: 'Electricity' },
  { _id: 'dept-health', name: 'Health' },
  { _id: 'dept-education', name: 'Education' },
  { _id: 'dept-rural', name: 'Rural Development' },
];

if (!import.meta.env.VITE_API_BASE) {
  console.warn('[CivicSnap] VITE_API_BASE is not set. Falling back to http://localhost:5000');
}

export function isMobileDevice() {
  return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ');
}

function parseJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function safeLocalStorageGet(key) {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures so mobile PWA rendering still works.
  }
}

function safeLocalStorageRemove(key) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures so mobile PWA rendering still works.
  }
}

function readStoredToken() {
  return safeLocalStorageGet(TOKEN_KEY) || null;
}

function readOfflineQueue() {
  try {
    const stored = safeLocalStorageGet(OFFLINE_QUEUE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readCitizenAccounts() {
  try {
    const stored = safeLocalStorageGet(CITIZEN_ACCOUNTS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCitizenAccounts(accounts) {
  safeLocalStorageSet(CITIZEN_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function readCitizenSession() {
  try {
    const stored = safeLocalStorageGet(CITIZEN_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function writeCitizenSession(session) {
  safeLocalStorageSet(CITIZEN_SESSION_KEY, JSON.stringify(session));
}

function clearCitizenSessionStorage() {
  safeLocalStorageRemove(CITIZEN_SESSION_KEY);
}

function writeOfflineQueue(queue) {
  safeLocalStorageSet(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function resolveApiUrl(path) {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

export function buildImageUrl(path) {
  if (!path) return null;
  if (/^(https?:\/\/|data:|blob:)/i.test(path)) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE}/${cleanPath}`;
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function getAttachmentKind(fileType, fileUrl = '') {
  const normalizedType = normalizeText(fileType);
  const normalizedUrl = String(fileUrl || '').toLowerCase();

  if (normalizedType.includes('pdf') || normalizedUrl.endsWith('.pdf')) {
    return 'pdf';
  }

  if (normalizedType.includes('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(normalizedUrl)) {
    return 'image';
  }

  return normalizedType || 'file';
}

function deriveAttachmentName(fileUrl, index) {
  if (!fileUrl) return `attachment-${index + 1}`;

  const fileName = String(fileUrl).split('/').pop() || `attachment-${index + 1}`;
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function normalizeAttachmentItem(attachment, index) {
  if (!attachment) return null;

  const fileUrl =
    typeof attachment === 'string'
      ? attachment
      : pickFirst(attachment?.fileUrl, attachment?.url, attachment?.path, attachment?.previewUrl, attachment?.dataUrl);

  if (!fileUrl) return null;

  const fileType = getAttachmentKind(attachment?.fileType, fileUrl);

  return {
    ...attachment,
    id: attachment?.id || attachment?._id || `${fileUrl}-${index}`,
    fileUrl,
    fileType,
    fileName: attachment?.fileName || deriveAttachmentName(fileUrl, index),
    url: buildImageUrl(fileUrl),
  };
}

function normalizeAttachments(rawComplaint) {
  const attachmentList = Array.isArray(rawComplaint?.attachments) ? rawComplaint.attachments : [];
  const normalized = attachmentList.map(normalizeAttachmentItem).filter(Boolean);
  const legacyImagePath = pickFirst(rawComplaint?.imageUrl, rawComplaint?.imagePath, rawComplaint?.image, rawComplaint?.photo);

  if (legacyImagePath && !normalized.some((attachment) => attachment.fileUrl === legacyImagePath)) {
    normalized.unshift(
      normalizeAttachmentItem(
        {
          fileUrl: legacyImagePath,
          fileType: 'image',
        },
        -1,
      ),
    );
  }

  return normalized.filter(Boolean);
}

function extractArray(payload, preferredKeys = []) {
  if (Array.isArray(payload)) return payload;

  for (const key of preferredKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  for (const value of Object.values(payload || {})) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

function normalizeStatus(status) {
  const normalized = normalizeText(status);

  if (!normalized || normalized === 'pending') return 'Pending';
  if (['accepted', 'assigned', 'open', 'in progress', 'inprogress'].includes(normalized)) return 'In Progress';
  if (['resolved', 'completed', 'closed'].includes(normalized)) return 'Resolved';
  if (normalized === 'rejected') return 'Rejected';

  return status || 'Pending';
}

function buildMapsLink(latitude, longitude, fallback) {
  if (fallback) return fallback;
  if (latitude === null || longitude === null) return '';
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function buildTimeline(rawComplaint, normalizedStatus) {
  if (Array.isArray(rawComplaint?.timeline) && rawComplaint.timeline.length > 0) {
    return rawComplaint.timeline
      .map((event) => ({
        status: normalizeStatus(event?.status || normalizedStatus),
        note: event?.note || event?.message || event?.description || 'Status updated',
        time: event?.time || event?.createdAt || event?.updatedAt || rawComplaint?.updatedAt || rawComplaint?.createdAt,
      }))
      .filter((event) => event.time)
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  const createdAt = rawComplaint?.createdAt || rawComplaint?.submittedAt || rawComplaint?.updatedAt || new Date().toISOString();
  const timeline = [
    {
      status: 'Pending',
      note: 'Complaint submitted',
      time: createdAt,
    },
  ];

  if (pickFirst(rawComplaint?.acceptedAt, rawComplaint?.assignedAt) || normalizedStatus === 'In Progress') {
    timeline.push({
      status: 'In Progress',
      note: 'Complaint accepted by the assigned officer',
      time: pickFirst(rawComplaint?.acceptedAt, rawComplaint?.assignedAt, rawComplaint?.updatedAt, createdAt),
    });
  }

  if (rawComplaint?.transferredAt || rawComplaint?.transferHistory?.length) {
    timeline.push({
      status: 'In Progress',
      note: rawComplaint?.department?.name
        ? `Transferred to ${rawComplaint.department.name}`
        : 'Complaint transferred to another department',
      time: pickFirst(rawComplaint?.transferredAt, rawComplaint?.updatedAt, createdAt),
    });
  }

  if (normalizedStatus === 'Rejected' || rawComplaint?.rejectedAt) {
    timeline.push({
      status: 'Rejected',
      note: rawComplaint?.rejectionReason || 'Complaint rejected by the assigned officer',
      time: pickFirst(rawComplaint?.rejectedAt, rawComplaint?.updatedAt, createdAt),
    });
  }

  if (normalizedStatus === 'Resolved' || rawComplaint?.resolvedAt) {
    timeline.push({
      status: 'Resolved',
      note: rawComplaint?.resolutionNote || 'Complaint marked as resolved',
      time: pickFirst(rawComplaint?.resolvedAt, rawComplaint?.updatedAt, createdAt),
    });
  }

  return timeline.sort((a, b) => new Date(a.time) - new Date(b.time));
}

function normalizeComplaint(rawComplaint) {
  if (!rawComplaint) return null;

  const latitudeValue = pickFirst(
    rawComplaint?.latitude,
    rawComplaint?.location?.latitude,
    rawComplaint?.location?.lat,
    rawComplaint?.coordinates?.latitude,
    rawComplaint?.lat,
  );
  const longitudeValue = pickFirst(
    rawComplaint?.longitude,
    rawComplaint?.location?.longitude,
    rawComplaint?.location?.lng,
    rawComplaint?.coordinates?.longitude,
    rawComplaint?.lon,
    rawComplaint?.lng,
  );

  const latitude = latitudeValue !== undefined && latitudeValue !== null ? Number(latitudeValue) : null;
  const longitude = longitudeValue !== undefined && longitudeValue !== null ? Number(longitudeValue) : null;
  const status = normalizeStatus(rawComplaint?.status || rawComplaint?.complaintStatus || rawComplaint?.currentStatus);
  const id = String(
    pickFirst(
      rawComplaint?._id,
      rawComplaint?.id,
      rawComplaint?.complaintId,
      rawComplaint?.ticketId,
      rawComplaint?.localId,
      `LOCAL-${Date.now()}`,
    ),
  );
  const departmentId =
    typeof rawComplaint?.department === 'string'
      ? rawComplaint.department
      : pickFirst(rawComplaint?.department?._id, rawComplaint?.department?.id, rawComplaint?.departmentId);
  const departmentName = pickFirst(rawComplaint?.department?.name, rawComplaint?.departmentName);
  const category = pickFirst(rawComplaint?.category, departmentName, 'General');
  const attachments = normalizeAttachments(rawComplaint);
  const primaryImageAttachment = attachments.find((attachment) => attachment.fileType === 'image');
  const imagePath = pickFirst(
    rawComplaint?.imageUrl,
    rawComplaint?.imagePath,
    rawComplaint?.image,
    rawComplaint?.photo,
    primaryImageAttachment?.fileUrl,
  );
  const proofPath = pickFirst(
    rawComplaint?.resolutionProofImage,
    rawComplaint?.resolutionProof,
    rawComplaint?.proofImage,
    rawComplaint?.resolutionProofUrl,
  );

  const location =
    latitude !== null && longitude !== null
      ? { lat: latitude, lng: longitude }
      : rawComplaint?.location && typeof rawComplaint.location === 'object'
      ? rawComplaint.location
      : null;

  const address = pickFirst(
    rawComplaint?.address,
    rawComplaint?.location?.address,
    rawComplaint?.fullAddress,
    location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : '',
  );

  return {
    ...rawComplaint,
    id,
    _id: pickFirst(rawComplaint?._id, id),
    status,
    category,
    departmentId: departmentId || null,
    departmentName: departmentName || category,
    description: rawComplaint?.description || rawComplaint?.details || '',
    address,
    location,
    latitude,
    longitude,
    mapsLink: buildMapsLink(latitude, longitude, rawComplaint?.mapsLink),
    priority: rawComplaint?.priority || 'Normal',
    attachments,
    imageUrl: imagePath || null,
    image: buildImageUrl(imagePath),
    resolutionProofImage: proofPath || null,
    resolutionProofUrl: buildImageUrl(proofPath),
    rejectionReason: rawComplaint?.rejectionReason || '',
    citizenName: pickFirst(
      rawComplaint?.citizen?.name,
      rawComplaint?.citizenId?.name,
      rawComplaint?.citizenName,
      rawComplaint?.user?.name,
      rawComplaint?.reportedBy?.name,
      typeof rawComplaint?.citizen === 'string' ? rawComplaint.citizen : '',
      'Citizen',
    ),
    submittedAt: pickFirst(rawComplaint?.createdAt, rawComplaint?.submittedAt, rawComplaint?.updatedAt, new Date().toISOString()),
    updatedAt: pickFirst(rawComplaint?.updatedAt, rawComplaint?.createdAt, new Date().toISOString()),
    timeline: buildTimeline(rawComplaint, status),
    isLocalOnly: Boolean(rawComplaint?.isLocalOnly),
    syncStatus: rawComplaint?.syncStatus || (rawComplaint?.isLocalOnly ? 'queued' : 'synced'),
    localId: rawComplaint?.localId || null,
  };
}

function mergeComplaintIntoList(list, complaint) {
  if (!complaint) return list;

  const matchIndex = list.findIndex(
    (item) =>
      item.id === complaint.id ||
      (complaint.localId && item.localId === complaint.localId) ||
      (item.localId && complaint.id === item.localId),
  );

  if (matchIndex === -1) return [complaint, ...list];

  const next = [...list];
  next[matchIndex] = { ...next[matchIndex], ...complaint };
  return next;
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

function buildComplaintFormData(payload) {
  const formData = new FormData();
  formData.append('citizenType', payload.citizenType || 'guest');
  formData.append('description', payload.description || '');
  formData.append('category', payload.category || '');
  formData.append('department', payload.department || '');
  formData.append('latitude', String(payload.latitude ?? ''));
  formData.append('longitude', String(payload.longitude ?? ''));
  formData.append('mapsLink', payload.mapsLink || '');

  if (payload.priority) {
    formData.append('priority', payload.priority);
  }

  return formData;
}

function appendComplaintFiles(formData, payload) {
  if (payload.imageFile) {
    formData.append('image', payload.imageFile, payload.fileName || payload.imageFile.name || 'complaint.jpg');
  }

  if (Array.isArray(payload.attachments)) {
    payload.attachments.forEach((attachment) => {
      if (attachment instanceof File || attachment instanceof Blob) {
        formData.append('attachments', attachment, attachment.name || 'attachment');
      }
    });
  }
}

function normalizeCitizenIdentifier(identifier) {
  return String(identifier || '').trim().toLowerCase();
}

function detectCitizenIdentifierType(identifier) {
  const normalizedIdentifier = normalizeCitizenIdentifier(identifier);

  if (/^\d{10}$/.test(normalizedIdentifier)) {
    return 'mobile';
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(normalizedIdentifier)) {
    return 'email';
  }

  return null;
}

function buildCitizenSession(account) {
  if (!account) return null;

  return {
    id: account.id || account._id,
    name: account.name,
    identifier: account.identifier || account.email || account.phone || '',
    identifierType: account.identifierType || (account.phone ? 'mobile' : account.email ? 'email' : null),
    role: 'citizen',
    email: account.email || '',
    phone: account.phone || '',
    token: account.token || null,
  };
}

function isStandaloneApp() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || Boolean(window.navigator.standalone);
}

function getUserAgent() {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent || '';
}

function isIosInstallBrowser() {
  if (typeof navigator === 'undefined') return false;

  const userAgent = getUserAgent();
  const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/i.test(userAgent) || isTouchMac;
}

function isChromiumInstallBrowser() {
  const userAgent = getUserAgent();
  return /(Chrome|Chromium|Edg|CriOS|EdgiOS)/i.test(userAgent) && !/(OPR|Opera|Firefox|FxiOS)/i.test(userAgent);
}

function getInstallSupportMode({ installPromptEvent, isStandaloneMode }) {
  if (isStandaloneMode) return 'installed';
  if (installPromptEvent) return 'prompt';
  if (isIosInstallBrowser()) return 'ios-manual';
  if (isChromiumInstallBrowser()) return 'browser-manual';
  return 'unsupported';
}

function getInstallHint(mode) {
  switch (mode) {
    case 'prompt':
      return 'Install this app for faster access and app-like experience.';
    case 'ios-manual':
      return 'Open the Share menu in your browser and choose Add to Home Screen.';
    case 'browser-manual':
      return 'Use the Install icon in the address bar, or open the browser menu and choose Install App.';
    default:
      return 'Install is not available on this browser yet.';
  }
}

const GENERIC_ERROR_SNIPPETS = ['server error', 'request failed', 'something went wrong', 'unexpected error', 'internal server error'];

function createRequestError(message, status = 0, payload = null) {
  const error = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
}

function extractPayloadMessage(payload) {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    return String(payload.message || payload.error || '').trim();
  }

  return '';
}

function isGenericApiMessage(message) {
  const normalized = normalizeText(message);
  return !normalized || GENERIC_ERROR_SNIPPETS.some((snippet) => normalized.includes(snippet));
}

function getDefaultErrorMessage(status) {
  if (status === 400) return 'Please review the submitted details and try again.';
  if (status === 401) return 'Please sign in with valid credentials to continue.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 409) return 'That information is already in use. Please change it and try again.';
  if (status === 422) return 'Some submitted details are invalid. Please review them and try again.';
  if (status >= 500) return 'The server hit an unexpected error. Please try again.';
  return 'The request could not be completed. Please try again.';
}

function resolveRequestErrorMessage(status, payload) {
  const payloadMessage = extractPayloadMessage(payload);
  if (payloadMessage && !isGenericApiMessage(payloadMessage)) {
    return payloadMessage;
  }

  return getDefaultErrorMessage(status);
}

function isLikelyNetworkError(error) {
  if (error?.status === 0) return true;
  const message = normalizeText(error?.message);
  return message.includes('network') || message.includes('fetch') || message.includes('failed');
}

export function AppProvider({ children }) {
  const initialToken = readStoredToken();
  const initialPayload = parseJwt(initialToken);
  const initialTokenUser = initialPayload?.user
    ? { token: initialToken, role: initialPayload.user.role, id: initialPayload.user.id, ...initialPayload.user }
    : null;
  const initialCitizenSession = initialTokenUser?.role === 'citizen'
    ? buildCitizenSession(initialTokenUser)
    : !initialToken
    ? readCitizenSession()
    : null;
  const initialAuthUser = initialTokenUser || initialCitizenSession;

  const [token, setToken] = useState(initialToken);
  const [authUser, setAuthUser] = useState(initialAuthUser);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialAuthUser));
  const [mobileCitizenUser, setMobileCitizenUser] = useState(initialCitizenSession);
  const [citizenAccounts, setCitizenAccounts] = useState(readCitizenAccounts);

  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);

  const [complaints, setComplaints] = useState([]);
  const [complaintsLoaded, setComplaintsLoaded] = useState(false);
  const [officerComplaints, setOfficerComplaints] = useState([]);
  const [officerComplaintsLoaded, setOfficerComplaintsLoaded] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState(readOfflineQueue);

  const [capturedImage, setCapturedImage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isStandaloneMode, setIsStandaloneMode] = useState(isStandaloneApp);

  const isOfficerLoggedIn = authUser?.role === 'officer';
  const isAdminLoggedIn = authUser?.role === 'admin';
  const isCitizenLoggedIn = authUser?.role === 'citizen';
  const installSupportMode = getInstallSupportMode({ installPromptEvent, isStandaloneMode });
  const canInstallApp = installSupportMode !== 'installed' && installSupportMode !== 'unsupported';
  const installAppHint = getInstallHint(installSupportMode);

  const startCitizenSession = useCallback((account) => {
    const session = buildCitizenSession(account);
    if (!session) return null;

    safeLocalStorageRemove(TOKEN_KEY);
    clearCitizenSessionStorage();
    writeCitizenSession(session);
    setToken(null);
    setAuthUser(session);
    setMobileCitizenUser(session);
    setIsAuthenticated(true);
    return session;
  }, []);

  const clearCitizenSession = useCallback(() => {
    safeLocalStorageRemove(TOKEN_KEY);
    clearCitizenSessionStorage();
    setMobileCitizenUser(null);
    if (authUser?.role === 'citizen') {
      setAuthUser(null);
      setIsAuthenticated(false);
      setToken(null);
      setComplaints([]);
      setComplaintsLoaded(false);
    }
  }, [authUser?.role]);

  const clearAuth = useCallback((options = {}) => {
    const shouldRedirect = options.redirect ?? false;

    safeLocalStorageRemove(TOKEN_KEY);

    clearCitizenSessionStorage();
    setToken(null);
    setAuthUser(null);
    setIsAuthenticated(false);
    setComplaints([]);
    setComplaintsLoaded(false);
    setOfficerComplaints([]);
    setOfficerComplaintsLoaded(false);
    setMobileCitizenUser(null);

    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.assign(isMobileDevice() ? '/mobile-login' : '/login');
    }
  }, []);

  const apiFetch = useCallback(
    async (url, options = {}) => {
      const resolvedUrl = resolveApiUrl(url);
      const currentToken = readStoredToken() || token;
      const headers = { ...(options.headers || {}) };
      const hadToken = Boolean(currentToken);

      if (currentToken) {
        headers.Authorization = `Bearer ${currentToken}`;
      } else if (options.requireAuth) {
        console.warn(`[CivicSnap] Missing token for protected request: ${resolvedUrl}`);
      }

      let body = options.body;
      if (body && !(body instanceof FormData) && typeof body !== 'string') {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      }

      let response;

      try {
        response = await fetch(resolvedUrl, {
          ...options,
          headers,
          body,
        });
      } catch (networkError) {
        throw createRequestError('We could not reach the server. Check your internet connection and try again.', 0, {
          cause: networkError?.message || '',
        });
      }

      if (response.status === 401 && hadToken) {
        clearAuth({ redirect: true });
        throw createRequestError('Session expired. Please sign in again.', 401);
      }

      const contentType = response.headers.get('content-type') || '';
      let payload = null;

      if (contentType.includes('application/json')) {
        payload = await response.json();
      } else if (response.status !== 204) {
        const text = await response.text();
        payload = text || null;
      }

      if (!response.ok) {
        throw createRequestError(resolveRequestErrorMessage(response.status, payload), response.status, payload);
      }

      return payload;
    },
    [clearAuth, token],
  );

  const uploadMultipart = useCallback(
    (url, formData, options = {}) =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const resolvedUrl = resolveApiUrl(url);
        const currentToken = readStoredToken() || token;

        xhr.open(options.method || 'POST', resolvedUrl);
        if (currentToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${currentToken}`);
        }

        xhr.upload.onprogress = (event) => {
          if (typeof options.onProgress === 'function' && event.lengthComputable) {
            options.onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          let payload = null;
          if (xhr.responseText) {
            try {
              payload = JSON.parse(xhr.responseText);
            } catch {
              payload = xhr.responseText;
            }
          }

          if (xhr.status === 401 && currentToken) {
            clearAuth({ redirect: true });
            reject(createRequestError('Session expired. Please sign in again.', 401, payload));
            return;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(payload);
            return;
          }

          reject(createRequestError(resolveRequestErrorMessage(xhr.status, payload), xhr.status, payload));
        };

        xhr.onerror = () => reject(createRequestError('We could not reach the server. Check your internet connection and try again.', 0));
        xhr.send(formData);
      }),
    [clearAuth, token],
  );

  const refreshDepartments = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const payload = await apiFetch('/api/departments');
        const departmentList = extractArray(payload, ['departments', 'data']);

        if (departmentList.length > 0) {
          setDepartments(
            departmentList.map((department) => ({
              ...department,
              _id: department._id || department.id || department.name,
              name: department.name || department.departmentName || '',
            })),
          );
          return departmentList;
        }

        if (!silent) {
          console.warn('[CivicSnap] Departments endpoint returned an empty list. Using fallback departments.');
        }
      } catch (error) {
        if (!silent) {
          console.warn(`[CivicSnap] Unable to load departments from backend: ${error.message}`);
        }
      } finally {
        setDepartmentsLoaded(true);
      }

      setDepartments(FALLBACK_DEPARTMENTS);
      return FALLBACK_DEPARTMENTS;
    },
    [apiFetch],
  );

  const getDepartmentId = useCallback(
    (categoryName) => {
      const normalizedCategory = normalizeText(categoryName);
      const matchingDepartment = departments.find((department) => normalizeText(department.name) === normalizedCategory);
      return matchingDepartment?._id || matchingDepartment?.id || null;
    },
    [departments],
  );

  const setComplaintInCollections = useCallback((complaint) => {
    const normalizedComplaint = normalizeComplaint(complaint);
    if (!normalizedComplaint) return null;

    setComplaints((currentComplaints) => mergeComplaintIntoList(currentComplaints, normalizedComplaint));
    setOfficerComplaints((currentComplaints) => mergeComplaintIntoList(currentComplaints, normalizedComplaint));
    return normalizedComplaint;
  }, []);

  const replaceLocalComplaint = useCallback((localId, complaint) => {
    const normalizedComplaint = normalizeComplaint({ ...complaint, localId: null, syncStatus: 'synced', isLocalOnly: false });

    setComplaints((currentComplaints) =>
      mergeComplaintIntoList(
        currentComplaints.filter((item) => item.id !== localId && item.localId !== localId),
        normalizedComplaint,
      ),
    );

    return normalizedComplaint;
  }, []);

  const addComplaint = useCallback(
    (complaint) => {
      const normalizedComplaint = normalizeComplaint(complaint);
      if (!normalizedComplaint) return null;
      setComplaints((currentComplaints) => mergeComplaintIntoList(currentComplaints, normalizedComplaint));
      return normalizedComplaint.id;
    },
    [],
  );

  const queueOfflineComplaint = useCallback((draft) => {
    const queueItem = {
      ...draft,
      localId: draft.localId || `LOCAL-${Date.now()}`,
      createdAt: draft.createdAt || new Date().toISOString(),
    };

    setOfflineQueue((currentQueue) => {
      const nextQueue = [queueItem, ...currentQueue.filter((item) => item.localId !== queueItem.localId)];
      writeOfflineQueue(nextQueue);
      return nextQueue;
    });

    setComplaintInCollections({
      _id: queueItem.localId,
      localId: queueItem.localId,
      category: queueItem.category,
      description: queueItem.description,
      departmentId: queueItem.department,
      latitude: queueItem.latitude,
      longitude: queueItem.longitude,
      mapsLink: queueItem.mapsLink,
      address: queueItem.address,
      attachments: queueItem.attachments,
      image: queueItem.imageDataUrl,
      imageUrl: queueItem.imageDataUrl,
      priority: queueItem.priority,
      createdAt: queueItem.createdAt,
      status: 'Pending',
      isLocalOnly: true,
      syncStatus: 'queued',
    });

    return queueItem;
  }, [setComplaintInCollections]);

  const retryOfflineComplaints = useCallback(async () => {
    if (!offlineQueue.length) return;

    for (const queuedComplaint of offlineQueue) {
      try {
        const formData = buildComplaintFormData(queuedComplaint);
        if (queuedComplaint.imageDataUrl) {
          const imageBlob = await dataUrlToBlob(queuedComplaint.imageDataUrl);
          formData.append('image', imageBlob, 'complaint.jpg');
        }
        if (Array.isArray(queuedComplaint.attachments)) {
          for (const queuedAttachment of queuedComplaint.attachments) {
            if (!queuedAttachment?.dataUrl) continue;
            const attachmentBlob = await dataUrlToBlob(queuedAttachment.dataUrl);
            formData.append('attachments', attachmentBlob, queuedAttachment.fileName || 'attachment');
          }
        }

        const payload = await apiFetch('/api/complaints', {
          method: 'POST',
          body: formData,
        });
        replaceLocalComplaint(queuedComplaint.localId, payload?.complaint || payload);

        setOfflineQueue((currentQueue) => {
          const nextQueue = currentQueue.filter((item) => item.localId !== queuedComplaint.localId);
          writeOfflineQueue(nextQueue);
          return nextQueue;
        });
      } catch (error) {
        if (!isLikelyNetworkError(error)) {
          console.warn(`[CivicSnap] Offline queue retry failed for ${queuedComplaint.localId}: ${error.message}`);
        }
        break;
      }
    }
  }, [apiFetch, offlineQueue, replaceLocalComplaint]);

  const loginWithToken = useCallback((jwtToken, roleOverride) => {
    const payload = parseJwt(jwtToken);
    const nextUser = payload?.user
      ? { token: jwtToken, role: roleOverride || payload.user.role, id: payload.user.id, ...payload.user }
      : { token: jwtToken, role: roleOverride, id: null };
    const citizenSession = nextUser?.role === 'citizen' ? buildCitizenSession({ ...nextUser, token: jwtToken }) : null;

    safeLocalStorageSet(TOKEN_KEY, jwtToken);
    if (citizenSession) {
      writeCitizenSession(citizenSession);
    } else {
      clearCitizenSessionStorage();
    }
    setToken(jwtToken);
    setAuthUser(nextUser);
    setMobileCitizenUser(citizenSession);
    setIsAuthenticated(true);
    return nextUser;
  }, []);

  const registerCitizenAccount = useCallback(async ({ name, identifier, password }) => {
    const normalizedName = String(name || '').trim();
    const normalizedIdentifier = normalizeCitizenIdentifier(identifier);
    const identifierType = detectCitizenIdentifierType(normalizedIdentifier);
    const normalizedPassword = String(password || '');

    if (!normalizedName) {
      return { success: false, message: 'Please enter your name.' };
    }

    if (!identifierType) {
      return { success: false, message: 'Use a 10-digit mobile number or a valid email address.' };
    }

    if (normalizedPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    try {
      const payload = await apiFetch('/api/auth/citizen-register', {
        method: 'POST',
        body: {
          name: normalizedName,
          identifier: normalizedIdentifier,
          password: normalizedPassword,
        },
      });

      if (!payload?.token) {
        return { success: false, message: 'Registration succeeded but no token was returned.' };
      }

      const nextUser = loginWithToken(payload.token, 'citizen');
      if (payload?.user) {
        const nextAccounts = [
          {
            id: payload.user.id,
            name: payload.user.name,
            identifier: payload.user.email || payload.user.phone || normalizedIdentifier,
            identifierType,
          },
          ...citizenAccounts.filter((account) => account.id !== payload.user.id),
        ];
        writeCitizenAccounts(nextAccounts);
        setCitizenAccounts(nextAccounts);
      }

      return {
        success: true,
        account: buildCitizenSession(nextUser),
      };
    } catch (error) {
      return { success: false, message: error.message || 'Unable to create your citizen account.' };
    }
  }, [apiFetch, citizenAccounts, loginWithToken]);

  const loginCitizenAccount = useCallback(async ({ identifier, password }) => {
    const normalizedIdentifier = normalizeCitizenIdentifier(identifier);
    const normalizedPassword = String(password || '');

    if (!normalizedIdentifier || !normalizedPassword) {
      return { success: false, message: 'Enter your mobile number or email and password.' };
    }

    try {
      const payload = await apiFetch('/api/auth/citizen-login', {
        method: 'POST',
        body: {
          identifier: normalizedIdentifier,
          password: normalizedPassword,
        },
      });

      if (!payload?.token) {
        return { success: false, message: 'Login succeeded but no token was returned.' };
      }

      const nextUser = loginWithToken(payload.token, 'citizen');
      return {
        success: true,
        account: buildCitizenSession(nextUser),
      };
    } catch (error) {
      return { success: false, message: error.message || 'No citizen account matched those credentials.' };
    }
  }, [apiFetch, loginWithToken]);

  const installApp = useCallback(async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      setInstallPromptEvent(null);
      if (choice?.outcome === 'accepted') {
        return { success: true, message: 'CivicSnap was added to your device.' };
      }

      return { success: false, message: 'Install prompt was dismissed.' };
    }

    return { success: false, manual: true, message: getInstallHint(installSupportMode) };
  }, [installPromptEvent, installSupportMode]);

  const loginDesktop = useCallback(
    async ({ username, password, role }) => {
      if (role === 'citizen') {
        const result = await loginCitizenAccount({ identifier: username, password });
        return result.success
          ? { success: true, role: 'citizen' }
          : { success: false, message: result.message };
      }

      const endpoint =
        role === 'admin'
          ? '/api/auth/admin-login'
          : role === 'officer'
          ? '/api/auth/officer-login'
          : null;

      if (!endpoint) {
        return { success: false, message: 'Unsupported role selected.' };
      }

      try {
        const payload = await apiFetch(endpoint, {
          method: 'POST',
          body: {
            email: username.trim(),
            password,
          },
        });

        if (!payload?.token) {
          return { success: false, message: 'Login succeeded but no token was returned.' };
        }

        loginWithToken(payload.token, role);
        if (role === 'admin') {
          refreshDepartments({ silent: true }).catch(() => {});
        }

        return { success: true, role };
      } catch (error) {
        return { success: false, message: error.message || 'Login failed.' };
      }
    },
    [apiFetch, loginCitizenAccount, loginWithToken, refreshDepartments],
  );

  const logoutDesktop = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const loginMobile = useCallback((credentials) => loginCitizenAccount({
    identifier: credentials.identifier || credentials.username,
    password: credentials.password,
  }), [loginCitizenAccount]);

  const logoutMobile = useCallback(() => {
    clearCitizenSession();
  }, [clearCitizenSession]);

  const fetchComplaints = useCallback(async () => {
    if (!token) return [];

    const payload = await apiFetch('/api/complaints', { requireAuth: true });
    const list = extractArray(payload, ['complaints', 'data']).map(normalizeComplaint).filter(Boolean);
    setComplaints(list);
    setComplaintsLoaded(true);
    return list;
  }, [apiFetch, token]);

  const fetchComplaintById = useCallback(
    async (id) => {
      if (!id) return null;

      const existingComplaint = complaints.find((complaint) => complaint.id === id);
      if (!token && existingComplaint) return existingComplaint;
      if (!token) return null;

      const payload = await apiFetch(`/api/complaints/${id}`, { requireAuth: true });
      return setComplaintInCollections(payload?.complaint || payload);
    },
    [apiFetch, complaints, setComplaintInCollections, token],
  );

  const createComplaint = useCallback(
    async (payload, options = {}) => {
      const formData = buildComplaintFormData(payload);
      appendComplaintFiles(formData, payload);

      const response = await uploadMultipart('/api/complaints', formData, {
        method: 'POST',
        onProgress: options.onProgress,
      });

      return setComplaintInCollections(response?.complaint || response);
    },
    [setComplaintInCollections, uploadMultipart],
  );

  const submitReview = useCallback(
    async ({ complaintId, rating, feedback, imageFile }) => {
      const formData = new FormData();
      formData.append('complaintId', complaintId);
      formData.append('rating', String(rating));

      if (feedback) {
        formData.append('feedback', feedback);
      }

      if (imageFile) {
        formData.append('image', imageFile, imageFile.name || 'review.jpg');
      }

      const response = await apiFetch('/api/reviews', {
        method: 'POST',
        body: formData,
        requireAuth: true,
      });

      if (complaintId) {
        fetchComplaintById(complaintId).catch(() => {});
      }

      return response;
    },
    [apiFetch, fetchComplaintById],
  );

  const fetchOfficerComplaints = useCallback(async () => {
    if (!token) return [];

    const payload = await apiFetch('/api/officer/complaints', { requireAuth: true });
    const list = extractArray(payload, ['complaints', 'data']).map(normalizeComplaint).filter(Boolean);
    setOfficerComplaints(list);
    setOfficerComplaintsLoaded(true);
    return list;
  }, [apiFetch, token]);

  const updateOfficerComplaint = useCallback((id, updates) => {
    setOfficerComplaints((currentComplaints) =>
      currentComplaints.map((complaint) =>
        complaint.id === id ? { ...complaint, ...updates } : complaint,
      ),
    );
  }, []);

  const officerAccept = useCallback(
    async (id) => {
      updateOfficerComplaint(id, { status: 'In Progress' });
      const response = await apiFetch(`/api/officer/accept/${id}`, {
        method: 'PUT',
        requireAuth: true,
      });
      await fetchOfficerComplaints();
      return response;
    },
    [apiFetch, fetchOfficerComplaints, updateOfficerComplaint],
  );

  const officerReject = useCallback(
    async (id, rejectionReason) => {
      updateOfficerComplaint(id, { status: 'Rejected', rejectionReason });
      const response = await apiFetch(`/api/officer/reject/${id}`, {
        method: 'PUT',
        body: { rejectionReason },
        requireAuth: true,
      });
      await fetchOfficerComplaints();
      return response;
    },
    [apiFetch, fetchOfficerComplaints, updateOfficerComplaint],
  );

  const officerResolve = useCallback(
    async (id, proofFile) => {
      updateOfficerComplaint(id, { status: 'Resolved' });
      const formData = new FormData();

      if (proofFile) {
        formData.append('image', proofFile, proofFile.name || 'resolution-proof.jpg');
      }

      const response = await apiFetch(`/api/officer/resolve/${id}`, {
        method: 'PUT',
        body: formData,
        requireAuth: true,
      });
      await fetchOfficerComplaints();
      return response;
    },
    [apiFetch, fetchOfficerComplaints, updateOfficerComplaint],
  );

  const officerTransfer = useCallback(
    async (id, departmentId) => {
      const response = await apiFetch(`/api/officer/transfer/${id}`, {
        method: 'PUT',
        body: { department: departmentId },
        requireAuth: true,
      });
      await fetchOfficerComplaints();
      return response;
    },
    [apiFetch, fetchOfficerComplaints],
  );

  const setIsOfficerLoggedIn = useCallback(
    (value) => {
      if (!value) logoutDesktop();
    },
    [logoutDesktop],
  );
  const setIsAdminLoggedIn = useCallback(
    (value) => {
      if (!value) logoutDesktop();
    },
    [logoutDesktop],
  );
  const setIsCitizenLoggedIn = useCallback(
    (value) => {
      if (!value) logoutDesktop();
    },
    [logoutDesktop],
  );

  useEffect(() => {
    refreshDepartments({ silent: true });
  }, [refreshDepartments]);

  useEffect(() => {
    if (!token || !authUser?.role) return;

    if (authUser.role === 'citizen') {
      fetchComplaints().catch(() => {
        setComplaintsLoaded(true);
      });
    }

    if (authUser.role === 'officer') {
      fetchOfficerComplaints().catch(() => {
        setOfficerComplaintsLoaded(true);
      });
    }

    if (authUser.role === 'admin') {
      refreshDepartments({ silent: true });
    }
  }, [authUser?.role, fetchComplaints, fetchOfficerComplaints, refreshDepartments, token]);

  useEffect(() => {
    const handleOnline = () => {
      retryOfflineComplaints().catch(() => {});
    };

    window.addEventListener('online', handleOnline);
    if (navigator.onLine && offlineQueue.length > 0) {
      retryOfflineComplaints().catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [offlineQueue.length, retryOfflineComplaints]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
      setIsStandaloneMode(isStandaloneApp());
    };

    const handleInstalled = () => {
      setInstallPromptEvent(null);
      setIsStandaloneMode(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const user = {
    name: mobileCitizenUser?.name || authUser?.name || 'Guest Citizen',
    totalComplaints: complaints.length,
    validComplaints: complaints.filter((complaint) => complaint.status !== 'Rejected').length,
  };

  return (
    <AppContext.Provider
      value={{
        API_BASE,
        apiFetch,
        buildImageUrl,
        clearAuth,
        token,
        authUser,
        isAuthenticated,
        isOfficerLoggedIn,
        isAdminLoggedIn,
        isCitizenLoggedIn,
        loginDesktop,
        loginWithToken,
        registerCitizenAccount,
        logoutDesktop,
        loginMobile,
        logoutMobile,
        mobileCitizenUser,
        citizenAccounts,
        setIsOfficerLoggedIn,
        setIsAdminLoggedIn,
        setIsCitizenLoggedIn,
        departments,
        departmentsLoaded,
        refreshDepartments,
        getDepartmentId,
        complaints,
        complaintsLoaded,
        setComplaints,
        addComplaint,
        fetchComplaints,
        fetchComplaintById,
        createComplaint,
        submitReview,
        queueOfflineComplaint,
        retryOfflineComplaints,
        offlineQueueCount: offlineQueue.length,
        officerComplaints,
        officerComplaintsLoaded,
        fetchOfficerComplaints,
        updateOfficerComplaint,
        officerAccept,
        officerReject,
        officerResolve,
        officerTransfer,
        capturedImage,
        setCapturedImage,
        sidebarOpen,
        setSidebarOpen,
        canInstallApp,
        installApp,
        installAppHint,
        installSupportMode,
        isStandaloneMode,
        user,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
