import { useEffect, useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Review } from '@/app/data/types';
import { StarRating } from '@/app/components/reviews/StarRating';
import { ReviewForm } from '@/app/components/reviews/ReviewForm';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/app/components/ui/dialog';

// Highlight reel: the 2 most recent reviews plus 3 random others, regardless
// of rating - re-shuffled whenever the underlying review list changes.
function pickHighlights(reviews: Review[]): Review[] {
  const sorted = [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = sorted.slice(0, 2);
  const rest = sorted.slice(2).sort(() => Math.random() - 0.5);
  return [...latest, ...rest.slice(0, 3)];
}

export function TestimonialsCarousel() {
  const { fetchReviews } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [highlights, setHighlights] = useState<Review[]>([]);
  const [index, setIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const load = () => {
    fetchReviews('site')
      .then(data => setReviews(data.reviews))
      .catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setHighlights(pickHighlights(reviews));
    setIndex(0);
  }, [reviews]);

  useEffect(() => {
    if (highlights.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(current => (current + 1) % highlights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [highlights]);

  const rateUsButton = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button className="inline-block bg-black text-white px-8 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors">
          RATE US
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate your experience</DialogTitle>
        </DialogHeader>
        <ReviewForm
          subjectType="site"
          onSubmitted={() => {
            setIsDialogOpen(false);
            load();
          }}
        />
      </DialogContent>
    </Dialog>
  );

  if (highlights.length === 0) {
    return (
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl mb-4 tracking-tight">Testimonials</h2>
        <p className="text-neutral-500 mb-6">Be the first to share your experience.</p>
        {rateUsButton}
      </section>
    );
  }

  const current = highlights[index];

  return (
    <section className="py-16 px-4 text-center bg-neutral-50">
      <h2 className="text-2xl mb-8 tracking-tight">Testimonials</h2>

      <div className="max-w-xl mx-auto min-h-[140px] flex flex-col items-center justify-center">
        <StarRating value={current.rating} />
        <p className="text-neutral-700 my-4 leading-relaxed">&ldquo;{current.comment}&rdquo;</p>
        <span className="text-sm text-neutral-500">{current.userName || 'Customer'}</span>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 mb-8">
        {highlights.map((review, i) => (
          <button
            key={review.id}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-black' : 'bg-neutral-300'}`}
            aria-label={`View testimonial ${i + 1}`}
          />
        ))}
      </div>

      {rateUsButton}
    </section>
  );
}
