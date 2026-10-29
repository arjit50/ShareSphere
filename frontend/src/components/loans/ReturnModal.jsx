import React, { useState } from 'react';
import Modal from '../common/Modal';
import { returnsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { RotateCcw, AlertTriangle } from 'lucide-react';

const ReturnModal = ({ isOpen, onClose, loan, onReturnCompleted }) => {
  const { showToast } = useToast();
  const [conditionOnReturn, setConditionOnReturn] = useState('same');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loan) return;

    try {
      setLoading(true);
      await returnsApi.processReturn(loan._id, {
        conditionOnReturn,
        notes,
      });

      showToast('Item return successfully recorded!', 'success');
      if (onReturnCompleted) onReturnCompleted();
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
      title="Record Resource Return"
      subtitle={`Return of "${loan?.item?.title}"`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Physical Condition upon Return
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'same', label: 'Same / Excellent', desc: 'No noticeable wear' },
              { id: 'minor_wear', label: 'Minor Wear', desc: 'Normal cosmetic use' },
              { id: 'damaged', label: 'Damaged', desc: 'Defect or breakage' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setConditionOnReturn(option.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  conditionOnReturn === option.id
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{option.label}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {option.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {conditionOnReturn === 'damaged' && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Marking this item as damaged will automatically transition its status to 'Maintenance'
              and allow filing a detailed damage claim report.
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Return Notes (Optional)
          </label>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cleanliness, accessories returned, or handover feedback..."
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
            <RotateCcw className="w-4 h-4" />
            <span>{loading ? 'Processing...' : 'Confirm Return'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReturnModal;
