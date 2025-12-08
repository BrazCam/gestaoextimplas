import { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string | { message?: string };
  type?: 'error' | 'success' | 'info' | 'warning';
  onClose: () => void;
}

export const Toast = ({ message, type = 'info', onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-orange-500'
  };

  let displayMessage = "Notificação";
  if (typeof message === 'string') {
    displayMessage = message;
  } else if (message && typeof message === 'object') {
    displayMessage = message.message || JSON.stringify(message);
  }

  return (
    <div className={`fixed top-4 right-4 z-[100] ${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-xl animate-slide-in flex items-center gap-3 min-w-[300px]`}>
      {type === 'error' && <AlertTriangle className="w-5 h-5" />}
      {type === 'success' && <CheckCircle className="w-5 h-5" />}
      {type === 'info' && <Info className="w-5 h-5" />}
      {type === 'warning' && <AlertTriangle className="w-5 h-5" />}
      <p className="font-medium text-sm flex-1">{displayMessage}</p>
      <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
