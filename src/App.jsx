import { useState, useEffect } from "react";
import { useDebounce, useSetState } from "react-use";
import Search from "./components/Search";
import axios from "axios";
import EaziFlixSpinner from "./components/EaziFlixSpinner";
import MovieCard from "./components/MovieCard";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

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
          "vote_count.gte": 100, // Ensure quality results
        }),
  },
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
});

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [movies, setMovies] = useState([]);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState("");

  const fetchMovies = async (signal) => {
    setErrorMessage(""); // Reset error message before fetching
    setLoading(true); // Set loading to true before fetching movies

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
        setLoading(false); // Set loading to false if no results
        return;
      }

      setMovies(data.results || []);
      if (searchTerm && data.results.length > 0) {
        // Update search count in Appwrite with the first movie
        await updateSearchCount(searchTerm, data.results[0]);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to fetch movies. Please try again later.");
    } finally {
      setLoading(false); // Set loading to false after the request completes
    }
  };

  const loadTrendingMovies = async () => {
    setTrendingError(""); // Reset trending error message
    setTrendingLoading(true); // Set trending loading to true before fetching

    try {
      const movies = await getTrendingMovies();
      if (movies.length > 0) {
        setTrendingMovies(movies);
        setTrendingError("");
        setTrendingLoading(false); // Set trending loading to false if movies are found
      }
    } catch (error) {
      console.error(error);
      setTrendingError("Failed to fetch trending movies. Please try again later.");
    } finally {
      setTrendingLoading(false); // Set trending loading to false after the request completes
    }
  };

  // Debounce the search term with 1000ms delay
  useDebounce(
    () => {
      const controller = new AbortController();
      const signal = controller.signal;

      if (searchTerm.trim().length >= 3 || !searchTerm) {
        fetchMovies(signal);
      }

      // Return cleanup function
      return () => controller.abort();
    },
    1000,
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
  }, []); // Only run on

  // Load trending movies on initial load
  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Love
            Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        <section className="trending">
          <h2>Trending Movies</h2>
          {trendingLoading ? (
            <EaziFlixSpinner variant="pulse" size="lg" color="green" />
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
          <h2>All Movies</h2>
          {loading ? (
            <EaziFlixSpinner variant="pulse" size="lg" color="green" />
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

export default App;
