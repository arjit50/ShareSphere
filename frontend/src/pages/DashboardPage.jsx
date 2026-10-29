import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemsApi, borrowRequestsApi, loansApi, analyticsApi } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Package,
  Clock,
  Inbox,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Calendar,
  CheckCircle,
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myItemsCount: 0,
    activeLoansCount: 0,
    incomingPendingCount: 0,
    overdueCount: 0,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [itemsRes, requestsRes, loansRes, historyRes] = await Promise.all([
          itemsApi.getMyItems(),
          borrowRequestsApi.getIncomingRequests({ status: 'pending' }),
          loansApi.getMyLoans({ status: 'all' }),
          analyticsApi.getUserHistory(),
        ]);

        const allLoans = loansRes.data || [];
        const active = allLoans.filter((l) => ['approved', 'active'].includes(l.status)).length;
        const overdue = allLoans.filter((l) => l.status === 'overdue').length;

        setStats({
          myItemsCount: (itemsRes.data || []).length,
          activeLoansCount: active,
          incomingPendingCount: (requestsRes.data || []).length,
          overdueCount: overdue,
        });

        setHistory(historyRes.data || []);
      } catch (err) {
        console.error('Failed to load member dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner label="Loading your dashboard..." fullPage={true} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-md"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              Member in {user?.address?.city || 'Greenwood'} • Community Sharer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/add-item"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow-md hover:bg-emerald-50 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List an Item</span>
          </Link>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-bold text-xs transition-all border border-emerald-600/60"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Listed Items */}
        <Link
          to="/my-items"
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              My Listed Items
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.myItemsCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              Manage →
            </span>
          </div>
        </Link>

        {/* Incoming Requests */}
        <Link
          to="/incoming-requests"
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Requests
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.incomingPendingCount}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              Review →
            </span>
          </div>
        </Link>

        {/* Active Loans */}
        <Link
          to="/my-loans"
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Loans
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.activeLoansCount}
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
              View →
            </span>
          </div>
        </Link>

        {/* Overdue Items */}
        <Link
          to="/my-loans"
          className={`p-5 rounded-3xl border shadow-xs transition-all group ${
            stats.overdueCount > 0
              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Overdue Alerts
            </span>
            <div
              className={`p-2.5 rounded-xl ${
                stats.overdueCount > 0
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span
              className={`text-3xl font-extrabold ${
                stats.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {stats.overdueCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {stats.overdueCount > 0 ? 'Urgent Return' : 'All on time'}
            </span>
          </div>
        </Link>
      </div>

      {/* Sharing Activity History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
              <span>Recent Activity</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Complete Borrowing & Lending Timeline
            </h3>
          </div>
          <Link
            to="/my-loans"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 self-start sm:self-auto"
          >
            Manage Active Loans →
          </Link>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            No borrowing activity recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Resource</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Counterparty</th>
                  <th className="py-3 px-4">Loan Period</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-r-xl">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      <Link to={`/items/${h.item?._id}`} className="hover:text-emerald-600">
                        {h.item?.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-semibold uppercase text-[10px] ${
                          h.role === 'borrower'
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {h.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {h.counterparty?.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(h.startDate).toLocaleDateString()} — {new Date(h.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={h.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      {h.hasReviewed ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Reviewed</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
