import { Review } from '@/app/data/types';
import { useApp } from '@/app/context/AppContext';
import { StarRating } from './StarRating';

interface ReviewListProps {
  reviews: Review[];
  onDeleted: () => void;
}

export function ReviewList({ reviews, onDeleted }: ReviewListProps) {
  const { user, deleteReview } = useApp();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await deleteReview(id);
      onDeleted();
    } catch (err) {
      console.error(err);
    }
  };

  if (reviews.length === 0) {
    return <p className="text-neutral-500 text-sm py-4">No reviews yet.</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map(review => {
        const canDelete = !!user && (user.id === review.userId || user.role === 'admin' || user.role === 'staff');
        return (
          <div key={review.id} className="border-b border-neutral-200 pb-6">
            <div className="flex items-center justify-between mb-2">
              <StarRating value={review.rating} />
              <span className="text-xs text-neutral-500">{review.createdAt.slice(0, 10)}</span>
            </div>
            <p className="text-sm text-neutral-700 mb-2">{review.comment}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">{review.userName || 'Anonymous'}</span>
              {canDelete && (
                <button
                  onClick={() => handleDelete(review.id)}
                  className="text-xs text-neutral-500 hover:text-black underline"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
