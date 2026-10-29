import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { itemsApi } from '../api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import RatingStars from '../components/common/RatingStars';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { PlusCircle, Edit, Trash2, ExternalLink, Package } from 'lucide-react';

const MyItemsPage = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      const res = await itemsApi.getMyItems();
      setItems(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyItems();
  }, []);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await itemsApi.delete(itemToDelete._id);
      showToast('Item listing removed', 'success');
      setItemToDelete(null);
      fetchMyItems();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            My Listed Resources
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your equipment catalog, check borrowing frequency, and edit specifications.
          </p>
        </div>

        <Link
          to="/add-item"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Item</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading your listings..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="You haven't listed any resources yet"
          description="Have power tools, lawn equipment, camping gear, or party supplies? Share them with neighbors!"
          actionLabel="+ Add Your First Item"
          actionLink="/add-item"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/9 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={item.images?.[0]?.url || 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={item.availabilityStatus} />
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase">
                    {item.condition}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.category?.name}
                  </div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>Borrowed: <strong>{item.totalBorrows || 0} times</strong></span>
                    <RatingStars rating={item.averageRating || 0} totalReviews={item.totalReviews} />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link
                  to={`/items/${item._id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Public View</span>
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/edit-item/${item._id}`}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Edit Item"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title={`Remove "${itemToDelete?.title}"?`}
        message="This item will be soft-deleted and removed from the active catalog."
      />
    </div>
  );
};

export default MyItemsPage;
