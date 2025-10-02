import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Edit2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EfetivarConsultaModal } from "@/components/modals/EfetivarConsultaModal";
import { EditarObservacoesModal } from "@/components/modals/EditarObservacoesModal";

export default function Dashboard() {
  const { user } = useAuth();
  const [valoresVisiveis, setValoresVisiveis] = useState(true);
  const [consultaSelecionada, setConsultaSelecionada] = useState<any>(null);
  const [modalEfetivarOpen, setModalEfetivarOpen] = useState(false);
  const [modalEditarObsOpen, setModalEditarObsOpen] = useState(false);
  const [periodoFiltro, setPeriodoFiltro] = useState<"hoje" | "semana" | "mes">("hoje");
  
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  // Transações do mês atual
  const { data: transactions } = useQuery({
    queryKey: ["transactions", user?.id, inicioMes, fimMes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fluxo_de_caixa")
        .select("*")
        .eq("user_id", user?.id)
        .gte("data", inicioMes.toISOString())
        .lte("data", fimMes.toISOString())
        .order("data", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Consultas filtradas por período
  const { data: consultasFiltradas } = useQuery({
    queryKey: ["consultas-periodo", periodoFiltro, user?.id],
    queryFn: async () => {
      let inicio, fim;
      
      if (periodoFiltro === "hoje") {
        inicio = startOfDay(hoje);
        fim = endOfDay(hoje);
      } else if (periodoFiltro === "semana") {
        inicio = startOfWeek(hoje, { locale: ptBR });
        fim = endOfWeek(hoje, { locale: ptBR });
      } else {
        inicio = inicioMes;
        fim = fimMes;
      }
      
      const { data, error } = await supabase
        .from("consultas")
        .select(`
          *,
          pacientes (nome)
        `)
        .eq("user_id", user?.id)
        .gte("data_agendamento", inicio.toISOString())
        .lte("data_agendamento", fim.toISOString())
        .order("data_agendamento");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Pacientes ativos (com vínculo)
  const { data: pacientesAtivos } = useQuery({
    queryKey: ["pacientes-ativos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id")
        .eq("user_id", user?.id)
        .eq("status", "com vinculo");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Consultas realizadas no mês
  const { data: consultasRealizadas } = useQuery({
    queryKey: ["consultas-realizadas", user?.id, inicioMes, fimMes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select("id")
        .eq("user_id", user?.id)
        .eq("status", "concluída")
        .gte("data_agendamento", inicioMes.toISOString())
        .lte("data_agendamento", fimMes.toISOString());

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Novos pacientes atendidos no mês (primeira consulta concluída)
  const { data: novosPacientes } = useQuery({
    queryKey: ["novos-pacientes", user?.id, inicioMes, fimMes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select("paciente_id")
        .eq("user_id", user?.id)
        .eq("status", "concluída")
        .gte("data_agendamento", inicioMes.toISOString())
        .lte("data_agendamento", fimMes.toISOString());

      if (error) throw error;
      
      // Contar pacientes únicos
      const pacientesUnicos = new Set(data.map(c => c.paciente_id));
      return pacientesUnicos.size;
    },
    enabled: !!user?.id,
  });

  const totalReceitas = transactions
    ?.filter((t) => t.tipo_transacao === "receita")
    .reduce((acc, t) => acc + Number(t.valor), 0) || 0;

  const totalDespesas = transactions
    ?.filter((t) => t.tipo_transacao === "despesa")
    .reduce((acc, t) => acc + Number(t.valor), 0) || 0;

  const saldo = totalReceitas - totalDespesas;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pendente: "outline",
      confirmada: "default",
      concluída: "secondary",
      cancelada: "destructive",
    };
    return variants[status] || "default";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setValoresVisiveis(!valoresVisiveis)}
              className="h-8 w-8"
            >
              {valoresVisiveis ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de gestão
          </p>
        </div>
      </div>

      {/* KPIs Financeiros */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Receitas"
          value={valoresVisiveis ? `R$ ${totalReceitas.toFixed(2)}` : "R$ --,--"}
          icon={DollarSign}
        />
        <KPICard
          title="Despesas"
          value={valoresVisiveis ? `R$ ${totalDespesas.toFixed(2)}` : "R$ --,--"}
          icon={TrendingUp}
        />
        <KPICard
          title="Saldo"
          value={valoresVisiveis ? `R$ ${saldo.toFixed(2)}` : "R$ --,--"}
          icon={DollarSign}
          variant={saldo >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Resumo do Mês */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Pacientes Ativos"
          value={(pacientesAtivos?.length || 0).toString()}
          icon={Users}
        />
        <KPICard
          title="Consultas Realizadas"
          value={(consultasRealizadas?.length || 0).toString()}
          icon={Calendar}
        />
        <KPICard
          title="Novos Pacientes"
          value={(novosPacientes || 0).toString()}
          icon={Users}
        />
      </div>

      {/* Consultas por Período */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Consultas
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={periodoFiltro === "hoje" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFiltro("hoje")}
              >
                Hoje
              </Button>
              <Button
                variant={periodoFiltro === "semana" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFiltro("semana")}
              >
                Esta Semana
              </Button>
              <Button
                variant={periodoFiltro === "mes" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFiltro("mes")}
              >
                Este Mês
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {consultasFiltradas && consultasFiltradas.length > 0 ? (
            <div className="space-y-3">
              {consultasFiltradas.map((consulta) => {
                const isConcluida = consulta.status === "concluída";
                return (
                  <div
                    key={consulta.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isConcluida ? "opacity-60 bg-muted/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (!isConcluida) {
                          setConsultaSelecionada(consulta);
                          setModalEfetivarOpen(true);
                        }
                      }}
                      disabled={isConcluida}
                      className="flex-1 text-left"
                    >
                      <div>
                        <p className="font-medium text-primary">
                          {consulta.pacientes?.nome}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(consulta.data_agendamento), "dd/MM/yyyy HH:mm")}
                          {consulta.tipo_consulta && ` - ${consulta.tipo_consulta}`}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadge(consulta.status || "pendente")}>
                        {consulta.status}
                      </Badge>
                      {isConcluida && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setConsultaSelecionada(consulta);
                            setModalEditarObsOpen(true);
                          }}
                          title="Editar observações"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma consulta encontrada neste período
            </p>
          )}
        </CardContent>
      </Card>

      {consultaSelecionada && (
        <>
          <EfetivarConsultaModal
            open={modalEfetivarOpen}
            onOpenChange={setModalEfetivarOpen}
            consulta={consultaSelecionada}
          />
          <EditarObservacoesModal
            open={modalEditarObsOpen}
            onOpenChange={setModalEditarObsOpen}
            consulta={consultaSelecionada}
          />
        </>
      )}
    </div>
  );
}
