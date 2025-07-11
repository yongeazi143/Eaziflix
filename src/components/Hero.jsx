import { useState, useEffect, useCallback } from 'react';
import { Play, Info, Star, ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const Hero = ({ onWatchNow, onAddToWatchlist }) => {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Fetch most popular movies from TMDB
  const fetchPopularMovies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${TMDB_API_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
        {
          headers: {
            'Authorization': `Bearer ${TMDB_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();
      
      // Get additional details for each movie including runtime
      const moviesWithDetails = await Promise.all(
        data.results.slice(0, 8).map(async (movie) => {
          try {
            const detailResponse = await fetch(
              `${TMDB_API_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`,
              {
                headers: {
                  'Authorization': `Bearer ${TMDB_API_KEY}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (detailResponse.ok) {
              const details = await detailResponse.json();
              return {
                ...movie,
                runtime: details.runtime,
                genres: details.genres || [],
                production_companies: details.production_companies || []
              };
            }
            return movie;
          } catch (err) {
            console.error(`Error fetching details for movie ${movie.id}:`, err);
            return movie;
          }
        })
      );

      setMovies(moviesWithDetails);
    } catch (err) {
      console.error('Error fetching popular movies:', err);
      setError('Failed to load movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || movies.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % movies.length);
    }, 8000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, movies.length]);

  // Fetch movies on component mount
  useEffect(() => {
    fetchPopularMovies();
  }, [fetchPopularMovies]);

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + movies.length) % movies.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % movies.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Helper functions
  const formatRuntime = (runtime) => {
    if (!runtime) return '';
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}m`;
  };

  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const getImageUrl = (path, size = 'original') => {
    if (!path) return 'https://images.unsplash.com/photo-1489599894804-fb18fe1baabd?w=1920&h=1080&fit=crop';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-[80vh] bg-gradient-to-r from-gray-900 to-gray-800 animate-pulse">
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="h-16 bg-gray-700 rounded mb-6 w-3/4"></div>
            <div className="h-6 bg-gray-700 rounded mb-4 w-full"></div>
            <div className="h-6 bg-gray-700 rounded mb-8 w-2/3"></div>
            <div className="flex gap-4">
              <div className="h-14 bg-gray-700 rounded w-40"></div>
              <div className="h-14 bg-gray-700 rounded w-36"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full h-[80vh] bg-gradient-to-r from-red-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p className="text-lg mb-6">{error}</p>
          <button
            onClick={fetchPopularMovies}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No movies state
  if (movies.length === 0) {
    return (
      <div className="relative w-full h-[80vh] bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">No movies available</h2>
          <p className="text-lg">Please check back later.</p>
        </div>
      </div>
    );
  }

  const currentMovie = movies[currentIndex];

  return (
    <div className="relative w-full h-[80vh] overflow-hidden group">
      {/* Background Images with Smooth Transition */}
      <div className="absolute inset-0">
        {movies.map((movie, index) => (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="w-full h-full bg-cover bg-center transform scale-105"
              style={{
                backgroundImage: `url(${getImageUrl(movie.backdrop_path)})`,
                filter: 'brightness(0.8)'
              }}
            />
          </div>
        ))}
      </div>

 {/* Gradient Overlays - Blended with App Background #030014 */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-[#030014]/60 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#030014]/90 via-[#030014]/25 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030014]/80"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#030014]/40 via-transparent to-[#030014]/60"></div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className="relative z-10 flex items-end h-full">
        <div className="max-w-7xl mx-auto px-6 pb-20 w-full">
          <div className="flex items-end justify-between">
            
            {/* Movie Details */}
            <div className="max-w-4xl">
              
              {/* Title */}
              <h2 className="text-4xl md:text-6xl font-light mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent tracking-wide leading-tight">
                {currentMovie.title}
              </h2>

              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {currentMovie.genres && currentMovie.genres.slice(0, 3).map((genre) => (
                  <span 
                    key={genre.id}
                    className="px-3 py-1 bg-purple-500/90 text-white text-xs rounded-full backdrop-blur-sm font-medium border border-white/20 hover:border-white/40"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
              
              {/* Movie Meta Information */}
              <div className="flex items-center gap-6 mb-6 text-white/90">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-lg">
                    {currentMovie.vote_average.toFixed(1)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className="w-5 h-5" />
                  <span className="text-lg">
                    {new Date(currentMovie.release_date).getFullYear()}
                  </span>
                </div>
                
                {currentMovie.runtime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-lg">{formatRuntime(currentMovie.runtime)}</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => onWatchNow && onWatchNow(currentMovie)}
                  className="flex items-center gap-3 bg-gradient px-8 py-4 rounded-lg font-semibold text-lg transform hover:scale-105 shadow-xl cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-white" />
                  Watch Now
                </button>
                
                <button
                  onClick={() => onAddToWatchlist && onAddToWatchlist(currentMovie)}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40 cursor-pointer"
                >
                  <Info className="w-6 h-6" />
                  More Info
                </button>
              </div>
            </div>

            {/* Movie Poster */}
            <div className="hidden lg:block">
              <img
                src={getImageUrl(currentMovie.poster_path, 'w500')}
                alt={currentMovie.title}
                className="w-64 h-96 object-cover rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex gap-2">
          {movies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-purple-600 scale-125' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
        <div 
          className="h-full bg-purple-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / movies.length) * 100}%` }}
        />
      </div> */}
    </div>
  );
};

export default Hero;
