import { Layers2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Ciclovia } from "@/data/ciclovias";
import type { BaseLayerId } from "@/utils/mapUrlParams";
import { cn } from "@/lib/utils";

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

interface MapLayerFiltersPopoverProps {
  baseLayer: BaseLayerId;
  onBaseLayerChange: (id: BaseLayerId) => void;
  parksVisible: boolean;
  onParksVisibleChange: (value: boolean) => void;
  typeFilter: Record<Ciclovia["type"], boolean>;
  onToggleType: (key: Ciclovia["type"]) => void;
  safetyFilter: Record<Ciclovia["safety"], boolean>;
  onToggleSafety: (key: Ciclovia["safety"]) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
  favoriteCount: number;
}

export default function MapLayerFiltersPopover({
  baseLayer,
  onBaseLayerChange,
  parksVisible,
  onParksVisibleChange,
  typeFilter,
  onToggleType,
  safetyFilter,
  onToggleSafety,
  favoritesOnly,
  onFavoritesOnlyChange,
  favoriteCount,
}: MapLayerFiltersPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "glass-panel box-border flex h-12 shrink-0 items-center gap-2 sm:gap-3 px-3 sm:px-4",
            "text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors",
          )}
          aria-label="Mapa base e filtros da rede"
        >
          <Layers2 className="w-4 h-4 text-primary shrink-0" />
          <span className="hidden sm:inline">Mapa e filtros</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn("w-80 z-[100]", baseLayer === "light" && "light-map-ui")}
      >
        <div className="space-y-3">
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
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Filtros</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground/90 uppercase tracking-wider">Camadas</p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="popover-parks"
                    checked={parksVisible}
                    onCheckedChange={(v) => onParksVisibleChange(v === true)}
                  />
                  <Label
                    htmlFor="popover-parks"
                    className="text-xs font-normal text-muted-foreground cursor-pointer leading-snug"
                  >
                    Exibir parques
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground/90 uppercase tracking-wider">Tipo no mapa</p>
                <div className="space-y-2">
                  {typeRows.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`popover-type-${key}`}
                        checked={typeFilter[key]}
                        onCheckedChange={() => onToggleType(key)}
                      />
                      <Label
                        htmlFor={`popover-type-${key}`}
                        className="text-xs font-normal text-muted-foreground cursor-pointer leading-snug"
                      >
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
                        id={`popover-safety-${key}`}
                        checked={safetyFilter[key]}
                        onCheckedChange={() => onToggleSafety(key)}
                      />
                      <Label
                        htmlFor={`popover-safety-${key}`}
                        className="text-xs font-normal text-muted-foreground cursor-pointer leading-snug"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground/90 uppercase tracking-wider">Favoritos</p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="popover-favorites-only"
                    checked={favoritesOnly}
                    disabled={favoriteCount === 0}
                    onCheckedChange={(v) => onFavoritesOnlyChange(v === true)}
                  />
                  <Label
                    htmlFor="popover-favorites-only"
                    className={cn(
                      "text-xs font-normal leading-snug",
                      favoriteCount === 0 ? "text-muted-foreground/50 cursor-not-allowed" : "text-muted-foreground cursor-pointer",
                    )}
                  >
                    Só favoritos{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
