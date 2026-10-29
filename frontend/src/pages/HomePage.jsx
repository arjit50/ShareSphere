import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsApi, categoriesApi } from '../api';
import ItemCard from '../components/items/ItemCard';
import CategoryIcon from '../components/common/CategoryIcon';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Users,
  CheckCircle,
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, itemsRes] = await Promise.all([
          categoriesApi.getAll(),
          itemsApi.getAll({ limit: 6, status: 'available' }),
        ]);
        setCategories(catRes.data || []);
        setFeaturedItems(itemsRes.data || []);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-20 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-emerald-50/60 via-transparent to-transparent dark:from-emerald-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hyper-Local Community Resource Sharing</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.15]">
              Borrow what you need.{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                Share what you own.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Why buy expensive tools and gear that sit in your garage for 360 days a year?
              Discover lawn mowers, drills, camping tents, and audio gear from trusted neighbors.
            </p>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto mt-6">
              <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500">
                <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search power tools, camping gear, pressure washers..."
                  className="w-full px-4 py-3.5 text-sm sm:text-base bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-hidden"
                />
                <button
                  type="submit"
                  className="mr-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  Find Items
                </button>
              </div>
            </form>

            {/* Metrics Chips */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Verified Neighborhood Items</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Damage & Condition Tracking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <span>Zero Rental Fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Explore by Category
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Browse equipment curated for home, garden, outdoors, and social events.
            </p>
          </div>
          <Link
            to="/browse"
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            <span>All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat._id}
              to={`/browse?category=${cat.slug}`}
              className="group p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex items-start gap-3.5"
            >
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <CategoryIcon name={cat.icon} className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {cat.itemCount || 0} resources available
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Items Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Featured Community Resources
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Popular tools and gear ready for pickup in your neighborhood today.
            </p>
          </div>
          <Link
            to="/browse"
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            <span>View All Items</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner label="Fetching available resources..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">
            How ShareSphere Works
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10">
            A trusted circular sharing economy that takes only 3 simple steps to participate in.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-2">
                Discover & Request
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Find tools and equipment near you. Choose your desired loan dates with real-time
                availability conflict checks.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-extrabold flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-2">
                Pickup & Complete Project
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Meet your neighbor for handover, review equipment instructions, and complete your
                home or outdoor project.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-2">
                Return Clean & Review
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Return on time in original condition, confirm return status, and exchange reciprocal
                community trust reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Call-to-Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <Sparkles className="w-4 h-4" />
              <span>Join Your Neighborhood Share Network</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">
              Ready to Share with Your Community?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              Have tools or equipment sitting idle in your garage? Put them to good use, meet your neighbors, and help build a greener, more connected community.
            </p>
          </div>
          <Link
            to="/add-item"
            className="px-6 py-3 rounded-2xl bg-white text-emerald-900 font-bold text-sm shadow-md hover:bg-emerald-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            List an Item Today →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
