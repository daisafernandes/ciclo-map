import { X, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import type { OsrmStep } from "@/services/routing";

interface NavigationBannerProps {
  currentStep: OsrmStep;
  nextStep: OsrmStep | null;
  distanceToNextM: number | null;
  onStop: () => void;
}

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

function ManeuverIcon({ type, modifier }: { type: string; modifier?: string }) {
  const cls = "w-8 h-8 shrink-0 text-primary";

  if (type === "turn") {
    if (modifier === "left" || modifier === "sharp left") return <ArrowLeft className={cls} />;
    if (modifier === "right" || modifier === "sharp right") return <ArrowRight className={cls} />;
    if (modifier === "slight left") return <ArrowUpLeft className={cls} />;
    if (modifier === "slight right") return <ArrowUpRight className={cls} />;
    if (modifier === "uturn") return <RotateCcw className={cls} />;
  }
  if (type === "roundabout" || type === "rotary") {
    if (modifier?.includes("left")) return <ArrowLeft className={cls} />;
    if (modifier?.includes("right")) return <ArrowRight className={cls} />;
  }
  return <ArrowUp className={cls} />;
}

const NavigationBanner = ({ currentStep, nextStep, distanceToNextM, onStop }: NavigationBannerProps) => {
  return (
    <div
      className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[min(100%,calc(100vw-2rem))] max-w-sm
        flex items-center gap-3 rounded-xl border border-primary/30 bg-card/95 backdrop-blur-md
        shadow-lg px-4 py-3 pointer-events-auto"
      role="status"
      aria-live="polite"
      aria-label="Instrução de navegação"
    >
      <ManeuverIcon type={currentStep.maneuver.type} modifier={currentStep.maneuver.modifier} />

      <div className="flex-1 min-w-0">
        {distanceToNextM != null && (
          <p className="text-lg font-bold font-mono tabular-nums text-foreground leading-none">
            {formatDistance(distanceToNextM)}
          </p>
        )}
        <p className="text-sm text-foreground/90 leading-snug truncate">
          {currentStep.name || "Siga em frente"}
        </p>
        {nextStep && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            Em seguida: {nextStep.name || "destino"}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onStop}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label="Encerrar navegação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NavigationBanner;
