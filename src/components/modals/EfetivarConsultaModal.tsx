import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
  const [planoSelecionado, setPlanoSelecionado] = useState<string>("");
  const [agendarRetorno, setAgendarRetorno] = useState(false);

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
    enabled: open,
  });

  const { data: consultasRealizadas } = useQuery({
    queryKey: ["consultas-realizadas", consulta?.paciente_id, paciente?.data_inicio_plano_atual],
    queryFn: async () => {
      if (!paciente?.data_inicio_plano_atual) return 0;
      
      const { data, error } = await supabase
        .from("consultas")
        .select("id")
        .eq("paciente_id", consulta?.paciente_id)
        .eq("status", "concluída")
        .gte("data_agendamento", paciente.data_inicio_plano_atual);

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!consulta?.paciente_id && open && paciente?.status !== "paciente novo" && !!paciente?.data_inicio_plano_atual,
  });

  // Definir plano pré-selecionado para pacientes com plano
  useEffect(() => {
    if (paciente && open) {
      if (paciente.status === "paciente novo") {
        setPlanoSelecionado("");
      } else if (paciente.plano_fidelizacao_id) {
        setPlanoSelecionado(paciente.plano_fidelizacao_id.toString());
      }
    }
  }, [paciente, open]);

  const efetivarConsultaMutation = useMutation({
    mutationFn: async () => {
      if (!planoSelecionado) {
        throw new Error("Selecione um plano");
      }

      const planoId = parseInt(planoSelecionado);
      const planoEscolhido = planos?.find((p) => p.id === planoId);
      
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

      // 2. Se for paciente novo, atualizar status, plano e data_inicio_plano_atual
      if (paciente?.status === "paciente novo") {
        const isConsultaAvulsa = planoEscolhido?.nome_plano === "Consulta Avulsa";
        const novoStatus = isConsultaAvulsa ? "sem vinculo" : "com vinculo";

        const { error: pacienteError } = await supabase
          .from("pacientes")
          .update({
            status: novoStatus,
            plano_fidelizacao_id: planoId,
            data_inicio_plano_atual: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
          })
          .eq("id", paciente.id);

        if (pacienteError) throw pacienteError;

        // 3. Inserir receita no fluxo de caixa se não for consulta avulsa
        if (!isConsultaAvulsa && planoEscolhido) {
          const { error: caixaError } = await supabase
            .from("fluxo_de_caixa")
            .insert({
              user_id: user?.id,
              tipo_transacao: "receita",
              descricao: `Plano ${planoEscolhido.nome_plano} - ${paciente.nome}`,
              valor: planoEscolhido.preco,
              categoria: "Planos de Fidelização",
              data: new Date().toISOString(),
            });

          if (caixaError) throw caixaError;
        }
      } else {
        // Para pacientes existentes, atualizar o plano se mudou
        if (paciente?.plano_fidelizacao_id !== planoId) {
          const { error: pacienteError } = await supabase
            .from("pacientes")
            .update({ plano_fidelizacao_id: planoId })
            .eq("id", paciente.id);

          if (pacienteError) throw pacienteError;
        }
      }

      // 4. Se agendarRetorno estiver marcado, enviar webhook para n8n
      if (agendarRetorno && paciente) {
        try {
          await fetch("https://bossycaracal-n8n.cloudfy.cloud/webhook/aeb393db-ec5a-4811-8dd5-b1b5eaa5df46", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: paciente.id,
              nome: paciente.nome,
              telefone: paciente.telefone,
              data_inicio_plano_atual: new Date().toISOString().split('T')[0],
            }),
          });
        } catch (error) {
          console.error("Erro ao enviar webhook:", error);
          // Não bloquear a efetivação se o webhook falhar
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
      setPlanoSelecionado("");
      setAgendarRetorno(false);
    },
    onError: (error) => {
      console.error("Erro ao efetivar consulta:", error);
      toast.error((error as Error).message || "Erro ao efetivar consulta. Tente novamente.");
    },
  });

  const handleSubmit = () => {
    if (!planoSelecionado) {
      toast.error("Selecione um plano");
      return;
    }
    efetivarConsultaMutation.mutate();
  };

  const isPacienteNovo = paciente?.status === "paciente novo";
  const planoAtual = planos?.find(p => p.id === paciente?.plano_fidelizacao_id);
  const consultasDoPlano = consultasRealizadas || 0;
  const totalConsultasPlano = planoAtual?.quantidade_consultas || 0;
  const progressoConsultas = totalConsultasPlano > 0 ? (consultasDoPlano / totalConsultasPlano) * 100 : 0;
  const isUltimaConsulta = !isPacienteNovo && planoAtual && planoAtual.nome_plano !== "Consulta Avulsa" && (consultasDoPlano + 1) >= totalConsultasPlano;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Efetivar Consulta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Alerta de Última Consulta */}
          {isUltimaConsulta && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Esta é a última consulta do plano deste paciente. Converse sobre a renovação.
              </AlertDescription>
            </Alert>
          )}

          {/* Contexto do Paciente */}
          {(paciente?.objetivo || paciente?.restricoes) && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4 space-y-2">
                {paciente?.objetivo && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Objetivo</Label>
                    <p className="text-sm">{paciente.objetivo}</p>
                  </div>
                )}
                {paciente?.restricoes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Restrições</Label>
                    <p className="text-sm">{paciente.restricoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Seleção de Plano - Para Paciente Novo */}
          {isPacienteNovo && (
            <div className="space-y-2">
              <Label>Plano da Consulta *</Label>
              <Select value={planoSelecionado} onValueChange={setPlanoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {planos?.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id.toString()}>
                      {plano.nome_plano} - R$ {Number(plano.preco).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Plano Atual e Progresso - Para Paciente de Retorno */}
          {!isPacienteNovo && planoAtual && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Plano Atual</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">{planoAtual.nome_plano}</p>
                  <p className="text-xs text-muted-foreground">R$ {Number(planoAtual.preco).toFixed(2)}</p>
                </div>
              </div>

              {planoAtual.nome_plano !== "Consulta Avulsa" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <Label>Progresso no Plano</Label>
                    <span className="text-muted-foreground">
                      Consulta {consultasDoPlano + 1} de {totalConsultasPlano}
                    </span>
                  </div>
                  <Progress value={progressoConsultas} className="h-2" />
                </div>
              )}
            </div>
          )}

          {/* Observações */}
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

          {/* Switch para Agendar Retorno via WhatsApp */}
          <div className="flex items-center justify-between space-x-2 p-3 bg-muted/50 rounded-md">
            <div className="space-y-0.5">
              <Label htmlFor="agendar-retorno" className="cursor-pointer">
                Agendar Retorno via WhatsApp
              </Label>
              <p className="text-xs text-muted-foreground">
                Enviar mensagem automática para agendar próxima consulta
              </p>
            </div>
            <Switch
              id="agendar-retorno"
              checked={agendarRetorno}
              onCheckedChange={setAgendarRetorno}
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
