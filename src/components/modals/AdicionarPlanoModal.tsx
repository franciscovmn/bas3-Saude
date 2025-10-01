import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface AdicionarPlanoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: any;
}

export function AdicionarPlanoModal({
  open,
  onOpenChange,
  paciente,
}: AdicionarPlanoModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [planoSelecionado, setPlanoSelecionado] = useState("");

  const { data: planos } = useQuery({
    queryKey: ["planos-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_fidelizacao")
        .select("*")
        .order("preco");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const adicionarPlanoMutation = useMutation({
    mutationFn: async () => {
      const planoId = parseInt(planoSelecionado);
      
      // Atualizar paciente
      const { error: pacienteError } = await supabase
        .from("pacientes")
        .update({
          status: "com vinculo",
          plano_fidelizacao_id: planoId,
        })
        .eq("id", paciente.id);

      if (pacienteError) throw pacienteError;

      // Inserir receita no fluxo de caixa
      const plano = planos?.find((p) => p.id === planoId);
      if (plano) {
        const { error: caixaError } = await supabase
          .from("fluxo_de_caixa")
          .insert({
            user_id: user?.id,
            tipo_transacao: "receita",
            descricao: `Plano ${plano.nome_plano} - ${paciente.nome}`,
            valor: plano.preco,
            categoria: "Planos de Fidelização",
            data: new Date().toISOString(),
          });

        if (caixaError) throw caixaError;
      }
    },
    onSuccess: () => {
      toast.success("Plano adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["paciente"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onOpenChange(false);
      setPlanoSelecionado("");
    },
    onError: (error) => {
      console.error("Erro ao adicionar plano:", error);
      toast.error("Erro ao adicionar plano. Tente novamente.");
    },
  });

  const handleSubmit = () => {
    if (!planoSelecionado) {
      toast.error("Selecione um plano");
      return;
    }
    adicionarPlanoMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Plano de Fidelização</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              Adicionando plano para: <strong>{paciente?.nome}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Plano de Fidelização</Label>
            <Select value={planoSelecionado} onValueChange={setPlanoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {planos?.map((plano) => (
                  <SelectItem key={plano.id} value={plano.id.toString()}>
                    {plano.nome_plano} - R$ {Number(plano.preco).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={adicionarPlanoMutation.isPending}>
            {adicionarPlanoMutation.isPending ? "Salvando..." : "Adicionar Plano"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
