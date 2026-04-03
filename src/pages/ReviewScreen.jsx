import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2, Star, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const LABELS = ['', 'Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'];

export default function ReviewScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { submitReview, token } = useApp();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [afterImage, setAfterImage] = useState(null);
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAfterImageFile(file);
    const reader = new FileReader();
    reader.onload = (loadEvent) => setAfterImage(loadEvent.target?.result || null);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!token) {
      setError('You need to sign in before submitting a review.');
      return;
    }

    if (rating === 0 || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await submitReview({
        complaintId: id,
        rating,
        feedback: feedback.trim(),
        imageFile: afterImageFile,
      });
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => navigate(`/complaint/${id}`), 1500);
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit your review right now.');
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="screen bg-cs-bg items-center justify-center gap-5 px-6">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-cs-ink">Login Required</h2>
          <p className="text-cs-muted text-sm mt-1.5">
            Reviews are linked to registered accounts, so please sign in before submitting one.
          </p>
        </div>
        <button type="button" onClick={() => navigate('/login')} className="btn-primary w-auto px-6">
          Go to Login
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="screen bg-cs-bg items-center justify-center gap-5 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-cs-ink">Thank you!</h2>
          <p className="text-cs-muted text-sm mt-1.5">Your feedback helps improve civic services.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen bg-cs-bg">
      <div className="page-header">
        <button type="button" onClick={() => navigate(-1)} className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="page-title">Leave Review</span>
        <div className="w-9" />
      </div>

      <div className="scrollable">
        <div className="px-4 py-6 flex flex-col gap-5 bottom-safe">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">
                Complaint <strong>{id}</strong> resolved
              </span>
            </span>
          </div>

          <div className="card text-center">
            <p className="text-cs-muted text-sm mb-4">How satisfied are you with the resolution?</p>
            <div className="flex items-center justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform duration-100 active:scale-90"
                  id={`star-${star}`}
                >
                  <Star
                    className="w-10 h-10 transition-colors duration-100"
                    fill={star <= (hoveredRating || rating) ? '#F59E0B' : 'transparent'}
                    stroke={star <= (hoveredRating || rating) ? '#F59E0B' : '#D1D5DB'}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="inline-flex items-center px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-700 text-sm font-medium">
                {LABELS[rating]}
              </span>
            )}
          </div>

          <div>
            <label className="label">
              After-resolution photo <span className="text-cs-muted/50 lowercase tracking-normal">(optional)</span>
            </label>
            {afterImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-cs-border h-40 shadow-card">
                <img src={afterImage} alt="After resolution" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setAfterImage(null);
                    setAfterImageFile(null);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-xs"
                >
                  x
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <div className="border-2 border-dashed border-cs-border rounded-xl h-28 flex flex-col items-center justify-center gap-2 hover:border-accent/40 hover:bg-cs-subtle transition-all">
                  <Upload className="w-6 h-6 text-cs-muted/40" />
                  <p className="text-cs-muted text-sm">Tap to upload photo</p>
                  <p className="text-cs-muted/50 text-xs">Show the issue is fixed</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          <div>
            <label className="label" htmlFor="feedback">
              Feedback <span className="text-cs-muted/50 lowercase tracking-normal">(optional)</span>
            </label>
            <textarea
              id="feedback"
              className="input-field resize-none"
              rows={4}
              placeholder="Tell us about your experience with the resolution..."
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            id="submit-review-btn"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Star className="w-4 h-4" /> Submit Review
              </>
            )}
          </button>
          {rating === 0 && <p className="text-center text-cs-muted text-xs -mt-3">Please select a star rating to continue</p>}
        </div>
      </div>
    </div>
  );
}
