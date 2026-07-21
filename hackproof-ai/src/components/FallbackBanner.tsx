import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { onApiFallback } from '../services/api';

export default function FallbackBanner() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const show = useCallback((endpoint: string) => {
    const short = endpoint.length > 60 ? '…' + endpoint.slice(-50) : endpoint;
    setMessage(short);
    setVisible(true);
    setTimeout(() => setVisible(false), 6000);
  }, []);

  useEffect(() => onApiFallback(show), [show]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-amber-900/80 border border-amber-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-sm flex items-start gap-2.5">
      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider">OFFLINE MODE</p>
        <p className="text-[10px] font-mono text-amber-200/70 mt-0.5 break-all">{message}</p>
      </div>
      <button onClick={() => setVisible(false)} className="text-amber-400/60 hover:text-amber-300 cursor-pointer">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
