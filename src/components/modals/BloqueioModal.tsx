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
import { Checkbox } from "@/components/ui/checkbox";

interface BloqueioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bloqueio?: any;
}

export function BloqueioModal({ open, onOpenChange, bloqueio }: BloqueioModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = !!bloqueio;

  const [formData, setFormData] = useState({
    data_inicio: "",
    data_fim: "",
    motivo: "",
    dia_inteiro: true,
  });

  useEffect(() => {
    if (bloqueio) {
      setFormData({
        data_inicio: bloqueio.data_inicio?.split("T")[0] || "",
        data_fim: bloqueio.data_fim?.split("T")[0] || "",
        motivo: bloqueio.motivo || "",
        dia_inteiro: bloqueio.dia_inteiro ?? true,
      });
    } else {
      setFormData({
        data_inicio: "",
        data_fim: "",
        motivo: "",
        dia_inteiro: true,
      });
    }
  }, [bloqueio, open]);

  const salvarBloqueioMutation = useMutation({
    mutationFn: async () => {
      const dados = {
        user_id: user?.id,
        data_inicio: new Date(formData.data_inicio).toISOString(),
        data_fim: new Date(formData.data_fim).toISOString(),
        motivo: formData.motivo,
        dia_inteiro: formData.dia_inteiro,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("bloqueios_agenda")
          .update(dados)
          .eq("id", bloqueio.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bloqueios_agenda").insert(dados);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Bloqueio ${isEdit ? "atualizado" : "criado"} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["bloqueios"] });
      queryClient.invalidateQueries({ queryKey: ["bloqueios-config"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Erro ao salvar bloqueio:", error);
      toast.error("Erro ao salvar bloqueio. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.data_inicio || !formData.data_fim || !formData.motivo.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    salvarBloqueioMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar" : "Novo"} Bloqueio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Data Fim *</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Input
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Ex: Férias, Congresso..."
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dia_inteiro"
              checked={formData.dia_inteiro}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, dia_inteiro: checked as boolean })
              }
            />
            <Label htmlFor="dia_inteiro" className="font-normal cursor-pointer">
              Dia Inteiro
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvarBloqueioMutation.isPending}>
              {salvarBloqueioMutation.isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
