import { WifiOff } from "lucide-react";

const OfflineBanner = () => (
  <div
    className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2
      rounded-lg border border-amber-500/40 bg-amber-500/10 backdrop-blur-sm
      px-3 py-2 text-[11px] font-medium text-amber-600 dark:text-amber-400
      shadow pointer-events-none select-none"
    role="status"
    aria-live="polite"
  >
    <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden />
    Modo offline — dados do cache local
  </div>
);

export default OfflineBanner;
