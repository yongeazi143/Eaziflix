import { useState } from "react";

const PosterCardSkeleton = (title) => {
  return (
   <div className="relative w-full h-80 bg-gray-700 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-pulse"></div>
      </div>
  );
};

function MovieCard({
  movie: { title, poster_path, release_date, vote_average, original_language },
}) {
  const [brokenImageError, setBrokenImageError] = useState(false);
  return (
    <div className="movie-card">
      {brokenImageError ? (
        <PosterCardSkeleton title={title}/>
      ) : (
        <img
          src={
            poster_path
              ? `https://image.tmdb.org/t/p/w500/${poster_path}`
              : "./no-movie.png"
          }
          alt={title}
          onError={() => setBrokenImageError(true)}
        />
      )}

      <div className="mt-4">
        <h3>{title}</h3>

        <div className="content">
          <div className="rating">
            <img src="star.svg" alt="Star Icon " />
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
