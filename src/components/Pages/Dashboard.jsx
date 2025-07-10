import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "react-use";
import axios from "axios";
import MovieCard from "../MovieCard";
import MovieSkeleton from "../MovieSkeleton";
import TreandingMoviesSkeleton from "../TrendingMoviesSkeleton";
import Navbar from "../Navbar";
import { getTrendingMovies, updateSearchCount } from "../../appwrite";
import { useUser } from "../../contexts/UserContext";
import useToast from "../../hooks/useToast";
import Hero from "../Hero";

const TMDB_API_URL = "https://api.themoviedb.org/3/";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const getRequestConfig = (searchQuery, filters, page = 1) => {
  const baseParams = {
    include_adult: filters.includeAdult || false,
    include_video: false,
    language: "en-US",
    page: page,
  };

  // Search vs discovery parameters
  if (searchQuery) {
    return {
      method: "GET",
      url: `${TMDB_API_URL}/search/movie`,
      params: {
        ...baseParams,
        query: encodeURIComponent(searchQuery),
      },
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TMDB_API_KEY}`,
      },
    };
  }

  // Discovery parameters with filters
  const discoverParams = {
    ...baseParams,
    sort_by: filters.sortBy || "popularity.desc",
    "vote_count.gte": 100,
  };

  // Add genre filter
  if (filters.genres && filters.genres.length > 0) {
    discoverParams.with_genres = filters.genres.join(",");
  }

  // Add release year filter
  if (filters.releaseYear) {
    discoverParams.primary_release_year = filters.releaseYear;
  } else if (filters.yearRange.min || filters.yearRange.max) {
    if (filters.yearRange.min) {
      discoverParams[
        "primary_release_date.gte"
      ] = `${filters.yearRange.min}-01-01`;
    }
    if (filters.yearRange.max) {
      discoverParams[
        "primary_release_date.lte"
      ] = `${filters.yearRange.max}-12-31`;
    }
  }

  // Add rating filter
  if (filters.rating.min) {
    discoverParams["vote_average.gte"] = filters.rating.min;
  }
  if (filters.rating.max) {
    discoverParams["vote_average.lte"] = filters.rating.max;
  }

  return {
    method: "GET",
    url: `${TMDB_API_URL}/discover/movie`,
    params: discoverParams,
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_API_KEY}`,
    },
  };
};

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    genres: [],
    releaseYear: "",
    yearRange: { min: "", max: "" },
    rating: { min: "", max: "" },
    sortBy: "popularity.desc",
    includeAdult: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [movies, setMovies] = useState([]);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMovies, setHasMoreMovies] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState("");
  const [loggedOut, setLoggedOut] = useState(false);

  // Refs for preventing duplicate calls and scroll throttling
  const trendingLoadedRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Fetch context
  const { logout, getRemainingSessionTime, current } = useUser();
  const { toast } = useToast();

  // Session timer effect
  useEffect(() => {
    const updateSessionTimer = () => {
      const remaining = getRemainingSessionTime();
      if (remaining) {
        setSessionTimeLeft(remaining);
      } else {
        setSessionTimeLeft(null);
      }
    };

    updateSessionTimer();
    const interval = setInterval(updateSessionTimer, 30000);

    return () => clearInterval(interval);
  }, [getRemainingSessionTime]);

  // Format time for display
  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds) return null;

    const minutes = Math.ceil(milliseconds / 1000 / 60);
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  // Reset pagination when search term or filters change
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setHasMoreMovies(true);
    setTotalPages(0);
    setTotalResults(0);
    setMovies([]);
    setErrorMessage("");
  }, []);

  const fetchMovies = async (signal, page = 1, isLoadMore = false) => {
    if (!isLoadMore) {
      setErrorMessage("");
      setLoading(true);
    } else {
      setLoadingMore(true);
      isLoadingMoreRef.current = true;
    }

    try {
      const response = await axios.request({
        ...getRequestConfig(searchTerm, filters, page),
        signal,
      });
      const data = response.data;

      if (!data?.results?.length) {
        if (page === 1) {
          setErrorMessage(
            searchTerm
              ? `No results found for "${searchTerm}"`
              : "No movies found with current filters"
          );
          setMovies([]);
        }
        setHasMoreMovies(false);
        return;
      }

      // Update pagination info
      setTotalPages(data.total_pages || 0);
      setTotalResults(data.total_results || 0);
      setHasMoreMovies(page < (data.total_pages || 0));

      // Update movies array
      if (isLoadMore) {
        setMovies((prev) => [...prev, ...data.results]);
        setCurrentPage(page);
      } else {
        setMovies(data.results || []);
        setCurrentPage(page);
      }

      // Update search count for first result
      if (searchTerm && data.results.length > 0 && page === 1) {
        await updateSearchCount(searchTerm, data.results[0]);
      }
    } catch (error) {
      if (error.name === "AbortError") return;

      const errorMsg = "Failed to fetch movies. Please try again later.";
      if (isLoadMore) {
        toast.error(errorMsg);
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
        isLoadingMoreRef.current = false;
      } else {
        setLoading(false);
      }
    }
  };

  // Load more movies function
  const loadMoreMovies = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreMovies || loadingMore) return;

    const nextPage = currentPage + 1;
    if (nextPage > totalPages && totalPages > 0) {
      setHasMoreMovies(false);
      return;
    }

    const controller = new AbortController();
    await fetchMovies(controller.signal, nextPage, true);
  }, [
    currentPage,
    hasMoreMovies,
    loadingMore,
    totalPages,
    searchTerm,
    filters,
  ]);

  // Debounced scroll handler with throttling
  const handleScroll = useCallback(() => {
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Throttle scroll events
    scrollTimeoutRef.current = setTimeout(() => {
      const { innerHeight } = window;
      const { scrollTop, offsetHeight } = document.documentElement;

      // Check if user is near bottom (100px threshold)
      if (scrollTop + innerHeight >= offsetHeight - 100) {
        loadMoreMovies();
      }
    }, 100); // 100ms throttle
  }, [loadMoreMovies]);

  // Scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  const loadTrendingMovies = async () => {
    if (trendingLoadedRef.current) return;

    setTrendingError("");
    setTrendingLoading(true);
    trendingLoadedRef.current = true;

    try {
      const movies = await getTrendingMovies();
      if (movies.length > 0) {
        setTrendingMovies(movies);
        setTrendingError("");
      }
    } catch (error) {
      console.error(error);
      setTrendingError(
        "Failed to fetch trending movies. Please try again later."
      );
      trendingLoadedRef.current = false;
    } finally {
      setTrendingLoading(false);
    }
  };

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Debounce the search term with pagination reset
  useDebounce(
    () => {
      const controller = new AbortController();
      const signal = controller.signal;

      if (searchTerm.trim().length >= 3 || !searchTerm) {
        resetPagination();
        fetchMovies(signal);
      }

      return () => controller.abort();
    },
    500,
    [searchTerm]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    resetPagination();
    fetchMovies(signal);

    return () => controller.abort();
  }, [filters]);

  // Initial load effect
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!searchTerm) {
      fetchMovies(signal);
    }

    return () => controller.abort();
  }, []);

  // Load trending movies on initial load
  useEffect(() => {
    loadTrendingMovies();
  }, []);

  const logoutFunction = async () => {
    setLoggedOut(true);
    try {
      await logout();
      toast.success("You have been logged out successfully.");
    } catch (error) {
      toast.error("Logout failed, but you've been signed out locally.");
    } finally {
      setLoggedOut(false);
    }
  };

  // Show session expiry warning when less than 5 minutes remain
  const showSessionWarning = sessionTimeLeft && sessionTimeLeft < 5 * 60 * 1000;

  return (
    <main>
      <div className="pattern" />
      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        user={current}
        onLogout={logoutFunction}
        handleFiltersChange={handleFiltersChange}
        loading={loading}
        currentFilters={filters}
      />

      <div className="wrapper">
        <header className="">
          {/* Hero Section */}
          <Hero
            featuredMovie={trendingMovies[0] || null}
            onWatchNow={(movie) => {
              // Handle watch now action - could open a modal, navigate to player, etc.
              console.log("Watch now:", movie);
            }}
            onAddToWatchlist={(movie) => {
              // Handle add to watchlist action
              console.log("Add to watchlist:", movie);
            }}
          />
        </header>
        {/* Trending Movies Section */}
        <section className="trending mb-5">
          <h2>Trending Movies</h2>
          {trendingLoading ? (
            <ul>
              {Array.from({ length: 5 }).map((_, index) => (
                <li key={index}>
                  <p>{index + 1}</p>
                  <TreandingMoviesSkeleton />
                </li>
              ))}
            </ul>
          ) : trendingError ? (
            <p className="text-red-500">{trendingError}</p>
          ) : (
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.movie_id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="all-movies">
          <h2>
            {searchTerm ? "Search Results" : "Discover Movies"}
            {totalResults > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                ({totalResults.toLocaleString()} results - Page {currentPage} of{" "}
                {totalPages})
              </span>
            )}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <MovieSkeleton key={index} />
              ))}
            </div>
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <>
              <ul>
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </ul>

              {/* Load more indicator */}
              {loadingMore && (
                <div className="flex justify-center mt-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <MovieSkeleton key={`loading-${index}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* End of results message */}
              {!hasMoreMovies && movies.length > 0 && (
                <div className="text-center mt-8 py-4">
                  <p className="text-gray-500">
                    🎬 That's all the movies we have!
                    {searchTerm &&
                      " Try a different search term for more results."}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
