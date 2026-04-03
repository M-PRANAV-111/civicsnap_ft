import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  PlusCircle, Clock, CheckCircle2, XCircle,
  MapPin, ChevronRight, FileText, BarChart2, ArrowRight,
  Loader2
} from 'lucide-react';

const CATEGORIES = [
  'Municipal / GHMC', 'Electricity', 'Water Supply',
  'Roads & Footpaths', 'Traffic Police', 'Sanitation', 'Other',
];

const STATUS_CONFIG = {
  Pending:     { color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
  'In Progress': { color: '#3B82F6', bg: '#EFF6FF', icon: BarChart2 },
  Resolved:    { color: '#10B981', bg: '#ECFDF5', icon: CheckCircle2 },
  Rejected:    { color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { color: '#6B7280', bg: '#F3F4F6', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function CitizenDesktopHome({ onViewAll, highlightForm }) {
  const { complaints, addComplaint } = useApp();

  // Quick-submit form ref — for scroll-to & highlight on button click
  const formRef = useRef(null);
  const [formHighlighted, setFormHighlighted] = useState(false);
  const [form, setForm] = useState({ description: '', category: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  // When parent signals a highlight (counter changes), scroll to and pulse the form
  useEffect(() => {
    if (!highlightForm) return;
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFormHighlighted(true);
    const t = setTimeout(() => setFormHighlighted(false), 1800);
    return () => clearTimeout(t);
  }, [highlightForm]);

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
  };

  const recent = complaints.slice(0, 5);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.category || !form.address.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    const id = addComplaint({
      description: form.description.trim(),
      category: form.category,
      address: form.address.trim(),
      location: { lat: 17.385, lng: 78.4867 },
      image: null,
    });
    setSubmitting(false);
    setSubmitted(id);
    setForm({ description: '', category: '', address: '' });
    setTimeout(() => setSubmitted(null), 4000);
  };

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Welcome banner */}
      <div className="rounded-2xl px-6 py-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, var(--cs-accent) 0%, #1e40af 100%)' }}>
        <div>
          <p className="text-blue-200 text-sm font-medium mb-1">Citizen Portal</p>
          <h2 className="text-white text-xl font-bold">Track &amp; Report Civic Issues</h2>
          <p className="text-blue-200 text-sm mt-1">
            Submit complaints and monitor real-time resolution status from anywhere.
          </p>
        </div>
        <button
          onClick={() => {
            setSubmitted(null);
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setFormHighlighted(true);
            setTimeout(() => setFormHighlighted(false), 1800);
          }}
          id="new-complaint-banner"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 flex-shrink-0"
          style={{ background: '#fff', color: 'var(--cs-accent)', border: 'none', cursor: 'pointer' }}
        >
          <PlusCircle className="w-4 h-4" />
          File a Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Filed', value: stats.total, color: '#6366F1', bg: '#EEF2FF', icon: FileText },
          { label: 'Pending', value: stats.pending, color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
          { label: 'In Progress', value: stats.inProgress, color: '#3B82F6', bg: '#EFF6FF', icon: BarChart2 },
          { label: 'Resolved', value: stats.resolved, color: '#10B981', bg: '#ECFDF5', icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-4 border"
            style={{ background: 'var(--cs-card)', borderColor: 'var(--cs-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--cs-ink)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent complaints */}
        <div className="rounded-2xl border" style={{ background: 'var(--cs-card)', borderColor: 'var(--cs-border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--cs-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>Recent Complaints</h3>
            <button onClick={onViewAll} className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--cs-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              id="view-all-complaints">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--cs-border)' }}>
            {recent.map(c => (
              <div key={c.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--cs-ink)' }}>
                    {c.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--cs-muted)' }} />
                    <p className="text-xs truncate" style={{ color: 'var(--cs-muted)' }}>{c.address}</p>
                  </div>
                </div>
                <StatusPill status={c.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick submit / form */}
        <div
          ref={formRef}
          className="rounded-2xl border transition-all duration-300"
          style={{
            background: 'var(--cs-card)',
            borderColor: formHighlighted ? 'var(--cs-accent)' : 'var(--cs-border)',
            boxShadow: formHighlighted ? '0 0 0 3px rgba(29,78,216,0.15)' : 'none',
          }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--cs-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>Quick Submit</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>File a new complaint directly from here</p>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: '#ECFDF5' }}>
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>Complaint Submitted!</p>
              <p className="text-xs text-center" style={{ color: 'var(--cs-muted)' }}>
                Your complaint ID is <span className="font-bold" style={{ color: 'var(--cs-ink)' }}>{submitted}</span>.
                We'll notify you of updates.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
              <div>
                <label className="label" htmlFor="qs-category">Category</label>
                <select
                  id="qs-category"
                  className="input-field"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  required
                >
                  <option value="">Select a category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="qs-address">Location / Address</label>
                <input
                  id="qs-address"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Ameerpet, Hyderabad"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="qs-description">Description</label>
                <textarea
                  id="qs-description"
                  className="input-field"
                  style={{ resize: 'none', minHeight: '80px' }}
                  placeholder="Describe the civic issue in detail…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !form.description.trim() || !form.category || !form.address.trim()}
                className="btn-primary"
                id="qs-submit"
                style={{
                  opacity: (submitting || !form.description.trim() || !form.category || !form.address.trim()) ? 0.5 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  : <><span>Submit Complaint</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
