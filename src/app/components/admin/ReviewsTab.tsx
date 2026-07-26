import { useApp } from '@/app/context/AppContext';
import { StarRating } from '@/app/components/reviews/StarRating';

export function ReviewsTab() {
  const { allReviews, deleteReview, fetchAllReviews } = useApp();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await deleteReview(id);
      fetchAllReviews();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="overflow-x-auto">
      {allReviews.length === 0 ? (
        <p className="text-neutral-500 py-12 text-center">No reviews yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200">
              <th className="pb-2 pr-4 font-normal">Subject</th>
              <th className="pb-2 pr-4 font-normal">Rating</th>
              <th className="pb-2 pr-4 font-normal">Comment</th>
              <th className="pb-2 pr-4 font-normal">Author</th>
              <th className="pb-2 pr-4 font-normal">Date</th>
              <th className="pb-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {allReviews.map(review => (
              <tr key={review.id} className="border-b border-neutral-200 align-top">
                <td className="py-3 pr-4">
                  <span className="text-xs px-2 py-1 bg-neutral-100 tracking-wide uppercase">
                    {review.subjectType}
                  </span>
                  <div className="text-xs text-neutral-500 font-mono mt-1">{review.subjectId}</div>
                </td>
                <td className="py-3 pr-4">
                  <StarRating value={review.rating} />
                </td>
                <td className="py-3 pr-4 max-w-xs truncate">{review.comment}</td>
                <td className="py-3 pr-4 text-neutral-500">{review.userName || 'Anonymous'}</td>
                <td className="py-3 pr-4 text-neutral-500">{review.createdAt.slice(0, 10)}</td>
                <td className="py-3">
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-xs text-neutral-500 hover:text-black underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
