import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { borrowRequestsApi } from '../api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Send, Calendar, MessageSquare, XCircle, ArrowRight } from 'lucide-react';

const MyRequestsPage = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestToCancel, setRequestToCancel] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await borrowRequestsApi.getMyRequests({ status: statusFilter });
      setRequests(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleCancelConfirm = async () => {
    if (!requestToCancel) return;
    try {
      await borrowRequestsApi.cancel(requestToCancel._id);
      showToast('Borrow request cancelled', 'success');
      setRequestToCancel(null);
      fetchRequests();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            My Borrow Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track status of items you have requested to borrow from neighbors.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Declined' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading your requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No requests found"
          description="You haven't requested to borrow any items with this status."
          actionLabel="Browse Community Catalog"
          actionLink="/browse"
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Item & Details */}
              <div className="flex items-start gap-4">
                <img
                  src={req.item?.images?.[0]?.url || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f'}
                  alt={req.item?.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={req.status} />
                    <span className="text-[11px] text-slate-400">
                      Submitted on {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    <Link to={`/items/${req.item?._id}`} className="hover:text-emerald-600">
                      {req.item?.title}
                    </Link>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {new Date(req.startDate).toLocaleDateString()} —{' '}
                      {new Date(req.endDate).toLocaleDateString()}
                    </span>
                    <span>Owner: <strong>{req.owner?.name}</strong></span>
                  </div>

                  {req.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">
                      "{req.message}"
                    </p>
                  )}

                  {req.responseMessage && (
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 mt-2">
                      <strong>Owner Note:</strong> {req.responseMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                {req.status === 'pending' && (
                  <button
                    onClick={() => setRequestToCancel(req)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Request</span>
                  </button>
                )}

                {req.status === 'approved' && (
                  <Link
                    to="/my-loans"
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <span>View in My Loans</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(requestToCancel)}
        onClose={() => setRequestToCancel(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Borrow Request?"
        message="Are you sure you want to withdraw this borrow request? The owner will be notified."
      />
    </div>
  );
};

export default MyRequestsPage;
