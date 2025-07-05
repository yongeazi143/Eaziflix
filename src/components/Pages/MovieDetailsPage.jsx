import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Play,
  Film,
  Heart,
  Bookmark,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import useToast from "../../hooks/useToast";
import EaziFlixSpinner from "../EaziFlixSpinner";
import MovieCard from "../MovieCard";

const TMDB_API_URL = "https://api.themoviedb.org/3/";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const getMovieDetailsConfig = (movieId) => ({
  method: "GET",
  url: `${TMDB_API_URL}movie/${movieId}`,
  params: {
    language: "en-US",
    append_to_response: "credits,similar,watch/providers",
  },
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
});

const MovieDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [castScrollPosition, setCastScrollPosition] = useState(0);
  const [similarScrollPosition, setSimilarScrollPosition] = useState(0);

  useEffect(() => {
    const fetchMovieDetails = async (signal) => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.request({
          ...getMovieDetailsConfig(id),
          signal,
        });

        const movieData = response.data;
        setMovie(movieData);
      } catch (err) {
        if (err.name === "AbortError") return;

        const errorMessage =
          err.response?.status === 404
            ? "Movie not found"
            : "Failed to fetch movie details";

        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      const controller = new AbortController();
      const signal = controller.signal;

      fetchMovieDetails(signal);

      return () => controller.abort();
    }
  }, [id]);

  const scrollCast = (direction) => {
    const container = document.getElementById("cast-container");
    const scrollAmount = 300;
    const newPosition =
      direction === "left"
        ? Math.max(0, castScrollPosition - scrollAmount)
        : castScrollPosition + scrollAmount;

    container.scrollTo({
      left: newPosition,
      behavior: "smooth",
    });
    setCastScrollPosition(newPosition);
  };

  const scrollSimilar = (direction) => {
    const container = document.getElementById("similar-container");
    const scrollAmount = 400;
    const newPosition =
      direction === "left"
        ? Math.max(0, similarScrollPosition - scrollAmount)
        : similarScrollPosition + scrollAmount;

    container.scrollTo({
      left: newPosition,
      behavior: "smooth",
    });
    setSimilarScrollPosition(newPosition);
  };

  if (loading) {
    return <EaziFlixSpinner />;
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-red-500 text-2xl mb-4">Error Loading Movie</h2>
          <p className="text-gray-400 mb-4">{error || "Movie not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Hero Section */}
      <div className="relative">
        {movie.backdrop_path && (
          <div className="absolute inset-0">
            <img
              src={`https://image.tmdb.org/t/p/original/${movie.backdrop_path}`}
              alt={movie.title}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
          </div>
        )}

        <div className="relative z-10 container mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster with Hover Animation */}
            <div className="flex-shrink-0 group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-red-500/20">
                <img
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                      : "./no-movie.png"
                  }
                  alt={movie.title}
                  className="w-64 h-96 object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Movie Info Overlay - Bottom */}
                <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white text-sm font-medium truncate">
                    {movie.title}
                  </p>
                  <p className="text-gray-300 text-xs">
                    {movie.release_date
                      ? new Date(movie.release_date).getFullYear()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Movie Info */}
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl font-light mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent tracking-wide leading-tight">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="text-gray-400 italic mb-4">{movie.tagline}</p>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center">
                  <img src="/star.svg" alt="Star" className="w-5 h-5 mr-1" />
                  <span className="text-yellow-400 font-semibold">
                    {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                  </span>
                </div>
                <span className="text-gray-500">•</span>
                <span className="text-gray-300">
                  {movie.release_date
                    ? new Date(movie.release_date).getFullYear()
                    : "N/A"}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-300">
                  {movie.runtime ? `${movie.runtime} min` : "N/A"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <button className="bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white hover:from-[#AB8BFF] hover:to-[#8B5FFF] cursor-pointer transform hover:scale-105 transition-all duration-300 px-6 py-3 rounded-lg font-semibold flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Watch Now
                </button>

                <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all cursor-pointer flex items-center gap-2 shadow-lg">
                  <Film className="w-5 h-5" />
                  Watch Trailer
                </button>

                <button className="bg-amber-600 hover:bg-amber-700 cursor-pointer text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-all flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  <span className="hidden sm:inline">Favourite</span>
                </button>

                <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold hover:scale-105 transition-all cursor-pointer flex items-center gap-2">
                  <Bookmark className="w-5 h-5" />
                  <span className="hidden sm:inline">Watchlist</span>
                </button>
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="bg-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {movie.overview && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p className="text-gray-300 leading-relaxed md:max-w-2/3">
                    {movie.overview}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Release Date</h4>
                  <p className="text-gray-400">
                    {movie.release_date
                      ? new Date(movie.release_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Original Language</h4>
                  <p className="text-gray-400 uppercase">
                    {movie.original_language}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Budget</h4>
                  <p className="text-gray-400">
                    {movie.budget ? `$${movie.budget.toLocaleString()}` : "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Revenue</h4>
                  <p className="text-gray-400">
                    {movie.revenue
                      ? `$${movie.revenue.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      {movie.credits?.cast && movie.credits.cast.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Cast</h2>
            <div className="flex gap-2">
              <button
                onClick={() => scrollCast("left")}
                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors"
                disabled={castScrollPosition === 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollCast("right")}
                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              id="cast-container"
              className="flex gap-4 overflow-x-hidden scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {movie.credits.cast.slice(0, 15).map((actor) => (
                <div
                  key={actor.id}
                  className="flex-shrink-0 w-32 text-center group"
                >
                  <div className="relative overflow-hidden rounded-lg mb-2">
                    <img
                      src={
                        actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : "/no-avatar.png"
                      }
                      alt={actor.name}
                      className="w-32 h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">
                    {actor.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {actor.character}
                  </p>
                </div>
              ))}
            </div>

            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-gray-900 to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-gray-900 to-transparent pointer-events-none"></div>
          </div>
        </div>
      )}

      {/* Similar Movies */}
      {movie.similar?.results && movie.similar.results.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">More Like This</h2>
            <div className="flex gap-2">
              <button
                onClick={() => scrollSimilar("left")}
                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors"
                disabled={similarScrollPosition === 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollSimilar("right")}
                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              id="similar-container"
              className="flex gap-4 overflow-x-hidden scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {movie.similar.results.slice(0, 20).map((similarMovie) => (
                <div key={similarMovie.id} className="flex-shrink-0 w-48">
                  <MovieCard movie={similarMovie} />
                </div>
              ))}
            </div>

            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-gray-900 to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-gray-900 to-transparent pointer-events-none"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetailsPage;
