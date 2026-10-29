import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, Heart, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                ShareSphere
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              Empowering neighborhoods to share resources, reduce consumer waste, and build
              sustainable community resilience by lending power tools, outdoor gear, and household
              equipment.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 w-fit">
              <Sparkles className="w-4 h-4" />
              <span>Share More. Waste Less. Build Stronger Communities.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/browse" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Browse Resources
                </Link>
              </li>
              <li>
                <Link to="/browse?category=power-tools-machinery" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Power Tools
                </Link>
              </li>
              <li>
                <Link to="/browse?category=camping-outdoors" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Camping & Outdoors
                </Link>
              </li>
              <li>
                <Link to="/browse?category=kitchen-party-equipment" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Kitchen Equipment
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Account */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/add-item" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  List Your Resource
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Member Dashboard
                </Link>
              </li>
              <li>
                <Link to="/my-loans" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Active Loans & Returns
                </Link>
              </li>
              <li>
                <Link to="/damage-reports" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Damage Reports
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ShareSphere Platform. Connecting neighbors through the power of sharing.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for local communities everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
