import { useState, useEffect } from "react";
import {
  X,
  Play,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Loader2,
  RefreshCw,
  Shield,
  Tv,
} from "lucide-react";
import axios from "axios";
import MovieCard from "./MovieCard";
import DownloadMovie from "./DownloadMovie";
import useToast from "../hooks/useToast";

const TMDB_API_URL = "https://api.themoviedb.org/3/";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const PROXY_BASE_URL = "https://video-proxy-server-production-5db4.up.railway.app";

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
  const [currentProvider, setCurrentProvider] = useState("vidsrc-to");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [topWatchMovies, setTopWatchMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [moviesError, setMoviesError] = useState(null);
  const [topWatchScrollPosition, setTopWatchScrollPosition] = useState(0);
  const [topRatedScrollPosition, setTopRatedScrollPosition] = useState(0);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [proxyServerStatus, setProxyServerStatus] = useState("unknown");
  const [iframeKey, setIframeKey] = useState(0); // For forcing iframe reload

  const {toast} = useToast();
  

  // Enhanced video sources with multiple providers
const sources = {
    "vidsrc-to": {
      name: "Source 1",
      url: `${PROXY_BASE_URL}/proxy/vidsrc-me?id=${movie?.id}&tmdb=${movie?.id}&type=movie`,
      quality: "1080p",
      icon: <Shield className="w-4 h-4" />,
      description: "High quality, ad-free",
    },
    "vidsrc-me": {
      name: "Source 2",
      url: `${PROXY_BASE_URL}/proxy/vidsrc-to?id=${movie?.id}&type=movie`,
      quality: "720p",
      icon: <Tv className="w-4 h-4" />,
      description: "Alternative source",
    },
    "vidsrc-legacy": {
      name: "Source 3",
      url: `${PROXY_BASE_URL}/proxy/vidsrc?id=${movie?.id}`,
      quality: "1080p",
      icon: <Play className="w-4 h-4" />,
      description: "Backup source",
    },
  };

  // Check proxy server status
  useEffect(() => {
    const checkProxyStatus = async () => {
      try {
        const response = await fetch(`${PROXY_BASE_URL}/health`, {
          method: "GET",
          timeout: 5000,
        });
        setProxyServerStatus(response.ok ? "online" : "offline");
      } catch (err) {
        setProxyServerStatus("offline");
        console.warn("Proxy server is offline:", err);
      }
    };

    if (isOpen) {
      checkProxyStatus();
    }
  }, [isOpen]);

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
      console.error("Error fetching top movies:", err);
    } finally {
      setMoviesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsLoading(true);
      setIframeKey((prev) => prev + 1); // Force iframe reload

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
    setIframeKey((prev) => prev + 1); // Force iframe reload

    // Simulate loading for provider switch
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  const handleDownload = () => {
    // setIsDownloadModalOpen(true);
    toast.info("Download feature is under development.");
  };

  const handleIframeError = () => {
    setError(
      "Failed to load video. The source might be temporarily unavailable."
    );
    setIsLoading(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const retryCurrentSource = () => {
    setError(null);
    setIsLoading(true);
    setIframeKey((prev) => prev + 1); // Force iframe reload

    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const scrollMovies = (direction, type) => {
    const container = document.getElementById(`${type}-container`);
    const scrollAmount = 300;
    const currentPosition =
      type === "top-watch" ? topWatchScrollPosition : topRatedScrollPosition;
    const newPosition =
      direction === "left"
        ? Math.max(0, currentPosition - scrollAmount)
        : currentPosition + scrollAmount;

    container.scrollTo({
      left: newPosition,
      behavior: "smooth",
    });

    if (type === "top-watch") {
      setTopWatchScrollPosition(newPosition);
    } else {
      setTopRatedScrollPosition(newPosition);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-gray-900 rounded-none sm:rounded-lg w-full h-full sm:max-w-7xl sm:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Play className="w-5 h-5 sm:w-6 sm:h-6 text-[#E879F9]" />
            <h2 className="text-sm sm:text-lg font-bold text-white truncate">
              {movie?.title || "Movie"}
            </h2>
            {/* Proxy Server Status Indicator */}
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  proxyServerStatus === "online"
                    ? "bg-green-500"
                    : proxyServerStatus === "offline"
                    ? "bg-red-500"
                    : "bg-yellow-500"
                }`}
              ></div>
              <span className="text-xs text-gray-400">
                {proxyServerStatus === "online"
                  ? "HD"
                  : proxyServerStatus === "offline"
                  ? "Offline"
                  : "Checking..."}
              </span>
            </div>
          </div>

          <DownloadMovie
            movie={movie}
            isOpen={isDownloadModalOpen}
            onClose={() => setIsDownloadModalOpen(false)}
          />

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Main Content Layout - YouTube Style */}
        <div className="flex-1 overflow-y-auto">
          <div className="lg:flex lg:gap-6 lg:p-6">
            {/* Left Column - Video Player and Main Content */}
            <div className="lg:flex-1 lg:max-w-4xl">
              {/* Video Player - Responsive sizing */}
              <div className="relative bg-black">
                {/* Mobile: Full aspect ratio, Medium: Reduced height, Large: YouTube-like proportions */}
                <div className="aspect-video md:aspect-[16/10] lg:aspect-[16/9] xl:aspect-[16/8]">
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-center p-4">
                        <Loader2 className="animate-spin h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                        <p className="text-white text-sm sm:text-base">
                          Loading video from {sources[currentProvider].name}...
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          {sources[currentProvider].description}
                        </p>
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
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <button
                            onClick={retryCurrentSource}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                          </button>
                          {Object.keys(sources).length > 1 && (
                            <button
                              onClick={() => setIsDropdownOpen(true)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                            >
                              Try Another Source
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      key={iframeKey} // Force reload when key changes
                      src={sources[currentProvider].url}
                      title={`Watch ${movie?.title || "Movie"}`}
                      className="w-full h-full border-0 z-99"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      onError={handleIframeError}
                      onLoad={handleIframeLoad}
                    />
                  )}
                </div>
              </div>

              {/* Video Controls and Info */}
              <div className="p-3 sm:p-4 space-y-4">
                {/* Source Selection Dropdown */}
                <div className="border-b border-gray-700 pb-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full sm:w-auto flex items-center justify-between gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors min-w-[250px]"
                      >
                        <span className="flex items-center gap-2">
                          {sources[currentProvider].icon}
                          {sources[currentProvider].name}
                          <span className="text-xs opacity-75">
                            {sources[currentProvider].quality}
                          </span>
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full sm:w-[300px] bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10">
                          {Object.entries(sources).map(([key, source]) => (
                            <button
                              key={key}
                              onClick={() => handleProviderChange(key)}
                              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors ${
                                currentProvider === key
                                  ? "bg-gradient text-white"
                                  : "text-gray-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {source.icon}
                                  <div>
                                    <div className="font-medium">{source.name}</div>
                                    <div className="text-xs opacity-75">
                                      {source.description}
                                    </div>
                                  </div>
                                </div>
                                {/* <span className="text-xs opacity-75">
                                  {source.quality}
                                </span> */}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quality & Server Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4 text-[#E879F9]" />
                        <span>Ad-Free</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            proxyServerStatus === "online"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <span>Eazi Proxy</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Movie Title and Rating */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base">
                    <div className="flex items-center">
                      <img
                        src="/star.svg"
                        alt="Star"
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
                      />
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
                </div>

                {/* Tagline */}
                {movie?.tagline && (
                  <p className="text-gray-400 italic text-sm sm:text-base">
                    {movie.tagline}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={handleDownload}
                    className="bg-gradient px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    Download
                  </button>

                  {/* Refresh Video Button */}
                  <button
                    onClick={retryCurrentSource}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
                  >
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Movie Details (Desktop only) */}
            <div className="lg:w-80 xl:w-96 lg:border-l lg:border-gray-700 lg:pl-6">
              <div className="p-3 sm:p-4 lg:p-0 space-y-4 sm:space-y-6">
                {/* Genres */}
                {movie?.genres && movie.genres.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2">
                      Genres
                    </h3>
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
                    <h3 className="text-base sm:text-lg font-semibold mb-2">
                      Overview
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                      {movie.overview}
                    </p>
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 text-sm sm:text-base">
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
              </div>
            </div>
          </div>

          {/* Bottom Section - Movie Recommendations */}
          <div className="p-3 sm:p-4 lg:p-6 space-y-6 border-t border-gray-700 lg:border-t-0">
            {/* Top Watch Movies Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Popular Movies
                  </h3>
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
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Top Rated
                  </h3>
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