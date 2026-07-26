import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { ReviewSubjectType } from '@/app/data/types';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  subjectType: ReviewSubjectType;
  subjectId?: string;
  onSubmitted: () => void;
}

export function ReviewForm({ subjectType, subjectId, onSubmitted }: ReviewFormProps) {
  const { addReview } = useApp();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !comment.trim()) {
      setError('Please select a rating and add a comment');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await addReview({ subjectType, subjectId, rating, comment: comment.trim() });
      setRating(0);
      setComment('');
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <StarRating value={rating} onChange={setRating} size={20} />
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your thoughts..."
        rows={3}
        className="w-full px-3 py-2 border border-neutral-300 text-sm outline-none focus:border-black"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={isSaving}
        className="px-6 py-2 bg-black text-white text-sm tracking-wide hover:bg-neutral-800 transition-colors disabled:bg-neutral-300"
      >
        {isSaving ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
      </button>
    </div>
  );
}
