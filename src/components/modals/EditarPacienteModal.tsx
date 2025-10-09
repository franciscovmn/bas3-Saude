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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditarPacienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: any;
}

export function EditarPacienteModal({ open, onOpenChange, paciente }: EditarPacienteModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    restricoes: "",
    objetivo: "",
  });

  useEffect(() => {
    if (paciente) {
      setFormData({
        nome: paciente.nome || "",
        telefone: paciente.telefone || "",
        email: paciente.email || "",
        restricoes: paciente.restricoes || "",
        objetivo: paciente.objetivo || "",
      });
    }
  }, [paciente]);

  const editarPacienteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("pacientes")
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          restricoes: formData.restricoes,
          objetivo: formData.objetivo,
        })
        .eq("id", paciente.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paciente atualizado com sucesso!");
      onOpenChange(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["paciente"] });
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    },
    onError: (error) => {
      console.error("Erro ao editar paciente:", error);
      toast.error("Erro ao atualizar paciente. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    editarPacienteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restricoes">Restrições</Label>
            <Textarea
              id="restricoes"
              value={formData.restricoes}
              onChange={(e) => setFormData({ ...formData, restricoes: e.target.value })}
              placeholder="Alergias, restrições alimentares, etc..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo Principal</Label>
            <Textarea
              id="objetivo"
              value={formData.objetivo}
              onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
              placeholder="Qual o objetivo do paciente?"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editarPacienteMutation.isPending}>
              {editarPacienteMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
