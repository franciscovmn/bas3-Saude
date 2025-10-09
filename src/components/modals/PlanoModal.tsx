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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlanoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano?: any;
}

export function PlanoModal({ open, onOpenChange, plano }: PlanoModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!plano;

  const [formData, setFormData] = useState({
    nome_plano: "",
    descricao: "",
    preco: "",
    quantidade_consultas: "",
    duracao_meses: "",
    renovacao_automatica: "true",
  });

  useEffect(() => {
    if (plano) {
      setFormData({
        nome_plano: plano.nome_plano || "",
        descricao: plano.descricao || "",
        preco: plano.preco?.toString() || "",
        quantidade_consultas: plano.quantidade_consultas?.toString() || "",
        duracao_meses: plano.duracao_meses?.toString() || "",
        renovacao_automatica: plano.renovacao_automatica?.toString() || "true",
      });
    } else {
      setFormData({
        nome_plano: "",
        descricao: "",
        preco: "",
        quantidade_consultas: "",
        duracao_meses: "",
        renovacao_automatica: "true",
      });
    }
  }, [plano, open]);

  const salvarPlanoMutation = useMutation({
    mutationFn: async () => {
      const dados = {
        nome_plano: formData.nome_plano,
        descricao: formData.descricao,
        preco: parseFloat(formData.preco),
        quantidade_consultas: parseInt(formData.quantidade_consultas),
        duracao_meses: parseInt(formData.duracao_meses),
        renovacao_automatica: formData.renovacao_automatica === "true",
      };

      if (isEdit) {
        const { error } = await supabase
          .from("planos_fidelizacao")
          .update(dados)
          .eq("id", plano.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("planos_fidelizacao").insert(dados);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Plano ${isEdit ? "atualizado" : "criado"} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["planos"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Erro ao salvar plano:", error);
      toast.error("Erro ao salvar plano. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_plano.trim() || !formData.preco || !formData.quantidade_consultas) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    salvarPlanoMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar" : "Novo"} Plano</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome_plano">Nome do Plano *</Label>
            <Input
              id="nome_plano"
              value={formData.nome_plano}
              onChange={(e) => setFormData({ ...formData, nome_plano: e.target.value })}
              placeholder="Ex: Plano Mensal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do plano..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco">Preço *</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade_consultas">Consultas *</Label>
              <Input
                id="quantidade_consultas"
                type="number"
                value={formData.quantidade_consultas}
                onChange={(e) => setFormData({ ...formData, quantidade_consultas: e.target.value })}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao_meses">Duração (meses)</Label>
            <Input
              id="duracao_meses"
              type="number"
              value={formData.duracao_meses}
              onChange={(e) => setFormData({ ...formData, duracao_meses: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renovacao_automatica">Tipo de Plano *</Label>
            <Select
              value={formData.renovacao_automatica}
              onValueChange={(value) => setFormData({ ...formData, renovacao_automatica: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Recorrente (Com Vínculo)</SelectItem>
                <SelectItem value="false">Avulso (Sem Vínculo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvarPlanoMutation.isPending}>
              {salvarPlanoMutation.isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
