import React, { useState, useEffect } from 'react';
import { damageReportsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { AlertTriangle, DollarSign, Clock, CheckCircle } from 'lucide-react';

const DamageReportsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Admin resolution modal
  const [resolvingReport, setResolvingReport] = useState(null);
  const [resolveStatus, setResolveStatus] = useState('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await damageReportsApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setReports(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const openResolveModal = (rep) => {
    setResolvingReport(rep);
    setResolveStatus('resolved');
    setResolutionNotes(rep.resolutionNotes || '');
    setEstimatedCost(rep.estimatedCost || 0);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingReport) return;

    try {
      setResolveLoading(true);
      await damageReportsApi.updateResolution(resolvingReport._id, {
        status: resolveStatus,
        resolutionNotes,
        estimatedCost: Number(estimatedCost),
      });

      showToast('Damage report resolution updated successfully', 'success');
      setResolvingReport(null);
      fetchReports();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setResolveLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Damage & Maintenance Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Claims filed for damaged components, wear-and-tear, and loan return settlements.
          </p>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {['all', 'open', 'under_review', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading damage claims..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No damage reports found"
          description="All resources in this filter are operating without open damage reports."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((rep) => (
            <div
              key={rep._id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={rep.status} />
                  <span className="text-[11px] font-semibold text-slate-400">
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <img
                    src={rep.item?.images?.[0]?.url || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f'}
                    alt={rep.item?.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {rep.item?.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Reported by: <strong>{rep.reportedBy?.name}</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 font-medium">Damage Type:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 capitalize mt-0.5">
                      {rep.damageType?.replace('_', ' ')}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 font-medium">Severity:</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mt-0.5">
                      {rep.severity}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description:
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {rep.description}
                  </p>
                </div>

                {rep.resolutionNotes && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                    <strong>Settlement Resolution:</strong> {rep.resolutionNotes}
                  </div>
                )}
              </div>

              {/* Action for Loan Participants */}
              {user && rep.status !== 'resolved' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Estimated Cost: <strong>${rep.estimatedCost || 0}</strong>
                  </span>
                  <button
                    onClick={() => openResolveModal(rep)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Resolve & Settle Claim
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      <Modal
        isOpen={Boolean(resolvingReport)}
        onClose={() => setResolvingReport(null)}
        title="Settle Damage Claim"
        subtitle={`Claim #${resolvingReport?._id?.slice(-6)} for "${resolvingReport?.item?.title}"`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Resolution Status
            </label>
            <select
              value={resolveStatus}
              onChange={(e) => setResolveStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="under_review">Under Active Review</option>
              <option value="resolved">Resolved (Restore Item to Available)</option>
              <option value="rejected">Rejected (Dismiss Claim)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Final Cost Settlement ($)
            </label>
            <input
              type="number"
              min="0"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Resolution Notes & Guidance
            </label>
            <textarea
              rows="3"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Explain repair outcome or replacement resolution..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setResolvingReport(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolveLoading}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-purple-600 hover:bg-purple-700 shadow-xs cursor-pointer"
            >
              {resolveLoading ? 'Updating...' : 'Save Resolution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DamageReportsPage;
