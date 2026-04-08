import { useState, useRef, useMemo } from "react";
import { Search, X, MapPin, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Ciclovia, getTypeLabel } from "@/data/ciclovias";

function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

interface SearchBarProps {
  ciclovias: Ciclovia[];
  onSelectCiclovia: (ciclovia: Ciclovia) => void;
  onSelectNeighborhood: (neighborhoodName: string, cicloviasInNeighborhood: Ciclovia[]) => void;
}

const SearchBar = ({ ciclovias, onSelectCiclovia, onSelectNeighborhood }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { neighborhoodRows, cicloviaRows } = useMemo(() => {
    const q = query.trim();
    if (q.length === 0) {
      return { neighborhoodRows: [] as { name: string; list: Ciclovia[] }[], cicloviaRows: [] as Ciclovia[] };
    }
    const nq = normalizeSearch(q);

    const matchesText = (text: string) => normalizeSearch(text).includes(nq);

    const byNeighborhood = new Map<string, Ciclovia[]>();
    for (const c of ciclovias) {
      if (matchesText(c.neighborhood)) {
        const list = byNeighborhood.get(c.neighborhood) ?? [];
        list.push(c);
        byNeighborhood.set(c.neighborhood, list);
      }
    }
    const neighborhoodRows = [...byNeighborhood.entries()]
      .map(([name, list]) => ({ name, list }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const cicloviaRows = ciclovias.filter(
      (c) =>
        matchesText(c.name) ||
        matchesText(c.street) ||
        matchesText(c.neighborhood),
    );

    return { neighborhoodRows, cicloviaRows };
  }, [ciclovias, query]);

  const hasResults = neighborhoodRows.length > 0 || cicloviaRows.length > 0;

  const handleSelectCiclovia = (ciclovia: Ciclovia) => {
    onSelectCiclovia(ciclovia);
    setQuery(ciclovia.name);
    setIsFocused(false);
  };

  const handleSelectNeighborhood = (name: string, list: Ciclovia[]) => {
    onSelectNeighborhood(name, list);
    setQuery(name);
    setIsFocused(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className={`glass-panel flex items-center gap-3 px-4 py-3 transition-all duration-300 ${isFocused ? "glow-accent ring-1 ring-primary/30" : ""}`}>
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar ciclovia, rua ou bairro..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && hasResults && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-2 w-full glass-panel overflow-hidden z-50"
          >
            <div className="max-h-64 overflow-y-auto">
              {neighborhoodRows.length > 0 && (
                <div className="border-b border-border/40">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Bairros
                  </p>
                  {neighborhoodRows.map(({ name, list }) => (
                    <button
                      key={`nb-${name}`}
                      type="button"
                      onMouseDown={() => handleSelectNeighborhood(name, list)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <Building2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          Bairro · {list.length} {list.length === 1 ? "trecho" : "trechos"} cicloviário{list.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {cicloviaRows.length > 0 && (
                <div>
                  {neighborhoodRows.length > 0 && (
                    <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Ciclovias
                    </p>
                  )}
                  {cicloviaRows.map((ciclovia) => (
                    <button
                      key={ciclovia.id}
                      type="button"
                      onMouseDown={() => handleSelectCiclovia(ciclovia)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ciclovia.name}</p>
                        <p className="text-xs text-muted-foreground">{ciclovia.neighborhood} · {ciclovia.length} km</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{getTypeLabel(ciclovia.type, ciclovia.tipoLabelIppuc)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
