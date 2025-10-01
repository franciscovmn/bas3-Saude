import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Calendar, CreditCard, Tag, Plus } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DisponibilidadeModal } from "@/components/modals/DisponibilidadeModal";
import { BloqueioModal } from "@/components/modals/BloqueioModal";
import { PlanoModal } from "@/components/modals/PlanoModal";
import { CategoriaModal } from "@/components/modals/CategoriaModal";

export default function Configuracoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados dos modais
  const [modalDispOpen, setModalDispOpen] = useState(false);
  const [modalBloqOpen, setModalBloqOpen] = useState(false);
  const [modalPlanoOpen, setModalPlanoOpen] = useState(false);
  const [modalCatOpen, setModalCatOpen] = useState(false);
  
  // Estados de edição
  const [dispEdit, setDispEdit] = useState<any>(null);
  const [planoEdit, setPlanoEdit] = useState<any>(null);
  
  // Estados de exclusão
  const [alertOpen, setAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: any } | null>(null);

  const { data: disponibilidade } = useQuery({
    queryKey: ["disponibilidade", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disponibilidade")
        .select("*")
        .eq("user_id", user?.id)
        .order("dia_semana");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: bloqueios } = useQuery({
    queryKey: ["bloqueios-config", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bloqueios_agenda")
        .select("*")
        .eq("user_id", user?.id)
        .gte("data_fim", new Date().toISOString())
        .order("data_inicio");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: planos } = useQuery({
    queryKey: ["planos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_fidelizacao")
        .select("*")
        .order("preco");

      if (error) throw error;
      return data;
    },
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_despesa")
        .select("*")
        .order("nome_categoria");

      if (error) throw error;
      return data;
    },
  });

  const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!itemToDelete) return;

      let error;
      
      if (itemToDelete.type === "disponibilidade") {
        const result = await supabase.from("disponibilidade").delete().eq("id", itemToDelete.id);
        error = result.error;
      } else if (itemToDelete.type === "bloqueio") {
        const result = await supabase.from("bloqueios_agenda").delete().eq("id", itemToDelete.id);
        error = result.error;
      } else if (itemToDelete.type === "plano") {
        const result = await supabase.from("planos_fidelizacao").delete().eq("id", itemToDelete.id);
        error = result.error;
      } else if (itemToDelete.type === "categoria") {
        const result = await supabase.from("categorias_despesa").delete().eq("id", itemToDelete.id);
        error = result.error;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      if (!itemToDelete) return;
      
      const queries: Record<string, string[]> = {
        disponibilidade: ["disponibilidade"],
        bloqueio: ["bloqueios", "bloqueios-config"],
        plano: ["planos"],
        categoria: ["categorias"],
      };

      queries[itemToDelete.type]?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });

      toast.success("Item excluído com sucesso!");
      setAlertOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir item. Tente novamente.");
    },
  });

  const handleDelete = (type: string, id: any) => {
    setItemToDelete({ type, id });
    setAlertOpen(true);
  };

  const handleEdit = (type: string, item: any) => {
    if (type === "disponibilidade") {
      setDispEdit(item);
      setModalDispOpen(true);
    } else if (type === "plano") {
      setPlanoEdit(item);
      setModalPlanoOpen(true);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Configure as regras do seu consultório
          </p>
        </div>
      </div>

      <Tabs defaultValue="disponibilidade" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="disponibilidade">Disponibilidade</TabsTrigger>
          <TabsTrigger value="bloqueios">Bloqueios</TabsTrigger>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
        </TabsList>

        {/* Aba Disponibilidade */}
        <TabsContent value="disponibilidade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horários de Trabalho
              </CardTitle>
              <CardDescription>
                Defina seus horários de atendimento para cada dia da semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => { setDispEdit(null); setModalDispOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Horário
                </Button>

                {disponibilidade && disponibilidade.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dia da Semana</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Fim</TableHead>
                        <TableHead>Intervalo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disponibilidade.map((disp) => (
                        <TableRow key={disp.id}>
                          <TableCell className="font-medium">
                            {diasSemana[disp.dia_semana]}
                          </TableCell>
                          <TableCell>{disp.hora_inicio}</TableCell>
                          <TableCell>{disp.hora_fim}</TableCell>
                          <TableCell>
                            {disp.intervalo_inicio && disp.intervalo_fim
                              ? `${disp.intervalo_inicio} - ${disp.intervalo_fim}`
                              : "Sem intervalo"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit("disponibilidade", disp)}>
                                Editar
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete("disponibilidade", disp.id)}>
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum horário configurado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Bloqueios */}
        <TabsContent value="bloqueios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Bloqueios de Agenda
              </CardTitle>
              <CardDescription>
                Gerencie períodos de ausência e férias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => setModalBloqOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Bloqueio
                </Button>

                {bloqueios && bloqueios.length > 0 ? (
                  <div className="space-y-3">
                    {bloqueios.map((bloqueio) => (
                      <div
                        key={bloqueio.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">
                            {new Date(bloqueio.data_inicio).toLocaleDateString("pt-BR")} até{" "}
                            {new Date(bloqueio.data_fim).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-sm text-muted-foreground">{bloqueio.motivo}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {bloqueio.dia_inteiro && (
                            <Badge variant="outline">Dia Inteiro</Badge>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("bloqueio", bloqueio.id)}>
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum bloqueio configurado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Planos */}
        <TabsContent value="planos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Planos de Fidelização
              </CardTitle>
              <CardDescription>
                Crie e gerencie planos de consultas para seus pacientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => { setPlanoEdit(null); setModalPlanoOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Plano
                </Button>

                {planos && planos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Plano</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Consultas</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planos.map((plano) => (
                        <TableRow key={plano.id}>
                          <TableCell className="font-medium">{plano.nome_plano}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(plano.preco))}
                          </TableCell>
                          <TableCell>{plano.quantidade_consultas} consultas</TableCell>
                          <TableCell>{plano.duracao_meses} meses</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit("plano", plano)}>
                                Editar
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete("plano", plano.id)}>
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum plano cadastrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Categorias */}
        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categorias de Despesa
              </CardTitle>
              <CardDescription>
                Organize suas despesas por categorias personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => setModalCatOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>

                {categorias && categorias.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {categorias.map((categoria) => (
                      <div
                        key={categoria.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <Badge variant="outline">{categoria.nome_categoria}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("categoria", categoria.id)}>
                          Excluir
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma categoria cadastrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <DisponibilidadeModal 
        open={modalDispOpen} 
        onOpenChange={(open) => {
          setModalDispOpen(open);
          if (!open) setDispEdit(null);
        }}
        disponibilidade={dispEdit}
      />
      <BloqueioModal open={modalBloqOpen} onOpenChange={setModalBloqOpen} />
      <PlanoModal 
        open={modalPlanoOpen} 
        onOpenChange={(open) => {
          setModalPlanoOpen(open);
          if (!open) setPlanoEdit(null);
        }}
        plano={planoEdit}
      />
      <CategoriaModal open={modalCatOpen} onOpenChange={setModalCatOpen} />

      {/* Alert Dialog de Confirmação */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
