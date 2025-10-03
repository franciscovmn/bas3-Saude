import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { FileText, Filter, TrendingUp, BarChart as BarChartIcon, FileBarChart } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
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
  const [selectedReport, setSelectedReport] = useState<{
    open: boolean;
    titulo: string;
    pergunta: string;
    resultado: string;
  }>({ open: false, titulo: "", pergunta: "", resultado: "" });

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

  const { data: relatoriosSalvos } = useQuery({
    queryKey: ["relatorios-salvos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relatorios_salvos")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

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

  // Dados para gráficos
  const dadosFidelizacao = [
    { name: "Com Vínculo", value: pacientesComVinculo, color: "hsl(var(--primary))" },
    { name: "Sem Vínculo", value: pacientesSemVinculo, color: "hsl(var(--muted))" },
  ];

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
            Análises e insights dos dados da clínica
          </p>
        </div>
      </div>

      {/* KPIs Fixos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Fidelização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{taxaFidelizacao.toFixed(1)}%</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dadosFidelizacao}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosFidelizacao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChartIcon className="h-4 w-4" />
              Total de Consultas Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{consultas?.length || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {dataInicio || dataFim ? "No período selecionado" : "Total geral"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Minhas Análises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="h-6 w-6" />
            Minhas Análises Salvas
          </h2>
        </div>

        {relatoriosSalvos && relatoriosSalvos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatoriosSalvos.map((relatorio) => (
              <Card
                key={relatorio.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setSelectedReport({
                  open: true,
                  titulo: relatorio.titulo,
                  pergunta: relatorio.pergunta,
                  resultado: relatorio.resultado,
                })}
              >
                <CardHeader>
                  <CardTitle className="text-base">{relatorio.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {relatorio.resultado}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(relatorio.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma análise salva ainda.</p>
              <p className="text-sm mt-1">
                Use o Assistente para gerar análises e salvá-las aqui.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Consultas
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

      <Dialog open={selectedReport.open} onOpenChange={(open) => setSelectedReport({ ...selectedReport, open })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedReport.titulo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Pergunta</Label>
              <p className="text-sm mt-1">{selectedReport.pergunta}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Resultado</Label>
              <div className="mt-1 p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedReport.resultado}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
