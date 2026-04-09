import { useMemo } from "react";
import { Cloud, Droplets, Wind, Thermometer, Eye, Loader2, AlertTriangle, Info } from "lucide-react";
import { WeatherData } from "@/data/ciclovias";
import { getCyclingWeatherAlerts, type CyclingWeatherAlertLevel } from "@/services/weather";
import { cn } from "@/lib/utils";

interface WeatherPanelProps {
  weather: WeatherData;
  isLoading?: boolean;
  /** Exibe aviso discreto (ex.: dados de referência após falha na API). */
  isFallback?: boolean;
}

const alertStyles: Record<CyclingWeatherAlertLevel, string> = {
  info: "border-info/35 bg-info/10 text-foreground",
  warning: "border-warning/40 bg-warning/10 text-foreground",
  danger: "border-destructive/45 bg-destructive/10 text-foreground",
};

const WeatherPanel = ({ weather, isLoading = false, isFallback = false }: WeatherPanelProps) => {
  const alerts = useMemo(() => getCyclingWeatherAlerts(weather), [weather]);

  return (
    <div className="glass-panel-sm p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clima agora</h3>
        <span className="text-xs text-muted-foreground shrink-0">{weather.updatedAt}</span>
      </div>

      {!isLoading && alerts.length > 0 && (
        <ul className="mb-3 space-y-1.5" role="list" aria-label="Alertas para ciclistas">
          {alerts.map((a, i) => (
            <li
              key={`${i}-${a.message.slice(0, 24)}`}
              className={cn(
                "flex gap-2 rounded-md border px-2 py-1.5 text-[11px] leading-snug",
                alertStyles[a.level],
              )}
            >
              {a.level === "info" ? (
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-90" aria-hidden />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-90" aria-hidden />
              )}
              <span>{a.message}</span>
            </li>
          ))}
        </ul>
      )}

      {isFallback && (
        <p className="text-[10px] text-muted-foreground/90 mb-2 leading-snug">
          Dados ao vivo indisponíveis — exibindo referência local.
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          <span className="text-xs">Carregando clima…</span>
        </div>
      ) : (
        <>
      <div className="flex items-center gap-3 mb-4">
        <Cloud className="w-8 h-8 text-info shrink-0" />
        <div>
          <p className="text-2xl font-bold text-foreground font-mono">{weather.temperature}°C</p>
          <p className="text-xs text-muted-foreground">{weather.condition}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-3.5 h-3.5 text-warning" />
          <div>
            <p className="text-xs text-muted-foreground">Sensação</p>
            <p className="text-sm font-mono text-foreground">{weather.feelsLike}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-info" />
          <div>
            <p className="text-xs text-muted-foreground">Vento</p>
            <p className="text-sm font-mono text-foreground">{weather.windSpeed} km/h {weather.windDirection}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Chuva</p>
            <p className="text-sm font-mono text-foreground">{weather.rain} mm</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Umidade</p>
            <p className="text-sm font-mono text-foreground">{weather.humidity}%</p>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default WeatherPanel;
