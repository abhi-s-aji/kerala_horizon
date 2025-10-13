import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  MapPin,
  Star,
  DollarSign,
  ArrowRight,
  Filter,
  Loader
} from 'lucide-react';
import { searchService, SearchResult, SearchFilters } from '../../services/searchService';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, initialQuery = '' }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchHistory(searchService.getSearchHistory());
      setTrendingSearches(searchService.getTrendingSearches());
      if (initialQuery) {
        setQuery(initialQuery);
        performSearch(initialQuery);
      }
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialQuery]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchService.globalSearch(searchQuery, filters);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(() => {
        performSearch(query);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [query, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    // Navigate to appropriate section and trigger action
    navigate(`/${result.type}`);
    
    // Trigger specific action based on result data
    if (result.data?.action) {
      // This would be handled by the specific module
      console.log('Triggering action:', result.data.action, result.data);
    }
    
    onClose();
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    performSearch(historyQuery);
  };

  const handleTrendingClick = (trendingQuery: string) => {
    setQuery(trendingQuery);
    performSearch(trendingQuery);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const resultVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 p-4"
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search Kerala... (e.g., EV charging, Kathakali, KTDC hotels)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                />
                {query && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-lg transition-colors ${
                  showFilters
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Filter size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={filters.type?.[0] || ''}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value ? [e.target.value] : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">All Categories</option>
                      <option value="transport">Transport</option>
                      <option value="stay">Stay</option>
                      <option value="food">Food</option>
                      <option value="culture">Culture</option>
                      <option value="ai">AI Tools</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Price (₹)
                    </label>
                    <input
                      type="number"
                      value={filters.priceRange?.[1] || ''}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        priceRange: [0, parseInt(e.target.value) || 0] 
                      })}
                      placeholder="No limit"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Rating
                    </label>
                    <select
                      value={filters.rating || ''}
                      onChange={(e) => setFilters({ ...filters, rating: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Any Rating</option>
                      <option value="4">4+ Stars</option>
                      <option value="3">3+ Stars</option>
                      <option value="2">2+ Stars</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader className="animate-spin text-primary-600" size={24} />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
              </div>
            )}

            {!loading && query.length > 2 && results.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Search Results ({results.length})
                </h3>
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      variants={resultVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleResultClick(result)}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase">
                              {result.type}
                            </span>
                            {result.rating && (
                              <div className="flex items-center space-x-1">
                                <Star size={14} className="text-yellow-500 fill-current" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {result.rating}
                                </span>
                              </div>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {result.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {result.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            {result.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin size={12} />
                                <span>{result.location}</span>
                              </div>
                            )}
                            {result.price && (
                              <div className="flex items-center space-x-1">
                                <DollarSign size={12} />
                                <span>₹{result.price}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {!loading && query.length > 2 && results.length === 0 && (
              <div className="p-8 text-center">
                <Search size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {!loading && query.length <= 2 && (
              <div className="p-4">
                {/* Search History */}
                {searchHistory.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                      <Clock size={16} className="mr-2" />
                      Recent Searches
                    </h3>
                    <div className="space-y-1">
                      {searchHistory.slice(0, 5).map((historyQuery, index) => (
                        <button
                          key={index}
                          onClick={() => handleHistoryClick(historyQuery)}
                          className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="text-gray-700 dark:text-gray-300">{historyQuery}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                    <TrendingUp size={16} className="mr-2" />
                    Trending Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((trendingQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleTrendingClick(trendingQuery)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {trendingQuery}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchModal;

