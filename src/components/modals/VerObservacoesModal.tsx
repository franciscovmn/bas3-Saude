import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VerObservacoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  observacoes: string;
  pacienteNome: string;
}

export function VerObservacoesModal({ 
  open, 
  onOpenChange, 
  observacoes,
  pacienteNome
}: VerObservacoesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Observações - {pacienteNome}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {observacoes}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
