import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { borrowRequestsApi } from '../api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { Inbox, CheckCircle, XCircle, Calendar, User, Phone, Mail } from 'lucide-react';

const IncomingRequestsPage = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  // Response Modal State
  const [activeModalRequest, setActiveModalRequest] = useState(null);
  const [responseAction, setResponseAction] = useState('approved'); // 'approved' | 'rejected'
  const [responseMessage, setResponseMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIncoming = async () => {
    try {
      setLoading(true);
      const res = await borrowRequestsApi.getIncomingRequests({ status: statusFilter });
      setRequests(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncoming();
  }, [statusFilter]);

  const openActionModal = (request, action) => {
    setActiveModalRequest(request);
    setResponseAction(action);
    setResponseMessage(
      action === 'approved'
        ? 'Approved! Feel free to pick it up on the scheduled date.'
        : 'Sorry, the item is not available on those requested dates.'
    );
  };

  const handleRespondSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalRequest) return;

    try {
      setActionLoading(true);
      await borrowRequestsApi.respond(activeModalRequest._id, {
        status: responseAction,
        responseMessage,
      });

      showToast(
        responseAction === 'approved'
          ? 'Request approved! Loan created and item marked reserved.'
          : 'Request declined.',
        'success'
      );
      setActiveModalRequest(null);
      fetchIncoming();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Incoming Borrow Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review lending requests submitted by neighbors for resources you own.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {[
            { id: 'pending', label: 'Needs Action' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Declined' },
            { id: 'all', label: 'All History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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
        <LoadingSpinner label="Loading incoming requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No incoming requests found"
          description="When community members request to borrow your listed items, they will appear here for your approval."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
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
                      Received {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    <Link to={`/items/${req.item?._id}`} className="hover:text-emerald-600">
                      {req.item?.title}
                    </Link>
                  </h3>

                  {/* Requester Profile Snapshot */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      {req.requester?.name}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                      {req.requester?.email}
                    </span>
                    {req.requester?.phone && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                        {req.requester?.phone}
                      </span>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Requested Loan Window:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {new Date(req.startDate).toLocaleDateString()} —{' '}
                      {new Date(req.endDate).toLocaleDateString()}
                    </strong>
                  </div>

                  {req.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">
                      Borrower message: "{req.message}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {req.status === 'pending' ? (
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openActionModal(req, 'rejected')}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Decline</span>
                  </button>

                  <button
                    onClick={() => openActionModal(req, 'approved')}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Loan</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Responded on {req.respondedAt ? new Date(req.respondedAt).toLocaleDateString() : 'N/A'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Message Modal */}
      <Modal
        isOpen={Boolean(activeModalRequest)}
        onClose={() => setActiveModalRequest(null)}
        title={responseAction === 'approved' ? 'Approve Borrow Request' : 'Decline Borrow Request'}
        subtitle={`Request by ${activeModalRequest?.requester?.name} for "${activeModalRequest?.item?.title}"`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRespondSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {responseAction === 'approved'
              ? 'Approving this request will atomically reserve the item, create an official loan contract, and notify the borrower.'
              : 'Declining will inform the borrower that the item is unavailable.'}
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Response Note to Borrower
            </label>
            <textarea
              rows="3"
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Add pickup instructions or a brief note..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveModalRequest(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-xs cursor-pointer ${
                responseAction === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {actionLoading
                ? 'Processing...'
                : responseAction === 'approved'
                ? 'Confirm Approval'
                : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IncomingRequestsPage;
