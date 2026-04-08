import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Ciclovia, getSafetyLabel, getTypeLabel } from "@/data/ciclovias";

interface SearchBarProps {
  ciclovias: Ciclovia[];
  onSelect: (ciclovia: Ciclovia) => void;
}

const SearchBar = ({ ciclovias, onSelect }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.length > 0
    ? ciclovias.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.street.toLowerCase().includes(query.toLowerCase()) ||
          c.neighborhood.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (ciclovia: Ciclovia) => {
    onSelect(ciclovia);
    setQuery(ciclovia.name);
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
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}>
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-2 w-full glass-panel overflow-hidden z-50"
          >
            <div className="max-h-64 overflow-y-auto">
              {filtered.map((ciclovia) => {
                const safety = getSafetyLabel(ciclovia.safety);
                return (
                  <button
                    key={ciclovia.id}
                    onMouseDown={() => handleSelect(ciclovia)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ciclovia.name}</p>
                      <p className="text-xs text-muted-foreground">{ciclovia.neighborhood} · {ciclovia.length} km</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{getTypeLabel(ciclovia.type)}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
