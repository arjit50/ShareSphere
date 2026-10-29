import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import RatingStars from '../common/RatingStars';
import CategoryIcon from '../common/CategoryIcon';
import { MapPin, Shield } from 'lucide-react';

const ItemCard = ({ item }) => {
  const primaryImage =
    item.images?.find((img) => img.isPrimary)?.url ||
    item.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Top Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={primaryImage}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Status Badge overlay */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={item.availabilityStatus} />
        </div>

        {/* Condition tag */}
        <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
          {item.condition}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
            <CategoryIcon name={item.category?.icon} className="w-3.5 h-3.5" />
            <span className="truncate">{item.category?.name || 'General Resource'}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2 transition-colors mb-2">
            <Link to={`/items/${item._id}`}>
              <span className="absolute inset-0" />
              {item.title}
            </Link>
          </h3>

          {/* Location & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
            <div className="flex items-center gap-1 truncate max-w-[65%]">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {item.location?.area ? `${item.location.area}, ` : ''}
                {item.location?.city || 'Greenwood'}
              </span>
            </div>
            <RatingStars rating={item.averageRating || 0} totalReviews={item.totalReviews} />
          </div>
        </div>

        {/* Footer info: Value & Owner */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Valued at:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              ${item.replacementValue}
            </span>
          </div>

          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            Details →
          </span>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
