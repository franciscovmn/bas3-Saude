import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditarObservacoesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consulta: any;
}

export function EditarObservacoesModal({
  open,
  onOpenChange,
  consulta,
}: EditarObservacoesModalProps) {
  const queryClient = useQueryClient();
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (consulta) {
      setObservacoes(consulta.observacoes || "");
    }
  }, [consulta]);

  const editarObservacoesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("consultas")
        .update({ observacoes })
        .eq("id", consulta.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Observações atualizadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["consultas-mes"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Erro ao atualizar observações:", error);
      toast.error("Erro ao atualizar observações. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editarObservacoesMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Observações</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações do Profissional</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Registre suas anotações sobre a consulta..."
              rows={6}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editarObservacoesMutation.isPending}>
              {editarObservacoesMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
