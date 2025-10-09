import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle, MoreVertical } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EfetivarConsultaModal } from "@/components/modals/EfetivarConsultaModal";
import { NovaConsultaModal } from "@/components/modals/NovaConsultaModal";
import { EditarObservacoesModal } from "@/components/modals/EditarObservacoesModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Agenda() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [consultaSelecionada, setConsultaSelecionada] = useState<any>(null);
  const [modalEfetivarOpen, setModalEfetivarOpen] = useState(false);
  const [modalNovaConsultaOpen, setModalNovaConsultaOpen] = useState(false);
  const [modalEditarObservacoesOpen, setModalEditarObservacoesOpen] = useState(false);
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calcular o primeiro dia da semana do mês e adicionar dias vazios no início
  const firstDayOfMonth = getDay(monthStart); // 0 = Domingo, 1 = Segunda, etc.
  const emptyDays = Array(firstDayOfMonth).fill(null);

  const { data: consultas, isLoading: isLoadingConsultas } = useQuery({
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

  const { data: bloqueios, isLoading: isLoadingBloqueios } = useQuery({
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

  const isLoading = isLoadingConsultas || isLoadingBloqueios;

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
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie seus agendamentos e disponibilidade
          </p>
        </div>
        <Button onClick={() => setModalNovaConsultaOpen(true)} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Consulta
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:gap-6 lg:grid lg:grid-cols-3">
        {/* Calendário */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
                {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                  className="shrink-0"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className="shrink-0"
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                  className="shrink-0"
                >
                  Próximo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="text-center text-xs md:text-sm font-medium text-muted-foreground p-1 md:p-2">
                  {day}
                </div>
              ))}
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}
              {daysInMonth.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-1 md:p-2 rounded-md md:rounded-lg text-xs md:text-sm transition-colors relative
                    ${isSameDay(day, selectedDate) ? "bg-primary text-primary-foreground font-bold" : "hover:bg-accent"}
                    ${isSameDay(day, new Date()) && !isSameDay(day, selectedDate) ? "border border-primary md:border-2" : ""}
                    ${hasConsultas(day) ? "ring-1 ring-success md:ring-2 ring-offset-1 md:ring-offset-2" : ""}
                    ${hasBloqueio(day) ? "bg-destructive/10 text-destructive" : ""}
                  `}
                >
                  {format(day, "d")}
                  {hasConsultas(day) && (
                    <div className="absolute bottom-0.5 md:bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-success" />
                  )}
                </button>
              ))}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Consultas do Dia */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
            consultasDoDia && consultasDoDia.length > 0 ? (
              <div className="space-y-3">
                {consultasDoDia.map((consulta) => {
                  const isConcluida = consulta.status === "concluída";
                  return (
                    <div
                      key={consulta.id}
                      className={`p-3 rounded-lg border bg-card transition-colors ${
                        isConcluida ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-xs md:text-sm">
                          {format(parseISO(consulta.data_agendamento), "HH:mm")}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadge(consulta.status || "pendente")} className="text-xs">
                            {consulta.status}
                          </Badge>
                          {!isConcluida ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                setConsultaSelecionada(consulta);
                                setModalEfetivarOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setConsultaSelecionada(consulta);
                                    setModalEditarObservacoesOpen(true);
                                  }}
                                >
                                  Editar Observações
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/pacientes/${consulta.paciente_id}`}
                        className="text-xs md:text-sm text-primary hover:underline block mb-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {consulta.pacientes?.nome}
                      </Link>
                      {consulta.tipo_consulta && (
                        <p className="text-xs text-muted-foreground">
                          {consulta.tipo_consulta}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs md:text-sm text-muted-foreground text-center py-8">
                Nenhuma consulta agendada para este dia
              </p>
            )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <NovaConsultaModal
        open={modalNovaConsultaOpen}
        onOpenChange={setModalNovaConsultaOpen}
      />
      
      {consultaSelecionada && (
        <>
          <EfetivarConsultaModal
            open={modalEfetivarOpen}
            onOpenChange={setModalEfetivarOpen}
            consulta={consultaSelecionada}
          />
          <EditarObservacoesModal
            open={modalEditarObservacoesOpen}
            onOpenChange={setModalEditarObservacoesOpen}
            consulta={consultaSelecionada}
          />
        </>
      )}

      {/* Bloqueios */}
      {bloqueios && bloqueios.length > 0 && (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Bloqueios de Agenda</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3">
              {bloqueios.map((bloqueio) => (
                <div key={bloqueio.id} className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm md:text-base">
                      {format(parseISO(bloqueio.data_inicio), "dd/MM/yyyy")} até{" "}
                      {format(parseISO(bloqueio.data_fim), "dd/MM/yyyy")}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">{bloqueio.motivo}</p>
                  </div>
                  {bloqueio.dia_inteiro && (
                    <Badge variant="outline" className="self-start md:self-auto">Dia Inteiro</Badge>
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
