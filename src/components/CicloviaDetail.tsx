import { X, Shield, Activity, Route, MapPin, Clock, Download, FileJson, Star } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Ciclovia, getSafetyLabel, getTypeLabel, getTrafficLevel, mockTrafficHistory } from "@/data/ciclovias";
import { downloadCicloviaGeoJson, downloadCicloviaGpx } from "@/utils/exportRoute";

interface CicloviaDetailProps {
  ciclovia: Ciclovia;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const safetyColorMap = {
  safe: "text-safe bg-safe/10 border-safe/20",
  moderate: "text-warning bg-warning/10 border-warning/20",
  caution: "text-danger bg-danger/10 border-danger/20",
};

const trafficColorMap = {
  low: "text-safe",
  medium: "text-warning",
  high: "text-danger",
};

const CicloviaDetail = ({ ciclovia, onClose, isFavorite, onToggleFavorite }: CicloviaDetailProps) => {
  const safety = getSafetyLabel(ciclovia.safety);
  const currentHour = new Date().getHours();
  const trafficLevel = getTrafficLevel(currentHour);

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="glass-panel p-5 w-full max-w-sm space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <h2 className="text-lg font-bold text-foreground leading-tight">{ciclovia.name}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" /> {ciclovia.neighborhood}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {onToggleFavorite !== undefined && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              aria-pressed={isFavorite}
            >
              <Star
                className={`w-4 h-4 ${isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
              />
            </button>
          )}
          <button type="button" onClick={onClose} className="p-1 hover:bg-secondary rounded-lg transition-colors" aria-label="Fechar">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full border ${safetyColorMap[ciclovia.safety]}`}>
          <Shield className="w-3 h-3 inline mr-1" />
          {safety.label}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Route className="w-3 h-3 inline mr-1" />
          {getTypeLabel(ciclovia.type, ciclovia.tipoLabelIppuc)}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-secondary-foreground">
          {ciclovia.length} km
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">{ciclovia.description}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadCicloviaGeoJson(ciclovia)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70"
          aria-label="Baixar trecho em GeoJSON"
        >
          <FileJson className="w-3.5 h-3.5 shrink-0" />
          GeoJSON
        </button>
        <button
          type="button"
          onClick={() => downloadCicloviaGpx(ciclovia)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70"
          aria-label="Baixar trecho em GPX"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          GPX
        </button>
      </div>

      {/* Current Status */}
      <div className="glass-panel-sm p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Agora ({currentHour}:00)
          </span>
          <span className={`text-xs font-medium ${trafficLevel === "Alto" ? "text-danger" : trafficLevel === "Médio" ? "text-warning" : "text-safe"}`}>
            Movimento: {trafficLevel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className={`w-3 h-3 ${trafficColorMap[ciclovia.avgTraffic]}`} />
          <span className="text-xs text-muted-foreground">
            Tráfego médio: <span className={`font-medium ${trafficColorMap[ciclovia.avgTraffic]}`}>
              {ciclovia.avgTraffic === "low" ? "Baixo" : ciclovia.avgTraffic === "medium" ? "Médio" : "Alto"}
            </span>
          </span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/85 leading-relaxed border border-border/40 rounded-lg px-2.5 py-2 bg-secondary/20">
        Movimento e gráfico abaixo são <span className="font-medium text-foreground/90">indicativos</span> (demonstração no app), não dados oficiais da IPPUC.
      </p>

      {/* Traffic Chart */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Histórico de movimento</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockTrafficHistory}>
              <defs>
                <linearGradient id="colorMovement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(168, 76%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(168, 76%, 40%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCyclists" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(210, 100%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
                axisLine={false}
                tickLine={false}
                interval={3}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 40%, 10%)",
                  border: "1px solid hsl(222, 20%, 18%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(210, 40%, 92%)",
                }}
                labelStyle={{ color: "hsl(215, 20%, 55%)" }}
              />
              <Area
                type="monotone"
                dataKey="movement"
                stroke="hsl(168, 76%, 40%)"
                fill="url(#colorMovement)"
                strokeWidth={2}
                name="Movimento"
              />
              <Area
                type="monotone"
                dataKey="cyclists"
                stroke="hsl(210, 100%, 60%)"
                fill="url(#colorCyclists)"
                strokeWidth={2}
                name="Ciclistas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default CicloviaDetail;
