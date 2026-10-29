import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { itemsApi, categoriesApi } from '../api';
import ItemCard from '../components/items/ItemCard';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import {
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List,
  RotateCcw,
  X,
} from 'lucide-react';

const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Filter state synced with URL searchParams
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const condition = searchParams.get('condition') || '';
  const status = searchParams.get('status') || 'available';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesApi.getAll();
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch items based on active query params
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search: search || undefined,
        category: category || undefined,
        condition: condition || undefined,
        status: status || undefined,
        sort: sort || undefined,
      };

      const res = await itemsApi.getAll(params);
      setItems(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, condition, status, sort]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateFilters = (newFilters) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '' || val === 'all') {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    // Reset to page 1 whenever filters change (unless page itself is changing)
    if (!newFilters.page) {
      updated.set('page', '1');
    }
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const activeFilterCount = [
    category,
    condition,
    status !== 'available' ? status : null,
    search,
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Community Resource Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover tools, party equipment, and gear listed by local neighbors.
          </p>
        </div>

        {/* View Mode & Filter Toggle on Mobile */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            <Filter className="w-4 h-4" />
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>

          <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 p-1 bg-white dark:bg-slate-900">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Item Results */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside
          className={`md:block space-y-6 ${
            mobileFilterOpen
              ? 'fixed inset-0 z-50 p-6 bg-white dark:bg-slate-900 overflow-y-auto block'
              : 'hidden md:block'
          }`}
        >
          {mobileFilterOpen && (
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 md:hidden">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                Filter Items
              </h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Search box in sidebar */}
          <form onSubmit={handleSearchSubmit}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Keyword Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Drill, mower, tent..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </form>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Categories
            </label>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => updateFilters({ category: '' })}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                  !category
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Categories</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => updateFilters({ category: cat.slug })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                    category === cat.slug
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {cat.itemCount !== undefined && (
                    <span className="text-[10px] opacity-70">({cat.itemCount})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Condition
            </label>
            <div className="space-y-1">
              {[
                { id: '', label: 'Any Condition' },
                { id: 'new', label: 'Brand New' },
                { id: 'like-new', label: 'Like New' },
                { id: 'good', label: 'Good' },
                { id: 'fair', label: 'Fair' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateFilters({ condition: c.id })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    condition === c.id
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Availability
            </label>
            <div className="space-y-1">
              {[
                { id: 'available', label: 'Ready Now (Available)' },
                { id: 'all', label: 'All Active Items' },
                { id: 'borrowed', label: 'Currently On Loan' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateFilters({ status: s.id })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    status === s.id
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}

          {mobileFilterOpen && (
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold md:hidden mt-4"
            >
              Apply Filters
            </button>
          )}
        </aside>

        {/* Items Listing Column */}
        <main className="md:col-span-3 space-y-6">
          {/* Active Chips & Sort bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Showing{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {pagination?.total || items.length}
                </strong>{' '}
                resources
              </span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                  Keyword: "{search}"
                  <button onClick={() => updateFilters({ search: '' })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-slate-500 font-medium">Sort by:</label>
              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
              >
                <option value="newest">Recently Listed</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Borrowed</option>
                <option value="value-asc">Value: Low to High</option>
                <option value="value-desc">Value: High to Low</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <LoadingSpinner label="Searching community items..." />
          ) : items.length === 0 ? (
            <EmptyState
              title="No resources matched your criteria"
              description="Try broadening your keyword, resetting category filters, or list this item yourself!"
              actionLabel="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {items.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <Pagination
            pagination={pagination}
            onPageChange={(newPage) => updateFilters({ page: newPage })}
          />
        </main>
      </div>
    </div>
  );
};

export default BrowsePage;
