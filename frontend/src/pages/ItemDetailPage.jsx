import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { itemsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import RatingStars from '../components/common/RatingStars';
import CategoryIcon from '../components/common/CategoryIcon';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BorrowModal from '../components/items/BorrowModal';
import ItemCard from '../components/items/ItemCard';
import {
  MapPin,
  Shield,
  Calendar,
  AlertCircle,
  FileText,
  User,
  MessageSquare,
  ArrowLeft,
  Edit,
  Share2,
} from 'lucide-react';

const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [itemData, setItemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const res = await itemsApi.getById(id);
      setItemData(res.data);
    } catch (err) {
      showToast(err.message, 'error');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  if (loading || !itemData) {
    return <LoadingSpinner label="Loading item details..." fullPage={true} />;
  }

  const { item, reviews, ownerOtherItems } = itemData;
  const isOwner = user && item.owner?._id === user._id;
  const images = item.images?.length > 0 ? item.images : [{ url: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f' }];

  const handleBorrowClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/items/${id}` } } });
      return;
    }
    setBorrowModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/browse"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to catalog</span>
      </Link>

      {/* Main Item Detail Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-md">
            <img
              src={images[selectedImage]?.url || images[0]?.url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <StatusBadge status={item.availabilityStatus} />
            </div>
            <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              {item.condition}
            </div>
          </div>

          {/* Thumbnails if multiple images */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImage === idx
                      ? 'border-emerald-600 ring-2 ring-emerald-500/40'
                      : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                About this Resource
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>

            {item.borrowingInstructions && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                  <FileText className="w-4 h-4" />
                  <span>Owner's Borrowing & Care Instructions</span>
                </div>
                <p className="text-xs text-amber-900/90 dark:text-amber-200 leading-relaxed">
                  {item.borrowingInstructions}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Details & CTA Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                <CategoryIcon name={item.category?.icon} className="w-4 h-4" />
                <span>{item.category?.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                {item.title}
              </h1>

              <div className="flex items-center justify-between mt-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>
                    {item.location?.area ? `${item.location.area}, ` : ''}
                    {item.location?.city}
                  </span>
                </div>
                <RatingStars rating={item.averageRating || 0} totalReviews={item.totalReviews} />
              </div>
            </div>

            {/* Spec Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Estimated Value</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  ${item.replacementValue}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Condition</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 capitalize mt-0.5">
                  {item.condition}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Total Borrows</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  {item.totalBorrows || 0} times
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status</span>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 capitalize mt-0.5">
                  {item.availabilityStatus}
                </p>
              </div>
            </div>

            {/* CTA Button Actions */}
            <div className="pt-2">
              {isOwner ? (
                <div className="space-y-2">
                  <Link
                    to={`/edit-item/${item._id}`}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 shadow-md transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Listing Details</span>
                  </Link>
                  <p className="text-[11px] text-center text-slate-400">
                    You are the registered owner of this resource.
                  </p>
                </div>
              ) : item.availabilityStatus === 'available' ? (
                <button
                  onClick={handleBorrowClick}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-base font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Request to Borrow</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                >
                  Currently Not Available ({item.availabilityStatus})
                </button>
              )}
            </div>

            {/* Owner Profile Card */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Resource Owner
              </h4>
              <div className="flex items-center gap-3">
                <img
                  src={
                    item.owner?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.owner?.name || 'Owner')}`
                  }
                  alt={item.owner?.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {item.owner?.name}
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Neighbor in {item.owner?.address?.city || 'Greenwood'} • Member since{' '}
                    {new Date(item.owner?.createdAt).getFullYear()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Community Reviews & Loan Experiences
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified feedback submitted after completed loan returns.
            </p>
          </div>
          <RatingStars rating={item.averageRating || 0} totalReviews={item.totalReviews} size="w-5 h-5" />
        </div>

        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            No reviews yet for this resource. Be the first neighbor to borrow and leave a review!
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
            {reviews.map((rev) => (
              <div key={rev._id} className="pt-4 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        rev.reviewer?.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.reviewer?.name || 'User')}`
                      }
                      alt={rev.reviewer?.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {rev.reviewer?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RatingStars rating={rev.rating} size="w-3.5 h-3.5" />
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-9">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Other Items by this Owner */}
      {ownerOtherItems.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            More Resources from {item.owner?.name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {ownerOtherItems.map((otherItem) => (
              <ItemCard key={otherItem._id} item={otherItem} />
            ))}
          </div>
        </section>
      )}

      {/* Borrow Request Modal */}
      <BorrowModal
        isOpen={borrowModalOpen}
        onClose={() => setBorrowModalOpen(false)}
        item={item}
        onRequestSubmitted={() => {
          fetchItem();
        }}
      />
    </div>
  );
};

export default ItemDetailPage;
