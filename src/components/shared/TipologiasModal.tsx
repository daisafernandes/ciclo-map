import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tipologiasCicloviarias } from "@/data/tipologias";

export interface TipologiasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TipologiasModal({ open, onOpenChange }: TipologiasModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 px-6 pb-4 pt-2 text-left sm:pr-12">
          <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">Tipologias</DialogTitle>
          <DialogDescription className="text-left text-base leading-relaxed">
            Glossário das principais infraestruturas cicloviárias e como se diferenciam na via e na calçada.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="rounded-xl border border-border/60 bg-card/40 p-1 shadow-sm">
            <Accordion type="single" collapsible defaultValue="ciclovia" className="px-3 sm:px-4">
              {tipologiasCicloviarias.map((item) => (
                <AccordionItem key={item.id} value={item.id} id={item.id}>
                  <AccordionTrigger className="text-left text-base hover:no-underline [&[data-state=open]]:text-primary">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="pr-2 leading-relaxed text-muted-foreground">{item.description}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
