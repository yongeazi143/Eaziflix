const MovieSkeleton = () => {
  return (
    <div className="overflow-hidden bg-dark-100 p-5 rounded-2xl shadow-inner shadow-light-100/10">
      {/* Movie Poster Skeleton */}
      <div className="relative w-full h-80 bg-gray-700 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-pulse"></div>
      </div>

      {/* Movie Details Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-600 rounded animate-pulse"></div>
          <div className="h-5 bg-gray-600 rounded w-3/4 animate-pulse"></div>
        </div>

        {/* Rating, Language, Year Skeleton */}
        <div className="flex items-center space-x-4">
          {/* Star rating */}
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-600 rounded w-6 animate-pulse"></div>
          </div>
          
          {/* Language */}
          <div className="h-4 bg-gray-600 rounded w-8 animate-pulse"></div>
          
          {/* Year */}
          <div className="h-4 bg-gray-600 rounded w-12 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default MovieSkeleton;