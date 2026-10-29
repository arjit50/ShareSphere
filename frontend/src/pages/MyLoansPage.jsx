import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loansApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ReturnModal from '../components/loans/ReturnModal';
import ReviewModal from '../components/loans/ReviewModal';
import DamageReportModal from '../components/loans/DamageReportModal';
import {
  Clock,
  Calendar,
  RotateCcw,
  Star,
  AlertTriangle,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const MyLoansPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'borrowed' | 'lent'
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal handlers
  const [activeReturnLoan, setActiveReturnLoan] = useState(null);
  const [activeReviewLoan, setActiveReviewLoan] = useState(null);
  const [activeDamageLoan, setActiveDamageLoan] = useState(null);
  const [pickupLoading, setPickupLoading] = useState(false);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await loansApi.getMyLoans({
        type: typeFilter,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setLoans(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [typeFilter, statusFilter]);

  const handleStartPickup = async (loanId) => {
    try {
      setPickupLoading(true);
      await loansApi.pickup(loanId);
      showToast('Pickup confirmed! Loan status is now active.', 'success');
      fetchLoans();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPickupLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Resource Loans & Returns
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track equipment pickup schedules, due dates, return confirmations, and reviews.
          </p>
        </div>

        {/* Loan Type Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
          {[
            { id: 'all', label: 'All Loans' },
            { id: 'borrowed', label: 'Borrowed by Me' },
            { id: 'lent', label: 'Lent to Others' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Filter Tabs (Status) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {['all', 'active', 'approved', 'overdue', 'returned'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-full capitalize font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === st
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            {st === 'all' ? 'All Statuses' : st}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading loans..." />
      ) : loans.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No loans found"
          description="Approved borrow requests automatically turn into active loans here with due date monitoring."
          actionLabel="Browse Community Catalog"
          actionLink="/browse"
        />
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const isBorrower = loan.borrower?._id === user?._id;
            const counterparty = isBorrower ? loan.owner : loan.borrower;
            const counterpartyRole = isBorrower ? 'Owner' : 'Borrower';
            const isOverdue = loan.status === 'overdue';

            return (
              <div
                key={loan._id}
                className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border shadow-xs transition-all ${
                  isOverdue
                    ? 'border-red-300 dark:border-red-900/60 ring-2 ring-red-500/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Item Image & Meta */}
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        loan.item?.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f'
                      }
                      alt={loan.item?.title}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0"
                    />

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={loan.status} />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          {isBorrower ? 'You are Borrowing' : 'You Lent this Item'}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                        <Link to={`/items/${loan.item?._id}`} className="hover:text-emerald-600">
                          {loan.item?.title}
                        </Link>
                      </h3>

                      {/* Dates and Counterparty */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          Start: {new Date(loan.startDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Due: {new Date(loan.dueDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {counterpartyRole}: <strong>{counterparty?.name}</strong>
                        </span>
                      </div>

                      {/* Overdue Alert banner */}
                      {isOverdue && (
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 mt-2">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>This resource is past its scheduled due date! Please arrange immediate return.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800 w-full lg:w-auto justify-end">
                    {/* Status: Approved -> Pickup action */}
                    {loan.status === 'approved' && (
                      <button
                        onClick={() => handleStartPickup(loan._id)}
                        disabled={pickupLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Pickup / Handover</span>
                      </button>
                    )}

                    {/* Status: Active or Overdue -> Return & Damage actions */}
                    {(loan.status === 'active' || loan.status === 'overdue') && (
                      <>
                        <button
                          onClick={() => setActiveReturnLoan(loan)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Record Return</span>
                        </button>

                        <button
                          onClick={() => setActiveDamageLoan(loan)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Report Damage</span>
                        </button>
                      </>
                    )}

                    {/* Status: Returned -> Review action */}
                    {loan.status === 'returned' && (
                      <button
                        onClick={() => setActiveReviewLoan(loan)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                      >
                        <Star className="w-4 h-4 fill-white" />
                        <span>Leave Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Modal */}
      {activeReturnLoan && (
        <ReturnModal
          isOpen={Boolean(activeReturnLoan)}
          onClose={() => setActiveReturnLoan(null)}
          loan={activeReturnLoan}
          onReturnCompleted={() => {
            fetchLoans();
          }}
        />
      )}

      {/* Review Modal */}
      {activeReviewLoan && (
        <ReviewModal
          isOpen={Boolean(activeReviewLoan)}
          onClose={() => setActiveReviewLoan(null)}
          loan={activeReviewLoan}
          currentUserId={user?._id}
          onReviewSubmitted={() => {
            fetchLoans();
          }}
        />
      )}

      {/* Damage Report Modal */}
      {activeDamageLoan && (
        <DamageReportModal
          isOpen={Boolean(activeDamageLoan)}
          onClose={() => setActiveDamageLoan(null)}
          loan={activeDamageLoan}
          onReportSubmitted={() => {
            fetchLoans();
          }}
        />
      )}
    </div>
  );
};

export default MyLoansPage;
