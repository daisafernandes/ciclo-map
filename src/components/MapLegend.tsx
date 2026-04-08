import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Ciclovia } from "@/data/ciclovias";
import type { BaseLayerId } from "@/utils/mapUrlParams";

interface MapLegendProps {
  onOpenTipologias: () => void;
  parksVisible: boolean;
  onParksVisibleChange: (value: boolean) => void;
  typeFilter: Record<Ciclovia["type"], boolean>;
  onToggleType: (key: Ciclovia["type"]) => void;
  safetyFilter: Record<Ciclovia["safety"], boolean>;
  onToggleSafety: (key: Ciclovia["safety"]) => void;
  baseLayer: BaseLayerId;
  onBaseLayerChange: (id: BaseLayerId) => void;
}

const typeRows: { key: Ciclovia["type"]; label: string }[] = [
  { key: "ciclovia", label: "Ciclovia" },
  { key: "ciclofaixa", label: "Ciclofaixa e afins" },
  { key: "ciclorrota", label: "Ciclorrota / descaracterizada" },
];

const safetyRows: { key: Ciclovia["safety"]; label: string }[] = [
  { key: "safe", label: "Seguro" },
  { key: "moderate", label: "Moderado" },
  { key: "caution", label: "Atenção" },
];

const baseLayerOptions: { id: BaseLayerId; label: string }[] = [
  { id: "dark", label: "Escuro" },
  { id: "light", label: "Claro" },
  { id: "satellite", label: "Satélite" },
];

const MapLegend = ({
  onOpenTipologias,
  parksVisible,
  onParksVisibleChange,
  typeFilter,
  onToggleType,
  safetyFilter,
  onToggleSafety,
  baseLayer,
  onBaseLayerChange,
}: MapLegendProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-panel-sm p-3 space-y-3"
    >
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mapa base</p>
        <div
          className="flex rounded-md border border-border/50 bg-background/30 p-0.5 gap-0.5"
          role="group"
          aria-label="Alternar mapa base"
        >
          {baseLayerOptions.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onBaseLayerChange(id)}
              aria-pressed={baseLayer === id}
              aria-label={`Mapa ${label.toLowerCase()}`}
              className={`flex-1 rounded px-2 py-1.5 text-[11px] font-medium transition-colors ${
                baseLayer === id
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtros</h4>
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground/90 uppercase tracking-wider">Tipo no mapa</p>
        <div className="space-y-2">
          {typeRows.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`type-${key}`}
                checked={typeFilter[key]}
                onCheckedChange={() => onToggleType(key)}
              />
              <Label htmlFor={`type-${key}`} className="text-xs font-normal text-muted-foreground cursor-pointer leading-snug">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground/90 uppercase tracking-wider">Caminho seguro</p>
        <div className="space-y-2">
          {safetyRows.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`safety-${key}`}
                checked={safetyFilter[key]}
                onCheckedChange={() => onToggleSafety(key)}
              />
              <Label htmlFor={`safety-${key}`} className="text-xs font-normal text-muted-foreground cursor-pointer leading-snug">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-background/30 px-2 py-2">
        <Label htmlFor="parks-overlay" className="text-xs text-muted-foreground cursor-pointer leading-snug flex-1">
          Destaque de parques (OSM)
        </Label>
        <Switch id="parks-overlay" checked={parksVisible} onCheckedChange={onParksVisibleChange} />
      </div>

      <div className="border-t border-border/50 pt-2 space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Legenda</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-safe rounded-full" />
            <span className="text-xs text-muted-foreground">Seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-warning rounded-full" />
            <span className="text-xs text-muted-foreground">Moderado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-danger rounded-full" />
            <span className="text-xs text-muted-foreground">Atenção</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/90 leading-snug">
          Tipos no mapa seguem a classificação da camada IPPUC (GeoCuritiba). Traço e cor de segurança são do CicloMap.
        </p>
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-3 rounded-sm border border-emerald-700/80 bg-emerald-500/35"
              style={{ opacity: parksVisible ? 0.9 : 0.35 }}
            />
            <span className="text-xs text-muted-foreground">
              Parques grandes — OSM (≥ ~9 ha){!parksVisible ? " · desligado" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-muted-foreground rounded-full" />
            <span className="text-xs text-muted-foreground">Ciclovia</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0.5 bg-muted-foreground rounded-full border-dashed"
              style={{ borderTop: "2px dashed hsl(215, 20%, 55%)", height: 0, background: "none" }}
            />
            <span className="text-xs text-muted-foreground">Ciclofaixa e afins</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0.5 bg-muted-foreground rounded-full"
              style={{ borderTop: "2px dotted hsl(215, 20%, 55%)", height: 0, background: "none" }}
            />
            <span className="text-xs text-muted-foreground">Ciclorrota / descaracterizada</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 pt-2">
        <button
          type="button"
          onClick={onOpenTipologias}
          className="text-left text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Saiba mais sobre tipologias
        </button>
      </div>
    </motion.div>
  );
};

export default MapLegend;
