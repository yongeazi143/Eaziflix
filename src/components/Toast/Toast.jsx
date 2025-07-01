import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-500'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-500'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-500'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-500'
  }
};

const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  const toastConfig = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const Icon = toastConfig.icon;

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, toast.duration - elapsed);
      const progressPercent = (remaining / toast.duration) * 100;
      
      setProgress(progressPercent);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div className={`transform transition-all duration-300 ease-in-out mb-3 ${
      isVisible && !isLeaving 
        ? 'translate-x-0 opacity-100 scale-100' 
        : 'translate-x-full opacity-0 scale-95'
    }`}>
      <div className={`relative flex items-start p-4 rounded-lg border shadow-lg max-w-sm w-full overflow-hidden ${toastConfig.className}`}>
        <Icon className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${toastConfig.iconClassName}`} />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">{toast.message}</p>
        </div>
        
        <button
          onClick={handleRemove}
          className="ml-3 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>

        {toast.duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10">
            <div 
              className={`h-full transition-all duration-75 ease-linear ${
                toast.type === 'success' ? 'bg-green-500' :
                toast.type === 'error' ? 'bg-red-500' :
                toast.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{ 
                width: `${progress}%`,
                transition: progress === 100 ? 'none' : 'width 0.05s linear'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;