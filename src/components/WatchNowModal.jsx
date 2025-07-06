import { useState, useEffect } from "react";
import { X, Play, Download, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, TrendingUp, Award } from "lucide-react";
import axios from "axios";
import MovieCard from "./MovieCard";

const TMDB_API_URL = "https://api.themoviedb.org/3/";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const getPopularMoviesConfig = () => ({
  method: "GET",
  url: `${TMDB_API_URL}movie/popular`,
  params: {
    language: "en-US",
    page: 1,
  },
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
});

const getTopRatedMoviesConfig = () => ({
  method: "GET",
  url: `${TMDB_API_URL}movie/top_rated`,
  params: {
    language: "en-US",
    page: 1,
  },
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
});

const WatchNowModal = ({ isOpen, onClose, movie }) => {
  const [currentProvider, setCurrentProvider] = useState("source1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [topWatchMovies, setTopWatchMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [moviesError, setMoviesError] = useState(null);
  const [topWatchScrollPosition, setTopWatchScrollPosition] = useState(0);
  const [topRatedScrollPosition, setTopRatedScrollPosition] = useState(0);

  // Video sources (removed Ultra Server)
  const sources = {
    source1: {
      name: "HD Server",
      url: `https://vidsrc.to/embed/movie/${movie?.id}`,
      quality: "1080p"
    },
    source2: {
      name: "Fast Server",
      url: `https://vidsrc.me/embed/movie?tmdb=${movie?.id}`,
      quality: "720p"
    }
  };

  // Fetch top movies when modal opens
  useEffect(() => {
    if (isOpen && !topWatchMovies.length && !topRatedMovies.length) {
      fetchTopMovies();
    }
  }, [isOpen]);

  const fetchTopMovies = async () => {
    setMoviesLoading(true);
    setMoviesError(null);
    
    try {
      const controller = new AbortController();
      const signal = controller.signal;

      // Fetch popular movies (top watch)
      const popularResponse = await axios.request({
        ...getPopularMoviesConfig(),
        signal,
      });

      // Fetch top rated movies
      const topRatedResponse = await axios.request({
        ...getTopRatedMoviesConfig(),
        signal,
      });

      if (popularResponse.data && topRatedResponse.data) {
        setTopWatchMovies(popularResponse.data.results.slice(0, 20));
        setTopRatedMovies(topRatedResponse.data.results.slice(0, 20));
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      
      const errorMessage = "Failed to fetch movies";
      setMoviesError(errorMessage);
      console.error('Error fetching top movies:', err);
    } finally {
      setMoviesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsLoading(true);
      // Simulate loading time
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleProviderChange = (provider) => {
    setCurrentProvider(provider);
    setError(null);
    setIsLoading(true);
    setIsDropdownOpen(false);
    
    // Simulate loading for provider switch
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  const handleDownload = () => {
    // This would typically integrate with a download API
    alert("Download functionality would be implemented here");
  };

  const handleIframeError = () => {
    setError("Failed to load video. Try switching to another source.");
    setIsLoading(false);
  };

  const scrollMovies = (direction, type) => {
    const container = document.getElementById(`${type}-container`);
    const scrollAmount = 300;
    const currentPosition = type === 'top-watch' ? topWatchScrollPosition : topRatedScrollPosition;
    const newPosition = direction === "left" 
      ? Math.max(0, currentPosition - scrollAmount)
      : currentPosition + scrollAmount;

    container.scrollTo({
      left: newPosition,
      behavior: "smooth",
    });

    if (type === 'top-watch') {
      setTopWatchScrollPosition(newPosition);
    } else {
      setTopRatedScrollPosition(newPosition);
    }
  };

  const handleMovieClick = (selectedMovie) => {
    // This would typically navigate to the selected movie or replace current movie
    console.log('Selected movie:', selectedMovie);
    // You could implement logic to switch the current movie being watched
    // or navigate to the new movie's details page
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-7xl sm:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Play className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">
              {movie?.title || "Movie"}
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative bg-black flex-shrink-0">
          <div className="aspect-video">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-red-500 mx-auto mb-3 sm:mb-4"></div>
                  <p className="text-white text-sm sm:text-base">Loading video...</p>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center max-w-md mx-auto p-4 sm:p-6">
                  <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-white text-base sm:text-lg font-semibold mb-2">
                    Video Unavailable
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm mb-4">
                    {error}
                  </p>
                  <button
                    onClick={() => handleProviderChange(currentProvider)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <iframe
                src={sources[currentProvider].url}
                title={`Watch ${movie?.title || "Movie"}`}
                className="w-full h-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                onError={handleIframeError}
                onLoad={() => setIsLoading(false)}
              />
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Source Selection Dropdown */}
          <div className="p-3 sm:p-4 border-b border-gray-700">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-between gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors min-w-[200px]"
              >
                <span className="flex items-center gap-2">
                  {sources[currentProvider].name}
                  <span className="text-xs opacity-75">{sources[currentProvider].quality}</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full sm:w-[200px] bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10">
                  {Object.entries(sources).map(([key, source]) => (
                    <button
                      key={key}
                      onClick={() => handleProviderChange(key)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${
                        currentProvider === key ? 'bg-red-600 text-white' : 'text-gray-300'
                      }`}
                    >
                      <span>{source.name}</span>
                      <span className="text-xs opacity-75">{source.quality}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Movie Information */}
          <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
            {/* Rating and Details */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base">
              <div className="flex items-center">
                <img src="/star.svg" alt="Star" className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                <span className="text-yellow-400 font-semibold">
                  {movie?.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                </span>
              </div>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">
                {movie?.release_date
                  ? new Date(movie.release_date).getFullYear()
                  : "N/A"}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">
                {movie?.runtime ? `${movie.runtime} min` : "N/A"}
              </span>
            </div>

            {/* Tagline */}
            {movie?.tagline && (
              <p className="text-gray-400 italic text-sm sm:text-base">{movie.tagline}</p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button 
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                Download
              </button>
            </div>

            {/* Genres */}
            {movie?.genres && movie.genres.length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="bg-gray-700 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Overview */}
            {movie?.overview && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Overview</h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* Additional Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
              <div>
                <h4 className="font-semibold mb-1">Release Date</h4>
                <p className="text-gray-400">
                  {movie?.release_date
                    ? new Date(movie.release_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Original Language</h4>
                <p className="text-gray-400 uppercase">
                  {movie?.original_language || "N/A"}
                </p>
              </div>
            </div>

            {/* Top Watch Movies Section */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">Popular Movies</h3>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => scrollMovies("left", "top-watch")}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
                    disabled={topWatchScrollPosition === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollMovies("right", "top-watch")}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {moviesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                </div>
              ) : moviesError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{moviesError}</p>
                  <button
                    onClick={fetchTopMovies}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : topWatchMovies.length > 0 ? (
                <div className="relative">
                  <div
                    id="top-watch-container"
                    className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {topWatchMovies.map((topMovie) => (
                      <div key={topMovie.id} className="flex-shrink-0 w-48">
                        <MovieCard movie={topMovie} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No popular movies found</p>
                </div>
              )}
            </div>

            {/* Top Rated Movies Section */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">Top Rated</h3>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => scrollMovies("left", "top-rated")}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
                    disabled={topRatedScrollPosition === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollMovies("right", "top-rated")}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {moviesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : moviesError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{moviesError}</p>
                  <button
                    onClick={fetchTopMovies}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : topRatedMovies.length > 0 ? (
                <div className="relative">
                  <div
                    id="top-rated-container"
                    className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {topRatedMovies.map((topMovie) => (
                      <div key={topMovie.id} className="flex-shrink-0 w-48">
                        <MovieCard movie={topMovie} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No top rated movies found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchNowModal;