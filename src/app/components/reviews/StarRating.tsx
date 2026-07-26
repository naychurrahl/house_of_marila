import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 16 }: StarRatingProps) {
  const isInteractive = !!onChange;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!isInteractive}
          onClick={() => onChange?.(star)}
          className={isInteractive ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            width={size}
            height={size}
            fill={star <= value ? 'black' : 'none'}
            stroke="black"
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
