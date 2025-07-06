import { useEffect } from "react";
import { X } from "lucide-react";

const TrailerModal = ({ isOpen, onClose, trailer, movieTitle }) => {
  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !trailer) return null;

  const getVideoUrl = (trailer) => {
    if (trailer.site === "YouTube") {
      return `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`;
    }
    // Handle other video sites if needed
    return null;
  };

  const videoUrl = getVideoUrl(trailer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-4xl mx-4 bg-[#030014] rounded-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#030014] border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">{trailer.name}</h3>
            <p className="text-sm text-gray-400">{movieTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Video Container */}
        <div className="relative aspect-video bg-black">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title={trailer.name}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">Video not available</p>
                <p className="text-sm">This trailer cannot be played</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-[#030014] text-sm text-gray-400">
          <p>Video type: {trailer.type} • Site: {trailer.site}</p>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;