import React, { useState } from 'react';
import Modal from '../common/Modal';
import RatingStars from '../common/RatingStars';
import { reviewsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Star } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, loan, onReviewSubmitted, currentUserId }) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const isBorrower = loan?.borrower?._id === currentUserId || loan?.borrower === currentUserId;
  const counterpartyName = isBorrower ? loan?.owner?.name : loan?.borrower?.name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loan) return;

    try {
      setLoading(true);
      await reviewsApi.create({
        loan: loan._id,
        rating,
        comment,
      });

      showToast('Thank you! Your review has been published.', 'success');
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Community Review"
      subtitle={`Review for loan of "${loan?.item?.title}"`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            How was your experience sharing with <strong>{counterpartyName || 'the community member'}</strong>?
          </p>
          <div className="flex justify-center">
            <RatingStars
              rating={rating}
              interactive={true}
              size="w-8 h-8"
              onChange={(newRating) => setRating(newRating)}
            />
          </div>
          <span className="inline-block mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
            {rating === 5 ? 'Excellent (5 Stars)' : `${rating} Stars`}
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Your Feedback & Comments
          </label>
          <textarea
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            placeholder="Share details on equipment condition, communication, punctuality..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
          >
            <Star className="w-4 h-4 fill-white" />
            <span>{loading ? 'Submitting...' : 'Post Review'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReviewModal;
