import { motion } from "framer-motion";

const MapLegend = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-panel-sm p-3 space-y-2"
    >
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
      <div className="border-t border-border/50 pt-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-muted-foreground rounded-full" />
          <span className="text-xs text-muted-foreground">Ciclovia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-muted-foreground rounded-full border-dashed" style={{ borderTop: "2px dashed hsl(215, 20%, 55%)", height: 0, background: "none" }} />
          <span className="text-xs text-muted-foreground">Ciclofaixa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-muted-foreground rounded-full" style={{ borderTop: "2px dotted hsl(215, 20%, 55%)", height: 0, background: "none" }} />
          <span className="text-xs text-muted-foreground">Ciclorrota</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MapLegend;
