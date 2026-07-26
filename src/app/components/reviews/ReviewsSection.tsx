import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { Review, ReviewSubjectType } from '@/app/data/types';
import { StarRating } from './StarRating';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';

interface ReviewsSectionProps {
  subjectType: ReviewSubjectType;
  subjectId: string;
}

export function ReviewsSection({ subjectType, subjectId }: ReviewsSectionProps) {
  const { user, fetchReviews } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);

  const load = () => {
    fetchReviews(subjectType, subjectId)
      .then(data => {
        setReviews(data.reviews);
        setAverage(data.average);
        setCount(data.count);
      })
      .catch(console.error);
  };

  useEffect(() => {
    load();
    // Reload whenever the subject changes (e.g. navigating between products).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectType, subjectId]);

  return (
    <section className="py-12 px-4 border-t border-neutral-200">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl tracking-tight">Reviews</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(average)} />
            <span className="text-sm text-neutral-500">
              {average.toFixed(1)} ({count})
            </span>
          </div>
        )}
      </div>

      <ReviewList reviews={reviews} onDeleted={load} />

      <div className="mt-8 pt-8 border-t border-neutral-200">
        {user ? (
          <ReviewForm subjectType={subjectType} subjectId={subjectId} onSubmitted={load} />
        ) : (
          <p className="text-sm text-neutral-500">
            <Link to="/account" className="underline">Log in</Link> to leave a review.
          </p>
        )}
      </div>
    </section>
  );
}
