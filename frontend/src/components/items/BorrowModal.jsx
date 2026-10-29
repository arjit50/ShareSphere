import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { borrowRequestsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const BorrowModal = ({ isOpen, onClose, item, onRequestSubmitted }) => {
  const { showToast } = useToast();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfterTomorrow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState(dayAfterTomorrow);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);

  // Live availability check on date changes
  useEffect(() => {
    if (!item || !startDate || !endDate || new Date(startDate) >= new Date(endDate)) {
      setAvailabilityResult(null);
      return;
    }

    const check = async () => {
      try {
        setCheckingAvailability(true);
        const res = await borrowRequestsApi.checkAvailability({
          itemId: item._id,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        });
        setAvailabilityResult(res.data);
      } catch (err) {
        console.error('Availability check failed:', err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const timer = setTimeout(check, 300);
    return () => clearTimeout(timer);
  }, [item, startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      showToast('Please select start and end dates', 'error');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      showToast('End date must be after start date', 'error');
      return;
    }

    if (availabilityResult && !availabilityResult.available) {
      showToast(availabilityResult.reason || 'Selected dates conflict with an existing reservation', 'error');
      return;
    }

    try {
      setLoading(true);
      await borrowRequestsApi.create({
        item: item._id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        message,
      });

      showToast('Borrow request submitted to owner successfully!', 'success');
      if (onRequestSubmitted) onRequestSubmitted();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = e - s;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request to Borrow Item"
      subtitle={`Lending request for "${item?.title}"`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Summary Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <img
            src={item?.images?.[0]?.url || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f'}
            alt={item?.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {item?.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Owner: {item?.owner?.name} • Replacement Value: ${item?.replacementValue}
            </p>
          </div>
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Start Date (Pickup)
            </label>
            <div className="relative">
              <input
                type="date"
                min={tomorrow}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              End Date (Return Due)
            </label>
            <div className="relative">
              <input
                type="date"
                min={startDate || tomorrow}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Days Count & Availability feedback */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Duration: <strong>{calculateDays()} days</strong>
          </span>

          {checkingAvailability ? (
            <span className="text-slate-400 animate-pulse">Checking availability...</span>
          ) : availabilityResult ? (
            availabilityResult.available ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Available for these dates
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                Date conflict
              </span>
            )
          ) : null}
        </div>

        {availabilityResult && !availabilityResult.available && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{availabilityResult.reason}</span>
          </div>
        )}

        {/* Note / Message */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Message to Owner (Optional)
          </label>
          <textarea
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share what project you will use it for and confirm your planned pickup time..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Modal Actions */}
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
            disabled={
              loading ||
              (availabilityResult && !availabilityResult.available) ||
              calculateDays() <= 0
            }
            className={`px-5 py-2 text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all ${
              loading || (availabilityResult && !availabilityResult.available) || calculateDays() <= 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-[1.02]'
            }`}
          >
            {loading ? 'Submitting...' : 'Send Borrow Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BorrowModal;
