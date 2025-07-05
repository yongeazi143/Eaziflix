import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import useToast from "../hooks/useToast";
import { useNavigate } from "react-router-dom";


// Poster Card Skeletion for Broken Images
const PosterCardSkeleton = () => {
  return (
   <div className="relative w-full h-56 bg-gray-700 animate-pulse rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r rounded-xl from-gray-700 via-gray-600 to-gray-700 animate-pulse"></div>
      </div>
  );
};

function MovieCard({
  movie: { title, poster_path, release_date, vote_average, original_language, id },
}) {

  const [brokenImageError, setBrokenImageError] = useState(false);
  const {toast} = useToast();
  const navigate = useNavigate();

  const {current} = useUser();

 const handleMovieDetailsDisplay = () => {
  if (!current) {
    toast.info("Please Login to Continue. Redirecting to Login Page...");

    setTimeout(() => {
      navigate('/login');
    }, 2000);

    return;
  }

  navigate(`/movie/${id}-${title}`);
 }

  
  return (
    <div className="movie-card group cursor-pointer transition-all duration-300 hover:scale-105" onClick={() => handleMovieDetailsDisplay()}>
      {brokenImageError ? (
        <PosterCardSkeleton/>
      ) : (
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
        className="group-hover:scale-110 transition-transform duration-300"
          src={
            poster_path
              ? `https://image.tmdb.org/t/p/w500/${poster_path}`
              : "./no-movie.png"
          }
          alt={title}
          onError={() => setBrokenImageError(true)}
          loading="lazy"
        />
        </div>
      )}

      <div className="mt-4">
        <h3>{title}</h3>

        <div className="content">
          <div className="rating">
            <img src="/star.svg" alt="Star Icon " />
            <p>{vote_average ? vote_average.toFixed(1) : "N/A"}</p>
          </div>
          <span>•</span>

          <p className="lang">{original_language}</p>

          <span>•</span>
          <p className="year">
            {release_date ? release_date.split("-")[0] : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
