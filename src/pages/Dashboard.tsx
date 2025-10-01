import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KPICard } from "@/components/dashboard/KPICard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingDown,
  Wallet,
  TrendingUp,
  Plus,
  Calendar as CalendarIcon,
  Users,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Buscar receitas e despesas do mês
  const { data: transactions } = useQuery({
    queryKey: ["transactions", firstDayOfMonth, lastDayOfMonth, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fluxo_de_caixa")
        .select("*")
        .eq("user_id", user?.id)
        .gte("data", firstDayOfMonth.toISOString())
        .lte("data", lastDayOfMonth.toISOString());
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar consultas do dia
  const { data: todayAppointments } = useQuery({
    queryKey: ["today-appointments", today, user?.id],
    queryFn: async () => {
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      const { data, error } = await supabase
        .from("consultas")
        .select(`
          *,
          pacientes (nome)
        `)
        .eq("user_id", user?.id)
        .gte("data_agendamento", startOfDay.toISOString())
        .lte("data_agendamento", endOfDay.toISOString())
        .order("data_agendamento", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar novos pacientes do mês
  const { data: newPatients } = useQuery({
    queryKey: ["new-patients", firstDayOfMonth, user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("pacientes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .gte("data_cadastro", firstDayOfMonth.toISOString());
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Buscar consultas concluídas do mês
  const { data: completedAppointments } = useQuery({
    queryKey: ["completed-appointments", firstDayOfMonth, user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("consultas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .eq("status", "concluída")
        .gte("data_agendamento", firstDayOfMonth.toISOString());
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Calcular KPIs financeiros
  const receitas = transactions?.filter(t => t.tipo_transacao === "receita").reduce((sum, t) => sum + Number(t.valor || 0), 0) || 0;
  const despesas = transactions?.filter(t => t.tipo_transacao === "despesa").reduce((sum, t) => sum + Number(t.valor || 0), 0) || 0;
  const saldoLiquido = receitas - despesas;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Agendar Consulta
          </Button>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Despesa
          </Button>
        </div>
      </div>

      {/* KPIs Financeiros */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Caixa Realizado no Mês"
          value={formatCurrency(receitas)}
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title="Despesas do Mês"
          value={formatCurrency(despesas)}
          icon={TrendingDown}
          variant="destructive"
        />
        <KPICard
          title="Saldo Líquido do Caixa"
          value={formatCurrency(saldoLiquido)}
          icon={Wallet}
          variant={saldoLiquido >= 0 ? "default" : "destructive"}
        />
        <KPICard
          title="Faturamento Apurado"
          value={formatCurrency(receitas)}
          icon={TrendingUp}
          variant="primary"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Próximas Consultas do Dia */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Consultas de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {format(new Date(appointment.data_agendamento), "HH:mm")}
                        </span>
                        <Link
                          to={`/pacientes/${appointment.paciente_id}`}
                          className="text-primary hover:underline"
                        >
                          {appointment.pacientes?.nome}
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {appointment.tipo_consulta || "Consulta"}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(appointment.status || "pendente")}>
                      {appointment.status || "pendente"}
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

        {/* Resumo de Pacientes */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Novos Pacientes</p>
                  <p className="text-2xl font-bold">{newPatients}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-success/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <FileText className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consultas Realizadas</p>
                  <p className="text-2xl font-bold">{completedAppointments}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
