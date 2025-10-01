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

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: pacientes, isLoading } = useQuery({
    queryKey: ["pacientes", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("pacientes")
        .select(`
          *,
          planos_fidelizacao (nome_plano)
        `)
        .order("data_cadastro", { ascending: false });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredPacientes = pacientes?.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
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
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pacientes do consultório
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "novo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("novo")}
          >
            Novos
          </Button>
          <Button
            variant={statusFilter === "ativo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ativo")}
          >
            Ativos
          </Button>
          <Button
            variant={statusFilter === "inativo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("inativo")}
          >
            Inativos
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
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
                    {paciente.planos_fidelizacao?.nome_plano || "Cliente Avulso"}
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
    </div>
  );
}
