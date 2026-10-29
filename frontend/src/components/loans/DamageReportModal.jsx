import React, { useState } from 'react';
import Modal from '../common/Modal';
import { damageReportsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle } from 'lucide-react';

const DamageReportModal = ({ isOpen, onClose, loan, onReportSubmitted }) => {
  const { showToast } = useToast();
  const [damageType, setDamageType] = useState('broken');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loan) return;

    if (!description.trim() || description.length < 10) {
      showToast('Please provide a detailed description (at least 10 characters)', 'error');
      return;
    }

    try {
      setLoading(true);
      await damageReportsApi.create({
        loan: loan._id,
        damageType,
        severity,
        description,
        estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
        evidenceImages: evidenceUrl ? [evidenceUrl] : [],
      });

      showToast('Damage report filed. Item moved to Maintenance status.', 'success');
      if (onReportSubmitted) onReportSubmitted();
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
      title="File Resource Damage Report"
      subtitle={`Damage claim for "${loan?.item?.title}"`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Damage Category
            </label>
            <select
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="cosmetic">Cosmetic (Scratches/Dents)</option>
              <option value="functional">Functional (Motor/Mechanism)</option>
              <option value="broken">Broken / Structural Crack</option>
              <option value="lost_parts">Missing / Lost Accessories</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="low">Low (Minor Repairable)</option>
              <option value="medium">Medium (Significant)</option>
              <option value="high">High (Major Repair Needed)</option>
              <option value="total_loss">Total Loss (Needs Replacement)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Detailed Incident Description
          </label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            placeholder="Explain how the damage occurred, what components were affected, and current condition..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Estimated Repair Cost ($)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              placeholder="e.g. 45"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Evidence Photo URL (Optional)
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
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
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{loading ? 'Submitting...' : 'Submit Damage Report'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DamageReportModal;
