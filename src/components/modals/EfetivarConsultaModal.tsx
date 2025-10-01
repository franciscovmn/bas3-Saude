import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EfetivarConsultaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consulta: any;
}

export function EfetivarConsultaModal({
  open,
  onOpenChange,
  consulta,
}: EfetivarConsultaModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [observacoes, setObservacoes] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState<"avulsa" | "plano">("avulsa");
  const [planoSelecionado, setPlanoSelecionado] = useState<string>("");

  const { data: paciente } = useQuery({
    queryKey: ["paciente-efetivacao", consulta?.paciente_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", consulta?.paciente_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!consulta?.paciente_id && open,
  });

  const { data: planos } = useQuery({
    queryKey: ["planos-efetivacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_fidelizacao")
        .select("*")
        .order("preco");

      if (error) throw error;
      return data;
    },
    enabled: open && paciente?.status === "paciente novo",
  });

  const efetivarConsultaMutation = useMutation({
    mutationFn: async () => {
      // 1. Atualizar consulta para concluída
      const { error: consultaError } = await supabase
        .from("consultas")
        .update({
          status: "concluída",
          observacoes: observacoes,
          data_conclusao: new Date().toISOString(),
        })
        .eq("id", consulta.id);

      if (consultaError) throw consultaError;

      // 2. Se for paciente novo, atualizar status do paciente
      if (paciente?.status === "paciente novo") {
        const novoStatus = tipoConsulta === "avulsa" ? "sem vinculo" : "com vinculo";
        const planoId = tipoConsulta === "plano" ? parseInt(planoSelecionado) : null;

        const { error: pacienteError } = await supabase
          .from("pacientes")
          .update({
            status: novoStatus,
            plano_fidelizacao_id: planoId,
          })
          .eq("id", paciente.id);

        if (pacienteError) throw pacienteError;

        // 3. Inserir receita no fluxo de caixa
        if (tipoConsulta === "plano" && planoId) {
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
        }
      }
    },
    onSuccess: () => {
      toast.success("Consulta efetivada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["consultas-mes"] });
      queryClient.invalidateQueries({ queryKey: ["paciente"] });
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onOpenChange(false);
      setObservacoes("");
      setTipoConsulta("avulsa");
      setPlanoSelecionado("");
    },
    onError: (error) => {
      console.error("Erro ao efetivar consulta:", error);
      toast.error("Erro ao efetivar consulta. Tente novamente.");
    },
  });

  const handleSubmit = () => {
    if (paciente?.status === "paciente novo" && tipoConsulta === "plano" && !planoSelecionado) {
      toast.error("Selecione um plano de fidelização");
      return;
    }
    efetivarConsultaMutation.mutate();
  };

  const isPacienteNovo = paciente?.status === "paciente novo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Efetivar Consulta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isPacienteNovo ? (
            <>
              <div className="space-y-2">
                <Label>Tipo de Consulta</Label>
                <RadioGroup value={tipoConsulta} onValueChange={(v: any) => setTipoConsulta(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="avulsa" id="avulsa" />
                    <Label htmlFor="avulsa" className="font-normal cursor-pointer">
                      Consulta Avulsa
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="plano" id="plano" />
                    <Label htmlFor="plano" className="font-normal cursor-pointer">
                      Aderiu a um Plano
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {tipoConsulta === "plano" && (
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
              )}
            </>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                Confirmar a conclusão da consulta para <strong>{paciente?.nome}</strong>?
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações do Profissional</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Registre suas anotações sobre a consulta..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={efetivarConsultaMutation.isPending}>
            {efetivarConsultaMutation.isPending ? "Salvando..." : "Efetivar Consulta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
