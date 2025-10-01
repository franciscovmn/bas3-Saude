import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit, Mail, Phone, MapPin, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { EditarPacienteModal } from "@/components/modals/EditarPacienteModal";
import { useState } from "react";

export default function PacienteDetalhes() {
  const { id } = useParams();
  const { user } = useAuth();
  const [modalEditarOpen, setModalEditarOpen] = useState(false);

  const pacienteId = parseInt(id || "0");

  const { data: paciente, isLoading } = useQuery({
    queryKey: ["paciente", pacienteId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select(`
          *,
          planos_fidelizacao (*)
        `)
        .eq("id", pacienteId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!pacienteId,
  });

  const { data: consultas } = useQuery({
    queryKey: ["paciente-consultas", pacienteId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select("*")
        .eq("paciente_id", pacienteId)
        .eq("user_id", user?.id)
        .order("data_agendamento", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!pacienteId,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="p-6">
        <p>Paciente não encontrado</p>
      </div>
    );
  }

  const consultasConcluidas = consultas?.filter(c => c.status === "concluída").length || 0;
  const totalConsultas = paciente.planos_fidelizacao?.quantidade_consultas || 0;
  const progressoPlano = totalConsultas > 0 ? (consultasConcluidas / totalConsultas) * 100 : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link to="/pacientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{paciente.nome}</h1>
          <p className="text-muted-foreground">Ficha do Paciente</p>
        </div>
        <Button onClick={() => setModalEditarOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Cadastro
        </Button>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{paciente.telefone || "Não informado"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{paciente.email || "Não informado"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Endereço</p>
              <p className="font-medium">{paciente.endereco || "Não informado"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Widget do Plano */}
        <Card className={paciente.plano_fidelizacao_id ? "border-primary/20 bg-primary/5" : ""}>
          <CardHeader>
            <CardTitle>Plano de Fidelização</CardTitle>
          </CardHeader>
          <CardContent>
            {paciente.plano_fidelizacao_id && paciente.planos_fidelizacao ? (
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">{paciente.planos_fidelizacao.nome_plano}</p>
                  <p className="text-sm text-muted-foreground">
                    {paciente.planos_fidelizacao.descricao}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">
                      {consultasConcluidas} / {totalConsultas} consultas
                    </span>
                  </div>
                  <Progress value={progressoPlano} className="h-2" />
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Badge variant="outline" className="text-base">
                  Cliente Avulso
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Paciente sem plano de fidelização
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget de Restrições */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Restrições e Objetivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paciente.restricoes ? (
              <p className="text-sm leading-relaxed">{paciente.restricoes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma restrição registrada
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Consultas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          {consultas && consultas.length > 0 ? (
            <div className="space-y-4">
              {consultas.map((consulta) => (
                <div
                  key={consulta.id}
                  className="border-l-4 border-primary pl-4 py-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">
                      {format(new Date(consulta.data_agendamento), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                    <Badge>{consulta.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Objetivo:</strong> {consulta.objetivo_consulta || "Não especificado"}
                  </p>
                  {consulta.observacoes && (
                    <p className="text-sm">
                      <strong>Observações:</strong> {consulta.observacoes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma consulta registrada para este paciente
            </p>
          )}
        </CardContent>
      </Card>

      {paciente && (
        <EditarPacienteModal
          open={modalEditarOpen}
          onOpenChange={setModalEditarOpen}
          paciente={paciente}
        />
      )}
    </div>
  );
}
