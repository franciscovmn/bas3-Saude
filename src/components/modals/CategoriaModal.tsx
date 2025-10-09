import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CategoriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoriaModal({ open, onOpenChange }: CategoriaModalProps) {
  const queryClient = useQueryClient();
  const [nomeCategoria, setNomeCategoria] = useState("");

  const criarCategoriaMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("categorias_despesa")
        .insert({ nome_categoria: nomeCategoria });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria criada com sucesso!");
      onOpenChange(false);
      setNomeCategoria("");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
    },
    onError: (error) => {
      console.error("Erro ao criar categoria:", error);
      toast.error("Erro ao criar categoria. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCategoria.trim()) {
      toast.error("Digite o nome da categoria");
      return;
    }
    criarCategoriaMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome_categoria">Nome da Categoria *</Label>
            <Input
              id="nome_categoria"
              value={nomeCategoria}
              onChange={(e) => setNomeCategoria(e.target.value)}
              placeholder="Ex: Aluguel, Material..."
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criarCategoriaMutation.isPending}>
              {criarCategoriaMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
