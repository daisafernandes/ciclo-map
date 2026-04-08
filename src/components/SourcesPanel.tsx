import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, FileText } from "lucide-react";
import { motion } from "framer-motion";
import {
  GEOCURITIBA_CICLOVIAS_DASHBOARD_URL,
  GEOCURITIBA_CICLOVIAS_MAP_PDF_URL,
} from "@/lib/officialSources";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SourcesPanelProps {
  onOpenTipologias?: () => void;
}

const SourcesPanel = ({ onOpenTipologias }: SourcesPanelProps) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass-panel-sm overflow-hidden"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-secondary/40 transition-colors rounded-lg">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Fontes oficiais
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 border-t border-border/50 px-3 pb-3 pt-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              <a
                href={GEOCURITIBA_CICLOVIAS_DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                GeoCuritiba — Estrutura cicloviária
                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
              </a>
              <span className="block mt-1 opacity-90">
                Painel IPPUC com totalizações e mapa da rede municipal.
              </span>
            </p>
            <p>
              <a
                href={GEOCURITIBA_CICLOVIAS_MAP_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Mapa cicloviário (referência 2025)
                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
              </a>
              <span className="block mt-1 opacity-90">
                PDF oficial IPPUC (A3), edição Maio/2025 — legenda e desenho da rede municipal.
              </span>
            </p>
            {onOpenTipologias && (
              <button
                type="button"
                onClick={onOpenTipologias}
                className="inline-flex items-center gap-1 font-medium text-foreground/90 hover:text-primary hover:underline text-left"
              >
                Tipologias (nomenclatura IPPUC)
              </button>
            )}
            <div className="overflow-hidden rounded-md border border-border/60 bg-background/40">
              <a
                href={GEOCURITIBA_CICLOVIAS_MAP_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-secondary/30 transition-colors"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="text-left leading-snug normal-case font-medium text-foreground/85">
                  Abrir PDF do mapa (A3, 2025)
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 ml-auto opacity-70" />
              </a>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

export default SourcesPanel;
