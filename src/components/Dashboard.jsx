import { useState, useEffect, useRef } from "react";
import { useDebounce } from "react-use";
import axios from "axios";
import Search from "./Search";
import MovieCard from "./MovieCard";
import MovieSkeleton from "./MovieSkeleton";
import TreandingMoviesSkeleton from "./TrendingMoviesSkeleton";
import Navbar from "./Navbar";
import { getTrendingMovies, updateSearchCount } from "../appwrite";
import { useUser } from "../contexts/UserContext";
import useToast from "../hooks/useToast";

const TMDB_API_URL = "https://api.themoviedb.org/3/";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const getRequestConfig = (searchQuery) => ({
  method: "GET",
  url: `${TMDB_API_URL}${searchQuery ? "/search/movie" : "/discover/movie"}`,
  params: {
    include_adult: false,
    include_video: false,
    language: "en-US",
    page: 1,
    ...(searchQuery
      ? {
          query: encodeURIComponent(searchQuery),
        }
      : {
          sort_by: "popularity.desc",
          "vote_count.gte": 100,
        }),
  },
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
});

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [movies, setMovies] = useState([]);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(null);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState("");
  const [loggedOut, setLoggedOut] = useState(false);

  // Simple flag to prevent duplicate trending calls
  const trendingLoadedRef = useRef(false);

  // Fetch context
  const { logout, getRemainingSessionTime } = useUser();
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

    // Update immediately
    updateSessionTimer();

    // Update every 30 seconds
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

  const fetchMovies = async (signal) => {
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await axios.request({
        ...getRequestConfig(searchTerm),
        signal,
      });
      const data = response.data;

      if (!data?.results?.length) {
        setErrorMessage(
          searchTerm
            ? `No results found for "${searchTerm}"`
            : "No popular movies currently available"
        );
        setMovies([]);
        setLoading(false);
        return;
      }

      setMovies(data.results || []);
      if (searchTerm && data.results.length > 0) {
        await updateSearchCount(searchTerm, data.results[0]);
      }
    } catch (error) {
      if (error.name === 'AbortError') return; // Don't handle aborted requests
      console.error(error);
      setErrorMessage("Failed to fetch movies. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    // Prevent duplicate calls
    if (trendingLoadedRef.current) return;
    
    setTrendingError("");
    setTrendingLoading(true);
    trendingLoadedRef.current = true; // Set flag immediately

    try {
      const movies = await getTrendingMovies();
      if (movies.length > 0) {
        setTrendingMovies(movies);
        setTrendingError("");
      }
    } catch (error) {
      console.error(error);
      setTrendingError("Failed to fetch trending movies. Please try again later.");
      trendingLoadedRef.current = false; // Reset flag on error
    } finally {
      setTrendingLoading(false);
    }
  };

  // Debounce the search term
  useDebounce(
    () => {
      const controller = new AbortController();
      const signal = controller.signal;

      if (searchTerm.trim().length >= 3 || !searchTerm) {
        fetchMovies(signal);
      }

      return () => controller.abort();
    },
    500,
    [searchTerm]
  );

  // Initial load effect
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Fetch popular movies on initial load
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
    }finally {
      setLoggedOut(false);
    }
  }

  // Show session expiry warning when less than 5 minutes remain
  const showSessionWarning = sessionTimeLeft && sessionTimeLeft < 5 * 60 * 1000;

  return (
    <main>
      <div className="pattern" />
      <Navbar />
      
      {/* Enhanced logout button with session info */}
      <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-r-lg shadow-lg p-3">
        {sessionTimeLeft && (
          <div className={`text-xs mb-2 ${showSessionWarning ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
            {showSessionWarning && "⚠️ "}
            Session expires in: {formatTimeRemaining(sessionTimeLeft)}
          </div>
        )}
        <button
          disabled={loggedOut}
          type="button" 
          className={`bg-amber-500 px-4 py-2 text-white rounded hover:bg-amber-600 transition-colors text-sm font-medium ${loggedOut ? 'opacity-50 cursor-not-allowed' : 'cusror-pointer'}`}
          onClick={logoutFunction}
        >
          Logout
        </button>
      </div>

      <div className="wrapper">
        <header className="">
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Love
            Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

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
          <h2>{searchTerm ? 'Search Results' : 'Popular Movies'}</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <MovieSkeleton key={index} />
              ))}
            </div>
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default Dashboard;