import { Cloud, Droplets, Wind, Thermometer, Eye } from "lucide-react";
import { WeatherData } from "@/data/ciclovias";

interface WeatherPanelProps {
  weather: WeatherData;
}

const WeatherPanel = ({ weather }: WeatherPanelProps) => {
  return (
    <div className="glass-panel-sm p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clima agora</h3>
        <span className="text-xs text-muted-foreground">{weather.updatedAt}</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Cloud className="w-8 h-8 text-info" />
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
    </div>
  );
};

export default WeatherPanel;
