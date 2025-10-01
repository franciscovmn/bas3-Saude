import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Agenda() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: consultas } = useQuery({
    queryKey: ["consultas-mes", selectedDate, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select(`
          *,
          pacientes (nome)
        `)
        .eq("user_id", user?.id)
        .gte("data_agendamento", monthStart.toISOString())
        .lte("data_agendamento", monthEnd.toISOString())
        .order("data_agendamento");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: bloqueios } = useQuery({
    queryKey: ["bloqueios", selectedDate, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bloqueios_agenda")
        .select("*")
        .eq("user_id", user?.id)
        .gte("data_fim", monthStart.toISOString())
        .lte("data_inicio", monthEnd.toISOString());

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const consultasDoDia = consultas?.filter((c) =>
    isSameDay(parseISO(c.data_agendamento), selectedDate)
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pendente: "outline",
      confirmada: "default",
      concluída: "secondary",
      cancelada: "destructive",
    };
    return variants[status] || "default";
  };

  const hasConsultas = (date: Date) => {
    return consultas?.some((c) => isSameDay(parseISO(c.data_agendamento), date));
  };

  const hasBloqueio = (date: Date) => {
    return bloqueios?.some((b) => {
      const inicio = parseISO(b.data_inicio);
      const fim = parseISO(b.data_fim);
      return date >= inicio && date <= fim;
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie seus agendamentos e disponibilidade
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Consulta
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendário */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                >
                  Próximo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              {daysInMonth.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-2 rounded-lg text-sm transition-colors relative
                    ${isSameDay(day, selectedDate) ? "bg-primary text-primary-foreground font-bold" : "hover:bg-accent"}
                    ${isSameDay(day, new Date()) && !isSameDay(day, selectedDate) ? "border-2 border-primary" : ""}
                    ${hasConsultas(day) ? "ring-2 ring-success ring-offset-2" : ""}
                    ${hasBloqueio(day) ? "bg-destructive/10 text-destructive" : ""}
                  `}
                >
                  {format(day, "d")}
                  {hasConsultas(day) && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-success" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Consultas do Dia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consultasDoDia && consultasDoDia.length > 0 ? (
              <div className="space-y-3">
                {consultasDoDia.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {format(parseISO(consulta.data_agendamento), "HH:mm")}
                      </span>
                      <Badge variant={getStatusBadge(consulta.status || "pendente")} className="text-xs">
                        {consulta.status}
                      </Badge>
                    </div>
                    <Link
                      to={`/pacientes/${consulta.paciente_id}`}
                      className="text-sm text-primary hover:underline block mb-1"
                    >
                      {consulta.pacientes?.nome}
                    </Link>
                    {consulta.tipo_consulta && (
                      <p className="text-xs text-muted-foreground">
                        {consulta.tipo_consulta}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma consulta agendada para este dia
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bloqueios */}
      {bloqueios && bloqueios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bloqueios de Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bloqueios.map((bloqueio) => (
                <div key={bloqueio.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">
                      {format(parseISO(bloqueio.data_inicio), "dd/MM/yyyy")} até{" "}
                      {format(parseISO(bloqueio.data_fim), "dd/MM/yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">{bloqueio.motivo}</p>
                  </div>
                  {bloqueio.dia_inteiro && (
                    <Badge variant="outline">Dia Inteiro</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
