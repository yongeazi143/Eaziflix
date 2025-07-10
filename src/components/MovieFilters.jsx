import { useState, useEffect } from 'react';
import { Filter, X, Calendar, Star, SortAsc } from 'lucide-react';
import Backdrop from './Backdrop';

const MovieFilters = ({ onFiltersChange, isLoading, showFilterModal, onClose }) => {
  const [filters, setFilters] = useState({
    genres: [],
    releaseYear: '',
    yearRange: { min: '', max: '' },
    rating: { min: '', max: '' },
    sortBy: 'popularity.desc',
    includeAdult: false
  });

  // TMDB genres
  const genres = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' }
  ];

  const sortOptions = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'popularity.asc', label: 'Least Popular' },
    { value: 'release_date.desc', label: 'Newest First' },
    { value: 'release_date.asc', label: 'Oldest First' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'vote_average.asc', label: 'Lowest Rated' },
    { value: 'title.asc', label: 'A-Z' },
    { value: 'title.desc', label: 'Z-A' },
    { value: 'revenue.desc', label: 'Highest Revenue' },
    { value: 'vote_count.desc', label: 'Most Voted' }
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  // Handle genre toggle
  const handleGenreToggle = (genreId) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter(id => id !== genreId)
        : [...prev.genres, genreId]
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle nested filter changes (for rating and year range)
  const handleNestedFilterChange = (parentKey, childKey, value) => {
    setFilters(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      genres: [],
      releaseYear: '',
      yearRange: { min: '', max: '' },
      rating: { min: '', max: '' },
      sortBy: 'popularity.desc',
      includeAdult: false
    });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.genres.length > 0 ||
           filters.releaseYear ||
           filters.yearRange.min ||
           filters.yearRange.max ||
           filters.rating.min ||
           filters.rating.max ||
           filters.sortBy !== 'popularity.desc' ||
           filters.includeAdult;
  };

  // Update parent component when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);
  
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showFilterModal) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showFilterModal, onClose]);
  
  // Handle backdrop click - this is the key fix
  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle modal content click to prevent event bubbling
  const handleModalClick = (e) => {
    e.stopPropagation();
  };
  
  // Don't render if not showing
  if (!showFilterModal) return null;

  return (
    <>
      {/* Backdrop Component */}
      <Backdrop visible={showFilterModal} onClick={handleBackdropClick} />
      
      {/* Modal Content */}
      <div className="fixed inset-1 z-50 flex items-center justify-center mt-9 mx-5 pointer-events-none">
        <div 
          className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700 rounded-xl shadow-2xl max-w-6xl w-full max-h-[80vh] overflow-y-auto mt-7 pointer-events-auto"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Movie Filters</h2>
              {hasActiveFilters() && (
                <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30">
                  Active
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="p-6">
            {/* Clear All Filters */}
            {hasActiveFilters() && (
              <div className="mb-6">
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Genre Filter */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Genres
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-gray-800/50">
                  {genres.map(genre => (
                    <label 
                      key={genre.id} 
                      className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-700/50 px-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.genres.includes(genre.id)}
                        onChange={() => handleGenreToggle(genre.id)}
                        className="rounded border-gray-500 text-purple-600 focus:ring-purple-500 bg-gray-700"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-gray-200">{genre.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Release Year Filter */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Release Year
                </label>
                <div className="space-y-4">
                  <select
                    value={filters.releaseYear}
                    onChange={(e) => handleFilterChange('releaseYear', e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
                    disabled={isLoading}
                  >
                    <option value="">Any Year</option>
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  
                  <div className="text-xs text-gray-400 text-center font-medium">OR</div>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="From"
                      value={filters.yearRange.min}
                      onChange={(e) => handleNestedFilterChange('yearRange', 'min', e.target.value)}
                      className="w-1/2 p-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                      min="1900"
                      max={currentYear}
                      disabled={isLoading}
                    />
                    <input
                      type="number"
                      placeholder="To"
                      value={filters.yearRange.max}
                      onChange={(e) => handleNestedFilterChange('yearRange', 'max', e.target.value)}
                      className="w-1/2 p-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                      min="1900"
                      max={currentYear}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  <Star className="inline w-4 h-4 mr-2" />
                  Rating (0-10)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.rating.min}
                    onChange={(e) => handleNestedFilterChange('rating', 'min', e.target.value)}
                    className="w-1/2 p-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                    min="0"
                    max="10"
                    step="0.1"
                    disabled={isLoading}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.rating.max}
                    onChange={(e) => handleNestedFilterChange('rating', 'max', e.target.value)}
                    className="w-1/2 p-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                    min="0"
                    max="10"
                    step="0.1"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  <SortAsc className="inline w-4 h-4 mr-2" />
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
                  disabled={isLoading}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adult Content */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Content Options
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-800/50 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.includeAdult}
                    onChange={(e) => handleFilterChange('includeAdult', e.target.checked)}
                    className="rounded border-gray-500 text-purple-600 focus:ring-purple-500 bg-gray-700"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-200">Include Adult Content</span>
                </label>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-sm font-medium text-white mb-3">Active Filters:</h3>
                <div className="flex flex-wrap gap-2">
                  {filters.genres.length > 0 && (
                    <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-500/30">
                      Genres: {filters.genres.length} selected
                    </span>
                  )}
                  {filters.releaseYear && (
                    <span className="bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full border border-green-500/30">
                      Year: {filters.releaseYear}
                    </span>
                  )}
                  {(filters.yearRange.min || filters.yearRange.max) && (
                    <span className="bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full border border-green-500/30">
                      Years: {filters.yearRange.min || '1900'} - {filters.yearRange.max || currentYear}
                    </span>
                  )}
                  {(filters.rating.min || filters.rating.max) && (
                    <span className="bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full border border-yellow-500/30">
                      Rating: {filters.rating.min || '0'} - {filters.rating.max || '10'}
                    </span>
                  )}
                  {filters.sortBy !== 'popularity.desc' && (
                    <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-500/30">
                      Sort: {sortOptions.find(opt => opt.value === filters.sortBy)?.label}
                    </span>
                  )}
                  {filters.includeAdult && (
                    <span className="bg-red-500/20 text-red-300 text-xs px-3 py-1 rounded-full border border-red-500/30">
                      Adult Content
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MovieFilters;