import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Filter, TrendingUp, Award, BarChart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Link } from "react-router-dom";
import { VerObservacoesModal } from "@/components/modals/VerObservacoesModal";

export default function Relatorios() {
  const { user } = useAuth();
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacoesModal, setObservacoesModal] = useState<{
    open: boolean;
    observacoes: string;
    pacienteNome: string;
  }>({ open: false, observacoes: "", pacienteNome: "" });

  const { data: consultas } = useQuery({
    queryKey: ["relatorio-consultas", dataInicio, dataFim, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("consultas")
        .select(`
          *,
          pacientes (nome, status, restricoes, planos_fidelizacao (nome_plano))
        `)
        .eq("user_id", user?.id)
        .eq("status", "concluída")
        .order("data_agendamento", { ascending: false });

      if (dataInicio) {
        query = query.gte("data_agendamento", new Date(dataInicio).toISOString());
      }
      if (dataFim) {
        query = query.lte("data_agendamento", new Date(dataFim).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: todosPlanos } = useQuery({
    queryKey: ["todos-planos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_fidelizacao")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  const { data: todosPacientes } = useQuery({
    queryKey: ["todos-pacientes-relatorio", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id, status, plano_fidelizacao_id")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: todasConsultasConcluidas } = useQuery({
    queryKey: ["todas-consultas-concluidas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select("id, paciente_id")
        .eq("user_id", user?.id)
        .eq("status", "concluída");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Métricas
  const pacientesComVinculo = todosPacientes?.filter(p => p.status === "com vinculo").length || 0;
  const pacientesSemVinculo = todosPacientes?.filter(p => p.status === "sem vinculo").length || 0;
  const totalPacientesAtivos = pacientesComVinculo + pacientesSemVinculo;
  const taxaFidelizacao = totalPacientesAtivos > 0 
    ? (pacientesComVinculo / totalPacientesAtivos) * 100 
    : 0;

  // Plano mais popular
  const contagemPlanos = todosPacientes?.reduce((acc, p) => {
    if (p.plano_fidelizacao_id) {
      acc[p.plano_fidelizacao_id] = (acc[p.plano_fidelizacao_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const planoMaisPopularId = contagemPlanos 
    ? Object.entries(contagemPlanos).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  const planoMaisPopular = planoMaisPopularId 
    ? todosPlanos?.find(p => p.id === parseInt(planoMaisPopularId))
    : null;

  // Média de consultas por paciente fidelizado
  const consultasPorPaciente = todasConsultasConcluidas?.reduce((acc, c) => {
    acc[c.paciente_id] = (acc[c.paciente_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const pacientesFidelizadosIds = todosPacientes
    ?.filter(p => p.status === "com vinculo")
    .map(p => p.id) || [];

  const consultasPacientesFidelizados = pacientesFidelizadosIds
    .map(id => consultasPorPaciente?.[id] || 0);

  const mediaConsultasFidelizados = consultasPacientesFidelizados.length > 0
    ? consultasPacientesFidelizados.reduce((a, b) => a + b, 0) / consultasPacientesFidelizados.length
    : 0;

  const getStatusBadge = (status: string): "default" | "secondary" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      novo: "default",
      ativo: "secondary",
      inativo: "outline",
    };
    return variants[status] || "default";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Histórico completo de consultas realizadas
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDataInicio("");
                  setDataFim("");
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Fidelização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{taxaFidelizacao.toFixed(1)}%</div>
            <div className="space-y-2">
              <Progress value={taxaFidelizacao} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {pacientesComVinculo} de {totalPacientesAtivos} pacientes ativos
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Plano Mais Popular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {planoMaisPopular?.nome_plano || "N/A"}
            </div>
            {planoMaisPopularId && (
              <p className="text-xs text-muted-foreground mt-1">
                {contagemPlanos?.[parseInt(planoMaisPopularId)]} pacientes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Média de Consultas (Fidelizados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mediaConsultasFidelizados.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              consultas por paciente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultas Realizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultas && consultas.length > 0 ? (
                consultas.map((consulta) => (
                  <TableRow key={consulta.id}>
                    <TableCell>
                      {format(new Date(consulta.data_agendamento), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={`/pacientes/${consulta.paciente_id}`}
                              className="text-primary hover:underline"
                            >
                              {consulta.pacientes?.nome}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">Restrições:</p>
                              <p className="text-sm">
                                {consulta.pacientes?.restricoes || "Nenhuma restrição"}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(consulta.pacientes?.status || "novo")}>
                        {consulta.pacientes?.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {consulta.pacientes?.planos_fidelizacao?.nome_plano || "Consulta Avulsa"}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {consulta.observacoes ? (
                        <div className="flex items-center gap-2">
                          <span className="truncate flex-1">
                            {consulta.observacoes.length > 50
                              ? `${consulta.observacoes.substring(0, 50)}...`
                              : consulta.observacoes}
                          </span>
                          {consulta.observacoes.length > 50 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setObservacoesModal({
                                open: true,
                                observacoes: consulta.observacoes,
                                pacienteNome: consulta.pacientes?.nome || "Paciente"
                              })}
                              className="text-xs"
                            >
                              Ver mais
                            </Button>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma consulta encontrada no período selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <VerObservacoesModal
        open={observacoesModal.open}
        onOpenChange={(open) => setObservacoesModal({ ...observacoesModal, open })}
        observacoes={observacoesModal.observacoes}
        pacienteNome={observacoesModal.pacienteNome}
      />
    </div>
  );
}
