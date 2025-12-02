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
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { EfetivarConsultaModal } from "@/components/modals/EfetivarConsultaModal";
import { EditarObservacoesModal } from "@/components/modals/EditarObservacoesModal";

// Dados estáticos de demonstração
const MOCK_TRANSACTIONS = [
  { id: "1", tipo_transacao: "receita", valor: 350, data: "2025-12-01", descricao: "Consulta - Maria Silva" },
  { id: "2", tipo_transacao: "receita", valor: 350, data: "2025-12-01", descricao: "Consulta - João Santos" },
  { id: "3", tipo_transacao: "despesa", valor: 150, data: "2025-12-02", descricao: "Material de escritório" },
  { id: "4", tipo_transacao: "receita", valor: 500, data: "2025-12-02", descricao: "Plano mensal - Ana Costa" },
];

const MOCK_CONSULTAS = [
  { id: "1", pacientes: { nome: "Maria Silva" }, data_agendamento: "2025-12-02T09:00:00", tipo_consulta: "Primeira consulta", status: "pendente" },
  { id: "2", pacientes: { nome: "João Santos" }, data_agendamento: "2025-12-02T10:30:00", tipo_consulta: "Retorno", status: "confirmada" },
  { id: "3", pacientes: { nome: "Ana Costa" }, data_agendamento: "2025-12-02T14:00:00", tipo_consulta: "Acompanhamento", status: "pendente" },
  { id: "4", pacientes: { nome: "Carlos Ferreira" }, data_agendamento: "2025-12-01T11:00:00", tipo_consulta: "Retorno", status: "concluída" },
];

const MOCK_STATS = {
  pacientesAtivos: 12,
  consultasRealizadas: 28,
  novosPacientes: 5,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [valoresVisiveis, setValoresVisiveis] = useState(true);
  const [consultaSelecionada, setConsultaSelecionada] = useState<any>(null);
  const [modalEfetivarOpen, setModalEfetivarOpen] = useState(false);
  const [modalEditarObsOpen, setModalEditarObsOpen] = useState(false);
  const [periodoFiltro, setPeriodoFiltro] = useState<"hoje" | "semana" | "mes">("hoje");

  // Cálculos com dados estáticos
  const totalReceitas = MOCK_TRANSACTIONS
    .filter((t) => t.tipo_transacao === "receita")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const totalDespesas = MOCK_TRANSACTIONS
    .filter((t) => t.tipo_transacao === "despesa")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const saldo = totalReceitas - totalDespesas;

  // Filtrar consultas baseado no período (simplificado para demo)
  const consultasFiltradas = MOCK_CONSULTAS;

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
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setValoresVisiveis(!valoresVisiveis)}
              className="h-7 w-7 md:h-8 md:w-8 shrink-0"
            >
              {valoresVisiveis ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Bem-vindo, {user?.user_metadata?.full_name || "Administrador"}
          </p>
        </div>
      </div>

      {/* KPIs Financeiros */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Pacientes Ativos"
          value={MOCK_STATS.pacientesAtivos.toString()}
          icon={Users}
        />
        <KPICard
          title="Consultas Realizadas"
          value={MOCK_STATS.consultasRealizadas.toString()}
          icon={Calendar}
        />
        <KPICard
          title="Novos Pacientes"
          value={MOCK_STATS.novosPacientes.toString()}
          icon={Users}
        />
      </div>

      {/* Consultas por Período */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
              Consultas
            </CardTitle>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <Button
                variant={periodoFiltro === "hoje" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFiltro("hoje")}
                className="shrink-0"
              >
                Hoje
              </Button>
              <Button
                variant={periodoFiltro === "semana" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFiltro("semana")}
                className="shrink-0"
              >
                Esta Semana
              </Button>
              <Button
                variant={periodoFiltro === "mes" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodoFiltro("mes")}
                className="shrink-0"
              >
                Este Mês
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {consultasFiltradas && consultasFiltradas.length > 0 ? (
            <div className="space-y-3">
              {consultasFiltradas.map((consulta) => {
                const isConcluida = consulta.status === "concluída";
                return (
                  <div
                    key={consulta.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border transition-colors ${
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
                        <p className="font-medium text-sm md:text-base text-primary">
                          {consulta.pacientes?.nome}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {format(parseISO(consulta.data_agendamento), "dd/MM/yyyy HH:mm")}
                          {consulta.tipo_consulta && ` - ${consulta.tipo_consulta}`}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Badge variant={getStatusBadge(consulta.status || "pendente")} className="text-xs">
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
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs md:text-sm text-muted-foreground text-center py-8">
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
