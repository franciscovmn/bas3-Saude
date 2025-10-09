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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NovaConsultaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaConsultaModal({ open, onOpenChange }: NovaConsultaModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pacienteId, setPacienteId] = useState("");
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [horaAgendamento, setHoraAgendamento] = useState("");
  const [objetivoConsulta, setObjetivoConsulta] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("");

  const { data: pacientes } = useQuery({
    queryKey: ["pacientes-lista", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id, nome, plano_fidelizacao_id, data_inicio_plano_atual")
        .eq("user_id", user?.id)
        .order("nome");

      if (error) throw error;
      return data;
    },
    enabled: open && !!user?.id,
  });

  // Buscar dados do plano do paciente selecionado
  const { data: pacienteSelecionado } = useQuery({
    queryKey: ["paciente-detalhes", pacienteId],
    queryFn: async () => {
      const { data: pacienteData, error: pacienteError } = await supabase
        .from("pacientes")
        .select("*, planos_fidelizacao(*)")
        .eq("id", parseInt(pacienteId))
        .single();

      if (pacienteError) throw pacienteError;

      // Contar consultas do ciclo atual
      let consultasNoCiclo = 0;
      if (pacienteData?.data_inicio_plano_atual) {
        const { data: consultasData, error: consultasError } = await supabase
          .from("consultas")
          .select("id, status")
          .eq("paciente_id", parseInt(pacienteId))
          .gte("data_agendamento", pacienteData.data_inicio_plano_atual);

        if (!consultasError && consultasData) {
          consultasNoCiclo = consultasData.length;
        }
      }

      return {
        ...pacienteData,
        consultasNoCiclo,
      };
    },
    enabled: !!pacienteId && open,
  });

  const criarConsultaMutation = useMutation({
    mutationFn: async () => {
      // Verificar se o paciente atingiu o limite de consultas do plano
      if (pacienteSelecionado?.planos_fidelizacao) {
        const plano = pacienteSelecionado.planos_fidelizacao;
        const consultasNoCiclo = pacienteSelecionado.consultasNoCiclo || 0;
        const limiteConsultas = plano.quantidade_consultas || 0;

        if (plano.nome_plano !== "Consulta Avulsa" && consultasNoCiclo >= limiteConsultas) {
          throw new Error(
            `Este paciente já atingiu o limite de ${limiteConsultas} consultas do plano "${plano.nome_plano}". É necessário renovar o plano antes de agendar mais consultas.`
          );
        }
      }

      const dataHora = `${dataAgendamento}T${horaAgendamento}:00`;
      
      const { error } = await supabase
        .from("consultas")
        .insert({
          user_id: user?.id,
          paciente_id: parseInt(pacienteId),
          data_agendamento: dataHora,
          objetivo_consulta: objetivoConsulta,
          tipo_consulta: tipoConsulta,
          status: "pendente",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Consulta agendada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["consultas-mes"] });
      onOpenChange(false);
      setPacienteId("");
      setDataAgendamento("");
      setHoraAgendamento("");
      setObjetivoConsulta("");
      setTipoConsulta("");
    },
    onError: (error) => {
      console.error("Erro ao agendar consulta:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao agendar consulta. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId || !dataAgendamento || !horaAgendamento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    criarConsultaMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Nova Consulta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="paciente" className="text-xs md:text-sm">Paciente *</Label>
            <Select value={pacienteId} onValueChange={setPacienteId}>
              <SelectTrigger className="text-xs md:text-sm">
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {pacientes?.map((paciente) => (
                  <SelectItem key={paciente.id} value={paciente.id.toString()} className="text-xs md:text-sm">
                    {paciente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="data" className="text-xs md:text-sm">Data *</Label>
              <Input
                id="data"
                type="date"
                value={dataAgendamento}
                onChange={(e) => setDataAgendamento(e.target.value)}
                required
                className="text-xs md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora" className="text-xs md:text-sm">Hora *</Label>
              <Input
                id="hora"
                type="time"
                value={horaAgendamento}
                onChange={(e) => setHoraAgendamento(e.target.value)}
                required
                className="text-xs md:text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-xs md:text-sm">Tipo de Consulta</Label>
            <Input
              id="tipo"
              value={tipoConsulta}
              onChange={(e) => setTipoConsulta(e.target.value)}
              placeholder="Ex: Avaliação, Retorno, etc."
              className="text-xs md:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivo" className="text-xs md:text-sm">Objetivo da Consulta</Label>
            <Textarea
              id="objetivo"
              value={objetivoConsulta}
              onChange={(e) => setObjetivoConsulta(e.target.value)}
              placeholder="Descreva o objetivo da consulta..."
              rows={3}
              className="text-xs md:text-sm"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto text-xs md:text-sm">
              Cancelar
            </Button>
            <Button type="submit" disabled={criarConsultaMutation.isPending} className="w-full sm:w-auto text-xs md:text-sm">
              {criarConsultaMutation.isPending ? "Salvando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
