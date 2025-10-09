import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DisponibilidadeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disponibilidade?: any;
}

export function DisponibilidadeModal({ open, onOpenChange, disponibilidade }: DisponibilidadeModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = !!disponibilidade;

  const [formData, setFormData] = useState({
    dia_semana: "0",
    hora_inicio: "",
    hora_fim: "",
    intervalo_inicio: "",
    intervalo_fim: "",
  });

  useEffect(() => {
    if (disponibilidade) {
      setFormData({
        dia_semana: disponibilidade.dia_semana?.toString() || "0",
        hora_inicio: disponibilidade.hora_inicio || "",
        hora_fim: disponibilidade.hora_fim || "",
        intervalo_inicio: disponibilidade.intervalo_inicio || "",
        intervalo_fim: disponibilidade.intervalo_fim || "",
      });
    } else {
      setFormData({
        dia_semana: "0",
        hora_inicio: "",
        hora_fim: "",
        intervalo_inicio: "",
        intervalo_fim: "",
      });
    }
  }, [disponibilidade, open]);

  const salvarDisponibilidadeMutation = useMutation({
    mutationFn: async () => {
      const dados = {
        user_id: user?.id,
        dia_semana: parseInt(formData.dia_semana),
        hora_inicio: formData.hora_inicio,
        hora_fim: formData.hora_fim,
        intervalo_inicio: formData.intervalo_inicio || null,
        intervalo_fim: formData.intervalo_fim || null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("disponibilidade")
          .update(dados)
          .eq("id", disponibilidade.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("disponibilidade").insert(dados);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Horário ${isEdit ? "atualizado" : "adicionado"} com sucesso!`);
      onOpenChange(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["disponibilidade"] });
    },
    onError: (error) => {
      console.error("Erro ao salvar disponibilidade:", error);
      toast.error("Erro ao salvar horário. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hora_inicio || !formData.hora_fim) {
      toast.error("Preencha os horários de início e fim");
      return;
    }
    salvarDisponibilidadeMutation.mutate();
  };

  const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar" : "Adicionar"} Horário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dia_semana">Dia da Semana *</Label>
            <Select value={formData.dia_semana} onValueChange={(v) => setFormData({ ...formData, dia_semana: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                {diasSemana.map((dia, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {dia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora Início *</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora_fim">Hora Fim *</Label>
              <Input
                id="hora_fim"
                type="time"
                value={formData.hora_fim}
                onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="intervalo_inicio">Intervalo Início</Label>
              <Input
                id="intervalo_inicio"
                type="time"
                value={formData.intervalo_inicio}
                onChange={(e) => setFormData({ ...formData, intervalo_inicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervalo_fim">Intervalo Fim</Label>
              <Input
                id="intervalo_fim"
                type="time"
                value={formData.intervalo_fim}
                onChange={(e) => setFormData({ ...formData, intervalo_fim: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvarDisponibilidadeMutation.isPending}>
              {salvarDisponibilidadeMutation.isPending ? "Salvando..." : isEdit ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
