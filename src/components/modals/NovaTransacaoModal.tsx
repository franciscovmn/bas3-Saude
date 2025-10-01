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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NovaTransacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "receita" | "despesa";
}

export function NovaTransacaoModal({ open, onOpenChange, tipo }: NovaTransacaoModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    categoria: "",
    data: new Date().toISOString().split("T")[0],
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_despesa")
        .select("*")
        .order("nome_categoria");

      if (error) throw error;
      return data;
    },
    enabled: open && tipo === "despesa",
  });

  const criarTransacaoMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fluxo_de_caixa").insert({
        user_id: user?.id,
        tipo_transacao: tipo,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        categoria: formData.categoria,
        data: new Date(formData.data).toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${tipo === "receita" ? "Receita" : "Despesa"} adicionada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onOpenChange(false);
      setFormData({ descricao: "", valor: "", categoria: "", data: new Date().toISOString().split("T")[0] });
    },
    onError: (error) => {
      console.error("Erro ao criar transação:", error);
      toast.error("Erro ao adicionar transação. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao.trim() || !formData.valor || !formData.categoria) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    criarTransacaoMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova {tipo === "receita" ? "Receita" : "Despesa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da transação"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          {tipo === "despesa" ? (
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nome_categoria}>
                      {cat.nome_categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="categoria-receita">Categoria *</Label>
              <Input
                id="categoria-receita"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Consultas, Planos..."
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criarTransacaoMutation.isPending}>
              {criarTransacaoMutation.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
