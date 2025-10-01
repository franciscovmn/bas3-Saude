import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

interface NovoPacienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovoPacienteModal({ open, onOpenChange }: NovoPacienteModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    restricoes: "",
  });

  const criarPacienteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pacientes").insert({
        user_id: user?.id,
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
        restricoes: formData.restricoes,
        status: "paciente novo",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paciente cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      onOpenChange(false);
      setFormData({ nome: "", telefone: "", email: "", restricoes: "" });
    },
    onError: (error) => {
      console.error("Erro ao criar paciente:", error);
      toast.error("Erro ao cadastrar paciente. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    criarPacienteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
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
            <Label htmlFor="restricoes">Observações / Restrições</Label>
            <Textarea
              id="restricoes"
              value={formData.restricoes}
              onChange={(e) => setFormData({ ...formData, restricoes: e.target.value })}
              placeholder="Anote informações importantes sobre o paciente..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criarPacienteMutation.isPending}>
              {criarPacienteMutation.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
