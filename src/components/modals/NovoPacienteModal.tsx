import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    objetivo: "",
    plano_fidelizacao_id: "",
  });

  const { data: planos } = useQuery({
    queryKey: ["planos-fidelizacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_fidelizacao")
        .select("*")
        .order("nome_plano");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const criarPacienteMutation = useMutation({
    mutationFn: async () => {
      const pacienteData: any = {
        user_id: user?.id,
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
        restricoes: formData.restricoes,
        objetivo: formData.objetivo,
        status: "paciente novo",
      };

      if (formData.plano_fidelizacao_id && formData.plano_fidelizacao_id !== "none") {
        pacienteData.plano_fidelizacao_id = parseInt(formData.plano_fidelizacao_id);
        pacienteData.status = "com vinculo";
      }

      const { error } = await supabase.from("pacientes").insert(pacienteData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paciente cadastrado com sucesso!");
      onOpenChange(false);
      setFormData({ nome: "", telefone: "", email: "", restricoes: "", objetivo: "", plano_fidelizacao_id: "" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-2">
            <Label htmlFor="plano">Plano de Fidelização (opcional)</Label>
            <Select
              value={formData.plano_fidelizacao_id}
              onValueChange={(value) => setFormData({ ...formData, plano_fidelizacao_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {planos?.map((plano) => (
                  <SelectItem key={plano.id} value={plano.id.toString()}>
                    {plano.nome_plano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
