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
        .select("id, nome")
        .eq("user_id", user?.id)
        .order("nome");

      if (error) throw error;
      return data;
    },
    enabled: open && !!user?.id,
  });

  const criarConsultaMutation = useMutation({
    mutationFn: async () => {
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
      toast.error("Erro ao agendar consulta. Tente novamente.");
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Consulta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="paciente">Paciente *</Label>
            <Select value={pacienteId} onValueChange={setPacienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {pacientes?.map((paciente) => (
                  <SelectItem key={paciente.id} value={paciente.id.toString()}>
                    {paciente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                value={dataAgendamento}
                onChange={(e) => setDataAgendamento(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <Input
                id="hora"
                type="time"
                value={horaAgendamento}
                onChange={(e) => setHoraAgendamento(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Consulta</Label>
            <Input
              id="tipo"
              value={tipoConsulta}
              onChange={(e) => setTipoConsulta(e.target.value)}
              placeholder="Ex: Avaliação, Retorno, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo da Consulta</Label>
            <Textarea
              id="objetivo"
              value={objetivoConsulta}
              onChange={(e) => setObjetivoConsulta(e.target.value)}
              placeholder="Descreva o objetivo da consulta..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criarConsultaMutation.isPending}>
              {criarConsultaMutation.isPending ? "Salvando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
