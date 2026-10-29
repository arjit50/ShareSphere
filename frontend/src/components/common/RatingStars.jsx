import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({
  rating = 0,
  totalReviews = null,
  max = 5,
  size = 'w-4 h-4',
  interactive = false,
  onChange = () => {},
}) => {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[...Array(max)].map((_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= Math.round(rating);

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange(starValue)}
              className={`p-0.5 transition-transform ${
                interactive ? 'cursor-pointer hover:scale-125 focus:outline-hidden' : 'cursor-default'
              }`}
            >
              <Star
                className={`${size} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-200 text-slate-300 dark:fill-slate-700 dark:text-slate-600'
                }`}
              />
            </button>
          );
        })}
      </div>
      {rating > 0 && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-0.5">
          {rating.toFixed(1)}
        </span>
      )}
      {totalReviews !== null && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
