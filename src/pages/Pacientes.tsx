import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NovoPacienteModal } from "@/components/modals/NovoPacienteModal";

export default function Pacientes() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [modalNovoOpen, setModalNovoOpen] = useState(false);

  const { data: pacientes, isLoading } = useQuery({
    queryKey: ["pacientes", statusFilter, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("pacientes")
        .select(`
          *,
          planos_fidelizacao (nome_plano, renovacao_automatica)
        `)
        .eq("user_id", user?.id)
        .order("data_cadastro", { ascending: false });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const filteredPacientes = pacientes?.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Filter based on plan's recurrence setting
    if (statusFilter === "com vinculo") {
      return p.planos_fidelizacao?.renovacao_automatica === true;
    }
    if (statusFilter === "sem vinculo") {
      return !p.plano_fidelizacao_id || p.planos_fidelizacao?.renovacao_automatica === false;
    }
    
    return true;
  });

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      novo: "default",
      ativo: "secondary",
      inativo: "outline",
    };
    return variants[status] || "default";
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie todos os pacientes do consultório
          </p>
        </div>
        <Button onClick={() => setModalNovoOpen(true)} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
            className="flex-1 sm:flex-none"
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "paciente novo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("paciente novo")}
            className="flex-1 sm:flex-none"
          >
            Novo
          </Button>
          <Button
            variant={statusFilter === "com vinculo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("com vinculo")}
            className="flex-1 sm:flex-none"
          >
            Com Vínculo
          </Button>
          <Button
            variant={statusFilter === "sem vinculo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("sem vinculo")}
            className="flex-1 sm:flex-none"
          >
            Sem Vínculo
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plano Atual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredPacientes && filteredPacientes.length > 0 ? (
              filteredPacientes.map((paciente) => (
                <TableRow key={paciente.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      to={`/pacientes/${paciente.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {paciente.nome}
                    </Link>
                  </TableCell>
                  <TableCell>{paciente.telefone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(paciente.status || "novo")}>
                      {paciente.status || "novo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {paciente.planos_fidelizacao?.nome_plano || "A se definir"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum paciente encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <NovoPacienteModal open={modalNovoOpen} onOpenChange={setModalNovoOpen} />
    </div>
  );
}
