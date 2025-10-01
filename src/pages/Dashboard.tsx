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
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [valoresVisiveis, setValoresVisiveis] = useState(true);
  
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

  // Consultas de hoje
  const { data: consultasHoje } = useQuery({
    queryKey: ["consultas-hoje", user?.id],
    queryFn: async () => {
      const inicioDia = startOfDay(hoje);
      const fimDia = endOfDay(hoje);
      
      const { data, error } = await supabase
        .from("consultas")
        .select(`
          *,
          pacientes (nome)
        `)
        .eq("user_id", user?.id)
        .gte("data_agendamento", inicioDia.toISOString())
        .lte("data_agendamento", fimDia.toISOString())
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de gestão
          </p>
        </div>
      </div>

      {/* KPIs Financeiros */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8"
            onClick={() => setValoresVisiveis(!valoresVisiveis)}
          >
            {valoresVisiveis ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <KPICard
            title="Receitas"
            value={valoresVisiveis ? `R$ ${totalReceitas.toFixed(2)}` : "R$ --,--"}
            icon={DollarSign}
          />
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8"
            onClick={() => setValoresVisiveis(!valoresVisiveis)}
          >
            {valoresVisiveis ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <KPICard
            title="Despesas"
            value={valoresVisiveis ? `R$ ${totalDespesas.toFixed(2)}` : "R$ --,--"}
            icon={TrendingUp}
          />
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8"
            onClick={() => setValoresVisiveis(!valoresVisiveis)}
          >
            {valoresVisiveis ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <KPICard
            title="Saldo"
            value={valoresVisiveis ? `R$ ${saldo.toFixed(2)}` : "R$ --,--"}
            icon={DollarSign}
            variant={saldo >= 0 ? "success" : "destructive"}
          />
        </div>
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

      {/* Consultas de Hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Consultas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consultasHoje && consultasHoje.length > 0 ? (
            <div className="space-y-3">
              {consultasHoje.map((consulta) => (
                <div
                  key={consulta.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <Link
                      to={`/pacientes/${consulta.paciente_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {consulta.pacientes?.nome}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(consulta.data_agendamento), "HH:mm")}
                      {consulta.tipo_consulta && ` - ${consulta.tipo_consulta}`}
                    </p>
                  </div>
                  <Badge variant={getStatusBadge(consulta.status || "pendente")}>
                    {consulta.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma consulta agendada para hoje
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
